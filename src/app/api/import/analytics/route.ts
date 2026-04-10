import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queryAnalytics } from "@/lib/analytics-db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function importKey(orgId: string) {
  return `import:analytics:${orgId}`;
}

interface ImportState {
  status: "RUNNING" | "DONE" | "ERROR";
  startedAt: string;
  finishedAt?: string;
  currentStage: string;
  error?: string;
  log: { time: string; text: string }[];
  counts: Record<string, number>;
  totals: Record<string, number>;
}

async function getOrgFromSession() {
  const session = await getServerSession(authOptions);
  const user = session?.user as {
    id?: string;
    orgId?: string | null;
    externalOrgId?: string | null;
    email?: string;
  } | undefined;

  if (!user?.id) return null;

  if (user.orgId && user.externalOrgId) {
    return { crmOrgId: user.orgId, analyticsOrgId: user.externalOrgId };
  }

  const org = await prisma.org.findFirst({
    where: { members: { some: { user: { email: user.email ?? "" } } } },
    select: { id: true, externalId: true },
  });
  if (!org) return null;
  return { crmOrgId: org.id, analyticsOrgId: org.externalId };
}

// GET — poll current import status
export async function GET() {
  const orgInfo = await getOrgFromSession();
  if (!orgInfo) return Response.json({ status: "NO_AUTH" }, { status: 401 });

  const key = importKey(orgInfo.crmOrgId);
  const setting = await prisma.systemSetting.findUnique({ where: { key } });

  if (!setting) {
    return Response.json({ status: "IDLE" });
  }

  return Response.json(setting.value);
}

// POST — start import (returns immediately, runs in background)
export async function POST() {
  const orgInfo = await getOrgFromSession();
  if (!orgInfo) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { crmOrgId, analyticsOrgId } = orgInfo;
  const key = importKey(crmOrgId);

  const existing = await prisma.systemSetting.findUnique({ where: { key } });
  if (existing) {
    const state = existing.value as unknown as ImportState;
    if (state.status === "RUNNING") {
      return Response.json({ error: "Import already running", state }, { status: 409 });
    }
  }

  const initial: ImportState = {
    status: "RUNNING",
    startedAt: new Date().toISOString(),
    currentStage: "INIT",
    log: [{ time: new Date().toISOString(), text: "Импорт запущен" }],
    counts: {},
    totals: {},
  };

  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: initial as any },
    create: { key, value: initial as any },
  });

  // Fire and forget — runs in background
  runImport(crmOrgId, analyticsOrgId, key).catch(() => {});

  return Response.json({ status: "STARTED" });
}

// DELETE — reset import state (allow re-run)
export async function DELETE() {
  const orgInfo = await getOrgFromSession();
  if (!orgInfo) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const key = importKey(orgInfo.crmOrgId);
  await prisma.systemSetting.deleteMany({ where: { key } });
  return Response.json({ status: "RESET" });
}

// ─── Background import ────────────────────────────────────────────────────────

async function updateState(key: string, patch: Partial<ImportState> & { logLine?: string }) {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  if (!setting) return;

  const state = setting.value as unknown as ImportState;

  if (patch.currentStage) state.currentStage = patch.currentStage;
  if (patch.status) state.status = patch.status;
  if (patch.finishedAt) state.finishedAt = patch.finishedAt;
  if (patch.error) state.error = patch.error;
  if (patch.counts) Object.assign(state.counts, patch.counts);
  if (patch.totals) Object.assign(state.totals, patch.totals);
  if (patch.logLine) {
    state.log.push({ time: new Date().toISOString(), text: patch.logLine });
    if (state.log.length > 50) state.log = state.log.slice(-50);
  }

  await prisma.systemSetting.update({
    where: { key },
    data: { value: state as any },
  });
}

async function runImport(crmOrgId: string, analyticsOrgId: string, key: string) {
  try {
    // ── 1. Pipelines ──────────────────────────────────────────────────────
    await updateState(key, { currentStage: "PIPELINES", logLine: "Загрузка воронок из аналитики..." });

    const pipelines = await queryAnalytics(
      `SELECT "id","externalId","name","sort","entityType","isDeleted"
       FROM "CrmPipeline" WHERE "orgId"=$1`,
      [analyticsOrgId],
    );
    const pipelineMap = new Map<string, string>();

    for (const p of pipelines) {
      const row = p as Record<string, unknown>;
      const sourceId = String(row.externalId);
      const result = await prisma.pipeline.upsert({
        where: { orgId_sourceId: { orgId: crmOrgId, sourceId } },
        update: { name: String(row.name ?? "Без названия"), sortOrder: Number(row.sort ?? 0) },
        create: { orgId: crmOrgId, sourceId, name: String(row.name ?? "Без названия"), sortOrder: Number(row.sort ?? 0) },
        select: { id: true },
      });
      pipelineMap.set(sourceId, result.id);
    }

    await updateState(key, {
      counts: { pipelines: pipelines.length },
      logLine: `Воронки: ${pipelines.length} загружено`,
    });

    // ── 2. Stages ─────────────────────────────────────────────────────────
    await updateState(key, { currentStage: "STAGES", logLine: "Загрузка стадий..." });

    const stages = await queryAnalytics(
      `SELECT "id","externalId","pipelineId","name","semantics","sort","isDeleted"
       FROM "CrmStage" WHERE "orgId"=$1`,
      [analyticsOrgId],
    );

    const pipelineIdToExternal = new Map<string, string>();
    for (const p of pipelines) {
      const row = p as Record<string, unknown>;
      pipelineIdToExternal.set(String(row.id), String(row.externalId));
    }

    const stageMap = new Map<string, string>();
    for (const s of stages) {
      const row = s as Record<string, unknown>;
      const sourceId = String(row.externalId);
      const pipelineExternalId = pipelineIdToExternal.get(String(row.pipelineId));
      const pipelineId = pipelineExternalId ? pipelineMap.get(pipelineExternalId) : undefined;
      if (!pipelineId) continue;

      const semantics = row.semantics ? String(row.semantics) : null;
      const isFinal = semantics === "S" || semantics === "F";
      const isWon = semantics === "S";
      const colorMap: Record<string, string> = { S: "#22c55e", F: "#ef4444", P: "#3b82f6" };

      const result = await prisma.stage.upsert({
        where: { orgId_sourceId: { orgId: crmOrgId, sourceId } },
        update: { pipelineId, name: String(row.name ?? ""), sortOrder: Number(row.sort ?? 0), semantics, isFinal, isWon },
        create: {
          orgId: crmOrgId, pipelineId, sourceId, name: String(row.name ?? ""),
          sortOrder: Number(row.sort ?? 0), semantics, isFinal, isWon,
          color: colorMap[semantics ?? "P"] ?? "#6b7280",
        },
        select: { id: true },
      });
      stageMap.set(sourceId, result.id);
    }

    await updateState(key, { counts: { stages: stages.length }, logLine: `Стадии: ${stages.length} загружено` });

    // ── 3. Companies ──────────────────────────────────────────────────────
    await updateState(key, { currentStage: "COMPANIES", logLine: "Загрузка компаний..." });

    const companies = await queryAnalytics(
      `SELECT "id","externalId","name","inn","customFields","isDeleted","bitrixUpdatedAt"
       FROM "Company" WHERE "orgId"=$1`,
      [analyticsOrgId],
    );

    const companyMap = new Map<string, string>();
    const companyIdToExternal = new Map<string, string>();

    for (const c of companies) {
      const row = c as Record<string, unknown>;
      const sourceId = String(row.externalId);
      companyIdToExternal.set(String(row.id), sourceId);

      const result = await prisma.company.upsert({
        where: { orgId_sourceId: { orgId: crmOrgId, sourceId } },
        update: {
          name: String(row.name ?? "Без названия"), inn: row.inn ? String(row.inn) : null,
          customFields: row.customFields as any ?? undefined,
          isDeleted: Boolean(row.isDeleted),
          bitrixUpdatedAt: row.bitrixUpdatedAt ? new Date(row.bitrixUpdatedAt as string) : null,
          syncedAt: new Date(),
        },
        create: {
          orgId: crmOrgId, sourceId, name: String(row.name ?? "Без названия"),
          inn: row.inn ? String(row.inn) : null,
          customFields: row.customFields as any ?? undefined,
          isDeleted: Boolean(row.isDeleted),
          bitrixUpdatedAt: row.bitrixUpdatedAt ? new Date(row.bitrixUpdatedAt as string) : null,
          syncedAt: new Date(),
        },
        select: { id: true },
      });
      companyMap.set(sourceId, result.id);
    }

    await updateState(key, { counts: { companies: companies.length }, logLine: `Компании: ${companies.length}` });

    // ── 4. Contacts ───────────────────────────────────────────────────────
    await updateState(key, { currentStage: "CONTACTS", logLine: "Загрузка контактов..." });

    const contacts = await queryAnalytics(
      `SELECT "id","externalId","name","firstName","lastName","primaryPhone","primaryEmail",
              "primaryIM","customFields","companyId","isDeleted","bitrixUpdatedAt"
       FROM "Contact" WHERE "orgId"=$1`,
      [analyticsOrgId],
    );

    await updateState(key, { totals: { contacts: contacts.length }, logLine: `Найдено ${contacts.length} контактов, записываю...` });

    const contactMap = new Map<string, string>();
    const contactIdToExternal = new Map<string, string>();
    let contactCount = 0;

    for (const ct of contacts) {
      const row = ct as Record<string, unknown>;
      const sourceId = String(row.externalId);
      contactIdToExternal.set(String(row.id), sourceId);

      let firstName = row.firstName ? String(row.firstName) : "";
      let lastName = row.lastName ? String(row.lastName) : "";
      if (!firstName && !lastName && row.name) {
        const parts = String(row.name).split(" ");
        firstName = parts[0] ?? "";
        lastName = parts.slice(1).join(" ");
      }
      if (!firstName) firstName = "Контакт";

      let companyId: string | null = null;
      if (row.companyId) {
        const compExtId = companyIdToExternal.get(String(row.companyId));
        if (compExtId) companyId = companyMap.get(compExtId) ?? null;
      }

      const result = await prisma.contact.upsert({
        where: { orgId_sourceId: { orgId: crmOrgId, sourceId } },
        update: {
          firstName, lastName,
          phone: row.primaryPhone ? String(row.primaryPhone) : null,
          email: row.primaryEmail ? String(row.primaryEmail) : null,
          primaryIM: row.primaryIM ? String(row.primaryIM) : null,
          customFields: row.customFields as any ?? undefined,
          companyId, isDeleted: Boolean(row.isDeleted),
          bitrixUpdatedAt: row.bitrixUpdatedAt ? new Date(row.bitrixUpdatedAt as string) : null,
          syncedAt: new Date(),
        },
        create: {
          orgId: crmOrgId, sourceId, firstName, lastName,
          phone: row.primaryPhone ? String(row.primaryPhone) : null,
          email: row.primaryEmail ? String(row.primaryEmail) : null,
          primaryIM: row.primaryIM ? String(row.primaryIM) : null,
          customFields: row.customFields as any ?? undefined,
          companyId, isDeleted: Boolean(row.isDeleted),
          bitrixUpdatedAt: row.bitrixUpdatedAt ? new Date(row.bitrixUpdatedAt as string) : null,
          syncedAt: new Date(),
        },
        select: { id: true },
      });
      contactMap.set(sourceId, result.id);
      contactCount++;
      if (contactCount % 500 === 0) {
        await updateState(key, { counts: { contacts: contactCount }, logLine: `Контакты: ${contactCount} / ${contacts.length}` });
      }
    }

    await updateState(key, { counts: { contacts: contactCount }, logLine: `Контакты: ${contactCount} записано` });

    // ── 5. Channels ───────────────────────────────────────────────────────
    await updateState(key, { currentStage: "CHANNELS", logLine: "Каналы связи..." });

    const channels = await queryAnalytics(
      `SELECT "id","externalId","type","value","isPrimary","messengerType","contactId","companyId","isDeleted"
       FROM "CommunicationChannel" WHERE "orgId"=$1`,
      [analyticsOrgId],
    );

    let channelCount = 0;
    for (const ch of channels) {
      const row = ch as Record<string, unknown>;
      const sourceId = String(row.externalId);
      const channelType = ({ PHONE: "PHONE", EMAIL: "EMAIL", IM: "IM" } as Record<string, string>)[String(row.type)] ?? "PHONE";

      let contactId: string | null = null;
      if (row.contactId) {
        const ctExtId = contactIdToExternal.get(String(row.contactId));
        if (ctExtId) contactId = contactMap.get(ctExtId) ?? null;
      }
      let companyId: string | null = null;
      if (row.companyId) {
        const coExtId = companyIdToExternal.get(String(row.companyId));
        if (coExtId) companyId = companyMap.get(coExtId) ?? null;
      }
      if (!contactId && !companyId) continue;

      try {
        await prisma.communicationChannel.upsert({
          where: { id: sourceId },
          update: {
            type: channelType as any, value: String(row.value),
            isPrimary: Boolean(row.isPrimary), messengerType: row.messengerType ? String(row.messengerType) : null,
            contactId, companyId, isDeleted: Boolean(row.isDeleted), syncedAt: new Date(),
          },
          create: {
            orgId: crmOrgId, sourceId, type: channelType as any, value: String(row.value),
            isPrimary: Boolean(row.isPrimary), messengerType: row.messengerType ? String(row.messengerType) : null,
            contactId, companyId, isDeleted: Boolean(row.isDeleted), syncedAt: new Date(),
          },
        });
        channelCount++;
      } catch { /* skip */ }
    }

    await updateState(key, { counts: { channels: channelCount }, logLine: `Каналы связи: ${channelCount}` });

    // ── 6. Deals ──────────────────────────────────────────────────────────
    await updateState(key, { currentStage: "DEALS", logLine: "Загрузка сделок..." });

    const deals = await queryAnalytics(
      `SELECT "id","externalId","title","stageExternalId","pipelineExternalId",
              "opportunity","currencyId","assignedByExternalId","contactExternalId",
              "companyExternalId","dateCreate","dateModify","rawPayload","isDeleted","bitrixUpdatedAt"
       FROM "CrmDeal" WHERE "orgId"=$1`,
      [analyticsOrgId],
    );

    await updateState(key, { totals: { deals: deals.length }, logLine: `Найдено ${deals.length} сделок, записываю...` });

    const dealMap = new Map<string, string>();
    const dealIdToExternal = new Map<string, string>();
    let dealCount = 0;

    for (const d of deals) {
      const row = d as Record<string, unknown>;
      const sourceId = String(row.externalId);
      dealIdToExternal.set(String(row.id), sourceId);

      const pipelineId = row.pipelineExternalId ? pipelineMap.get(String(row.pipelineExternalId)) ?? null : null;
      const stageId = row.stageExternalId ? stageMap.get(String(row.stageExternalId)) ?? null : null;
      const contactId = row.contactExternalId ? contactMap.get(String(row.contactExternalId)) ?? null : null;
      const companyId = row.companyExternalId ? companyMap.get(String(row.companyExternalId)) ?? null : null;
      const value = row.opportunity ? Number(row.opportunity) : 0;

      const result = await prisma.deal.upsert({
        where: { orgId_sourceId: { orgId: crmOrgId, sourceId } },
        update: {
          title: String(row.title ?? "Без названия"), value,
          currency: row.currencyId ? String(row.currencyId) : "RUB",
          currencyId: row.currencyId ? String(row.currencyId) : null,
          pipelineId, stageId, contactId, companyId,
          assignedByExternalId: row.assignedByExternalId ? String(row.assignedByExternalId) : null,
          dateCreate: row.dateCreate ? new Date(row.dateCreate as string) : null,
          dateModify: row.dateModify ? new Date(row.dateModify as string) : null,
          rawPayload: row.rawPayload as any ?? undefined,
          isDeleted: Boolean(row.isDeleted),
          bitrixUpdatedAt: row.bitrixUpdatedAt ? new Date(row.bitrixUpdatedAt as string) : null,
          syncedAt: new Date(),
        },
        create: {
          orgId: crmOrgId, sourceId, title: String(row.title ?? "Без названия"), value,
          currency: row.currencyId ? String(row.currencyId) : "RUB",
          currencyId: row.currencyId ? String(row.currencyId) : null,
          pipelineId, stageId, contactId, companyId,
          assignedByExternalId: row.assignedByExternalId ? String(row.assignedByExternalId) : null,
          dateCreate: row.dateCreate ? new Date(row.dateCreate as string) : null,
          dateModify: row.dateModify ? new Date(row.dateModify as string) : null,
          rawPayload: row.rawPayload as any ?? undefined,
          isDeleted: Boolean(row.isDeleted),
          bitrixUpdatedAt: row.bitrixUpdatedAt ? new Date(row.bitrixUpdatedAt as string) : null,
          syncedAt: new Date(),
        },
        select: { id: true },
      });
      dealMap.set(sourceId, result.id);
      dealCount++;
      if (dealCount % 500 === 0) {
        await updateState(key, { counts: { deals: dealCount }, logLine: `Сделки: ${dealCount} / ${deals.length}` });
      }
    }

    await updateState(key, { counts: { deals: dealCount }, logLine: `Сделки: ${dealCount} записано` });

    // ── 7. DealContacts ───────────────────────────────────────────────────
    await updateState(key, { currentStage: "DEAL_CONTACTS", logLine: "Связи сделка-контакт..." });

    const dealContacts = await queryAnalytics(
      `SELECT "dealId","contactId","isPrimary","isDeleted" FROM "DealContact" WHERE "orgId"=$1`,
      [analyticsOrgId],
    );

    let dcCount = 0;
    for (const dc of dealContacts) {
      const row = dc as Record<string, unknown>;
      const dealExtId = dealIdToExternal.get(String(row.dealId));
      const contactExtId = contactIdToExternal.get(String(row.contactId));
      if (!dealExtId || !contactExtId) continue;
      const dealId = dealMap.get(dealExtId);
      const contactId = contactMap.get(contactExtId);
      if (!dealId || !contactId) continue;

      try {
        await prisma.dealContact.upsert({
          where: { dealId_contactId: { dealId, contactId } },
          update: { isPrimary: Boolean(row.isPrimary), isDeleted: Boolean(row.isDeleted) },
          create: { orgId: crmOrgId, dealId, contactId, isPrimary: Boolean(row.isPrimary), isDeleted: Boolean(row.isDeleted) },
        });
        dcCount++;
      } catch { /* skip */ }
    }

    await updateState(key, { counts: { dealContacts: dcCount }, logLine: `Связи: ${dcCount}` });

    // ── 8. Leads ──────────────────────────────────────────────────────────
    await updateState(key, { currentStage: "LEADS", logLine: "Загрузка лидов..." });

    const leads = await queryAnalytics(
      `SELECT "externalId","title","statusId","statusSemantic","opportunity","currencyId",
              "assignedByExternalId","contactExternalId","companyExternalId",
              "dateCreate","dateModify","rawPayload","isDeleted","bitrixUpdatedAt"
       FROM "CrmLead" WHERE "orgId"=$1`,
      [analyticsOrgId],
    );

    let leadCount = 0;
    for (const l of leads) {
      const row = l as Record<string, unknown>;
      const sourceId = String(row.externalId);
      const contactId = row.contactExternalId ? contactMap.get(String(row.contactExternalId)) ?? null : null;
      const companyId = row.companyExternalId ? companyMap.get(String(row.companyExternalId)) ?? null : null;

      try {
        await prisma.lead.upsert({
          where: { orgId_sourceId: { orgId: crmOrgId, sourceId } },
          update: {
            title: row.title ? String(row.title) : null,
            statusId: row.statusId ? String(row.statusId) : null,
            statusSemantic: row.statusSemantic ? String(row.statusSemantic) : null,
            value: row.opportunity ? Number(row.opportunity) : 0,
            currency: row.currencyId ? String(row.currencyId) : "RUB",
            contactId, companyId,
            assignedByExternalId: row.assignedByExternalId ? String(row.assignedByExternalId) : null,
            dateCreate: row.dateCreate ? new Date(row.dateCreate as string) : null,
            dateModify: row.dateModify ? new Date(row.dateModify as string) : null,
            rawPayload: row.rawPayload as any ?? undefined,
            isDeleted: Boolean(row.isDeleted),
            bitrixUpdatedAt: row.bitrixUpdatedAt ? new Date(row.bitrixUpdatedAt as string) : null,
            syncedAt: new Date(),
          },
          create: {
            orgId: crmOrgId, sourceId,
            title: row.title ? String(row.title) : null,
            statusId: row.statusId ? String(row.statusId) : null,
            statusSemantic: row.statusSemantic ? String(row.statusSemantic) : null,
            value: row.opportunity ? Number(row.opportunity) : 0,
            currency: row.currencyId ? String(row.currencyId) : "RUB",
            contactId, companyId,
            assignedByExternalId: row.assignedByExternalId ? String(row.assignedByExternalId) : null,
            dateCreate: row.dateCreate ? new Date(row.dateCreate as string) : null,
            dateModify: row.dateModify ? new Date(row.dateModify as string) : null,
            rawPayload: row.rawPayload as any ?? undefined,
            isDeleted: Boolean(row.isDeleted),
            bitrixUpdatedAt: row.bitrixUpdatedAt ? new Date(row.bitrixUpdatedAt as string) : null,
            syncedAt: new Date(),
          },
        });
        leadCount++;
      } catch { /* skip */ }
    }

    await updateState(key, { counts: { leads: leadCount }, logLine: `Лиды: ${leadCount}` });

    // ── 9. Activities + Calls ─────────────────────────────────────────────
    await updateState(key, { currentStage: "ACTIVITIES", logLine: "Загрузка активностей..." });

    const activities = await queryAnalytics(
      `SELECT "externalId","type","direction","subject","description",
              "leadId","contactId","startedAt","rawPayload"
       FROM "Activity" WHERE "orgId"=$1`,
      [analyticsOrgId],
    );

    const dwhLeads = await queryAnalytics(`SELECT "id","externalId" FROM "Lead" WHERE "orgId"=$1`, [analyticsOrgId]);
    const leadIdToExternal = new Map<string, string>();
    for (const l of dwhLeads) {
      const row = l as Record<string, unknown>;
      leadIdToExternal.set(String(row.id), String(row.externalId));
    }

    const actTypeMap: Record<string, string> = { CALL: "CALL", EMAIL: "EMAIL", CHAT: "NOTE", TASK: "TASK", OTHER: "NOTE" };
    const dirMap: Record<string, string> = { INBOUND: "INCOMING", OUTBOUND: "OUTGOING", INTERNAL: "INTERNAL" };

    let actCount = 0;
    for (const a of activities) {
      const row = a as Record<string, unknown>;
      const sourceId = String(row.externalId);

      let dealId: string | null = null;
      if (row.leadId) {
        const leadExtId = leadIdToExternal.get(String(row.leadId));
        if (leadExtId) dealId = dealMap.get(leadExtId) ?? null;
      }
      let contactId: string | null = null;
      if (row.contactId) {
        const ctExtId = contactIdToExternal.get(String(row.contactId));
        if (ctExtId) contactId = contactMap.get(ctExtId) ?? null;
      }

      try {
        await prisma.activity.create({
          data: {
            orgId: crmOrgId, sourceId,
            type: (actTypeMap[String(row.type)] ?? "NOTE") as any,
            title: String(row.subject ?? "Активность"),
            body: row.description ? String(row.description) : null,
            direction: row.direction ? (dirMap[String(row.direction)] ?? null) : null,
            dealId, contactId,
            metadata: row.rawPayload as any ?? undefined,
            createdAt: row.startedAt ? new Date(row.startedAt as string) : new Date(),
          },
        });
        actCount++;
      } catch { /* skip duplicates */ }

      if (actCount % 500 === 0 && actCount > 0) {
        await updateState(key, { counts: { activities: actCount }, logLine: `Активности: ${actCount}...` });
      }
    }

    const calls = await queryAnalytics(
      `SELECT "externalId","leadId","duration","direction","timestamp","recordingUrl" FROM "Call" WHERE "orgId"=$1`,
      [analyticsOrgId],
    );

    for (const c of calls) {
      const row = c as Record<string, unknown>;
      const sourceId = `call-${row.externalId}`;
      let dealId: string | null = null;
      if (row.leadId) {
        const leadExtId = leadIdToExternal.get(String(row.leadId));
        if (leadExtId) dealId = dealMap.get(leadExtId) ?? null;
      }

      try {
        await prisma.activity.create({
          data: {
            orgId: crmOrgId, sourceId, type: "CALL" as any,
            title: `Звонок (${Number(row.duration)}с)`,
            direction: Number(row.direction) === 1 ? "INCOMING" : "OUTGOING",
            duration: Number(row.duration),
            recordingUrl: row.recordingUrl ? String(row.recordingUrl) : null,
            dealId,
            createdAt: row.timestamp ? new Date(row.timestamp as string) : new Date(),
          },
        });
        actCount++;
      } catch { /* skip */ }
    }

    await updateState(key, { counts: { activities: actCount }, logLine: `Активности: ${actCount} (вкл. ${calls.length} звонков)` });

    // ── Done ──────────────────────────────────────────────────────────────
    await updateState(key, {
      status: "DONE",
      finishedAt: new Date().toISOString(),
      currentStage: "DONE",
      logLine: `Импорт завершён. Воронки: ${pipelines.length}, стадии: ${stages.length}, компании: ${companies.length}, контакты: ${contactCount}, сделки: ${dealCount}, лиды: ${leadCount}, активности: ${actCount}`,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateState(key, {
      status: "ERROR",
      finishedAt: new Date().toISOString(),
      error: msg,
      logLine: `ОШИБКА: ${msg}`,
    }).catch(() => {});
  }
}
