import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queryAnalytics } from "@/lib/analytics-db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST() {
  const session = await getServerSession(authOptions);
  const user = session?.user as {
    id?: string;
    orgId?: string | null;
    externalOrgId?: string | null;
  } | undefined;

  if (!user?.id) return new Response("Unauthorized", { status: 401 });

  const crmOrgId = user.orgId;
  const analyticsOrgId = user.externalOrgId;

  if (!crmOrgId || !analyticsOrgId) {
    const org = await prisma.org.findFirst({
      where: { members: { some: { user: { email: (session?.user as any)?.email } } } },
      select: { id: true, externalId: true },
    });
    if (!org) return new Response("No org found", { status: 403 });
    return await startImportStream(org.id, org.externalId);
  }

  return await startImportStream(crmOrgId, analyticsOrgId);
}

async function startImportStream(crmOrgId: string, analyticsOrgId: string) {

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        await runImport(crmOrgId, analyticsOrgId, send);
        send({ stage: "DONE", message: "Импорт завершён" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        send({ stage: "ERROR", message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

const BATCH = 500;

async function runImport(
  crmOrgId: string,
  analyticsOrgId: string,
  send: (d: Record<string, unknown>) => void,
) {
  // ── 1. Pipelines ────────────────────────────────────────────────────────
  send({ stage: "PIPELINES", message: "Загрузка воронок..." });

  const pipelines = await queryAnalytics(
    `SELECT "id","externalId","name","sort","entityType","isDeleted"
     FROM "CrmPipeline" WHERE "orgId"=$1`,
    [analyticsOrgId],
  );

  const pipelineMap = new Map<string, string>(); // externalId → CRM Pipeline.id

  for (const p of pipelines) {
    const row = p as Record<string, unknown>;
    const sourceId = String(row.externalId);
    const result = await prisma.pipeline.upsert({
      where: { orgId_sourceId: { orgId: crmOrgId, sourceId } },
      update: { name: String(row.name ?? "Без названия"), sortOrder: Number(row.sort ?? 0) },
      create: {
        orgId: crmOrgId,
        sourceId,
        name: String(row.name ?? "Без названия"),
        sortOrder: Number(row.sort ?? 0),
      },
      select: { id: true },
    });
    pipelineMap.set(sourceId, result.id);
  }

  send({ stage: "PIPELINES", message: `Воронки: ${pipelines.length}`, count: pipelines.length });

  // ── 2. Stages ───────────────────────────────────────────────────────────
  send({ stage: "STAGES", message: "Загрузка стадий..." });

  const stages = await queryAnalytics(
    `SELECT "id","externalId","pipelineId","name","semantics","sort","isDeleted"
     FROM "CrmStage" WHERE "orgId"=$1`,
    [analyticsOrgId],
  );

  // Need to resolve pipelineId (crmStage.pipelineId → CrmPipeline.id → then CrmPipeline.externalId → pipeline map)
  const pipelineIdToExternal = new Map<string, string>();
  for (const p of pipelines) {
    const row = p as Record<string, unknown>;
    pipelineIdToExternal.set(String(row.id), String(row.externalId));
  }

  const stageMap = new Map<string, string>(); // stage externalId → CRM Stage.id

  for (const s of stages) {
    const row = s as Record<string, unknown>;
    const sourceId = String(row.externalId);
    const pipelineExternalId = pipelineIdToExternal.get(String(row.pipelineId));
    const pipelineId = pipelineExternalId ? pipelineMap.get(pipelineExternalId) : undefined;
    if (!pipelineId) continue;

    const semantics = row.semantics ? String(row.semantics) : null;
    const isFinal = semantics === "S" || semantics === "F";
    const isWon = semantics === "S";

    const colorMap: Record<string, string> = {
      S: "#22c55e",
      F: "#ef4444",
      P: "#3b82f6",
    };

    const result = await prisma.stage.upsert({
      where: { orgId_sourceId: { orgId: crmOrgId, sourceId } },
      update: {
        pipelineId,
        name: String(row.name ?? ""),
        sortOrder: Number(row.sort ?? 0),
        semantics,
        isFinal,
        isWon,
      },
      create: {
        orgId: crmOrgId,
        pipelineId,
        sourceId,
        name: String(row.name ?? ""),
        sortOrder: Number(row.sort ?? 0),
        semantics,
        isFinal,
        isWon,
        color: colorMap[semantics ?? "P"] ?? "#6b7280",
      },
      select: { id: true },
    });
    stageMap.set(sourceId, result.id);
  }

  send({ stage: "STAGES", message: `Стадии: ${stages.length}`, count: stages.length });

  // ── 3. Companies ────────────────────────────────────────────────────────
  send({ stage: "COMPANIES", message: "Загрузка компаний..." });

  const companies = await queryAnalytics(
    `SELECT "id","externalId","name","inn","customFields","isDeleted","bitrixUpdatedAt","syncedAt"
     FROM "Company" WHERE "orgId"=$1`,
    [analyticsOrgId],
  );

  const companyMap = new Map<string, string>(); // externalId → CRM Company.id

  for (const c of companies) {
    const row = c as Record<string, unknown>;
    const sourceId = String(row.externalId);
    const result = await prisma.company.upsert({
      where: { orgId_sourceId: { orgId: crmOrgId, sourceId } },
      update: {
        name: String(row.name ?? "Без названия"),
        inn: row.inn ? String(row.inn) : null,
        customFields: row.customFields as any ?? undefined,
        isDeleted: Boolean(row.isDeleted),
        bitrixUpdatedAt: row.bitrixUpdatedAt ? new Date(row.bitrixUpdatedAt as string) : null,
        syncedAt: new Date(),
      },
      create: {
        orgId: crmOrgId,
        sourceId,
        name: String(row.name ?? "Без названия"),
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

  send({ stage: "COMPANIES", message: `Компании: ${companies.length}`, count: companies.length });

  // ── 4. Contacts ─────────────────────────────────────────────────────────
  send({ stage: "CONTACTS", message: "Загрузка контактов..." });

  const contacts = await queryAnalytics(
    `SELECT "id","externalId","name","firstName","lastName","primaryPhone","primaryEmail",
            "primaryIM","customFields","companyId","isDeleted","bitrixUpdatedAt","syncedAt"
     FROM "Contact" WHERE "orgId"=$1`,
    [analyticsOrgId],
  );

  // Build companyId map (analytics internal ID → externalId)
  const companyIdToExternal = new Map<string, string>();
  for (const c of companies) {
    const row = c as Record<string, unknown>;
    companyIdToExternal.set(String(row.id), String(row.externalId));
  }

  const contactMap = new Map<string, string>(); // externalId → CRM Contact.id
  let contactCount = 0;

  for (const ct of contacts) {
    const row = ct as Record<string, unknown>;
    const sourceId = String(row.externalId);

    let firstName = row.firstName ? String(row.firstName) : "";
    let lastName = row.lastName ? String(row.lastName) : "";
    if (!firstName && !lastName && row.name) {
      const parts = String(row.name).split(" ");
      firstName = parts[0] ?? "";
      lastName = parts.slice(1).join(" ");
    }
    if (!firstName) firstName = "Контакт";

    // Resolve company
    let companyId: string | null = null;
    if (row.companyId) {
      const compExtId = companyIdToExternal.get(String(row.companyId));
      if (compExtId) companyId = companyMap.get(compExtId) ?? null;
    }

    const result = await prisma.contact.upsert({
      where: { orgId_sourceId: { orgId: crmOrgId, sourceId } },
      update: {
        firstName,
        lastName,
        phone: row.primaryPhone ? String(row.primaryPhone) : null,
        email: row.primaryEmail ? String(row.primaryEmail) : null,
        primaryIM: row.primaryIM ? String(row.primaryIM) : null,
        customFields: row.customFields as any ?? undefined,
        companyId,
        isDeleted: Boolean(row.isDeleted),
        bitrixUpdatedAt: row.bitrixUpdatedAt ? new Date(row.bitrixUpdatedAt as string) : null,
        syncedAt: new Date(),
      },
      create: {
        orgId: crmOrgId,
        sourceId,
        firstName,
        lastName,
        phone: row.primaryPhone ? String(row.primaryPhone) : null,
        email: row.primaryEmail ? String(row.primaryEmail) : null,
        primaryIM: row.primaryIM ? String(row.primaryIM) : null,
        customFields: row.customFields as any ?? undefined,
        companyId,
        isDeleted: Boolean(row.isDeleted),
        bitrixUpdatedAt: row.bitrixUpdatedAt ? new Date(row.bitrixUpdatedAt as string) : null,
        syncedAt: new Date(),
      },
      select: { id: true },
    });
    contactMap.set(sourceId, result.id);
    contactCount++;
    if (contactCount % 1000 === 0) {
      send({ stage: "CONTACTS", message: `Контакты: ${contactCount}/${contacts.length}...`, count: contactCount, total: contacts.length });
    }
  }

  send({ stage: "CONTACTS", message: `Контакты: ${contacts.length}`, count: contacts.length });

  // ── 5. Communication Channels ───────────────────────────────────────────
  send({ stage: "CHANNELS", message: "Загрузка каналов связи..." });

  const channels = await queryAnalytics(
    `SELECT "id","externalId","type","value","isPrimary","messengerType","contactId","companyId","isDeleted"
     FROM "CommunicationChannel" WHERE "orgId"=$1`,
    [analyticsOrgId],
  );

  // Build contactId map (analytics internal ID → externalId)
  const contactIdToExternal = new Map<string, string>();
  for (const ct of contacts) {
    const row = ct as Record<string, unknown>;
    contactIdToExternal.set(String(row.id), String(row.externalId));
  }

  const channelKindMap: Record<string, string> = {
    PHONE: "PHONE",
    EMAIL: "EMAIL",
    IM: "IM",
  };

  let channelCount = 0;
  for (const ch of channels) {
    const row = ch as Record<string, unknown>;
    const sourceId = String(row.externalId);
    const channelType = channelKindMap[String(row.type)] ?? "PHONE";

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
        where: {
          id: sourceId, // will always miss — forces create
        },
        update: {
          type: channelType as any,
          value: String(row.value),
          isPrimary: Boolean(row.isPrimary),
          messengerType: row.messengerType ? String(row.messengerType) : null,
          contactId,
          companyId,
          isDeleted: Boolean(row.isDeleted),
          syncedAt: new Date(),
        },
        create: {
          orgId: crmOrgId,
          sourceId,
          type: channelType as any,
          value: String(row.value),
          isPrimary: Boolean(row.isPrimary),
          messengerType: row.messengerType ? String(row.messengerType) : null,
          contactId,
          companyId,
          isDeleted: Boolean(row.isDeleted),
          syncedAt: new Date(),
        },
      });
      channelCount++;
    } catch {
      // skip duplicates
    }
  }

  send({ stage: "CHANNELS", message: `Каналы связи: ${channelCount}`, count: channelCount });

  // ── 6. Deals ────────────────────────────────────────────────────────────
  send({ stage: "DEALS", message: "Загрузка сделок..." });

  const deals = await queryAnalytics(
    `SELECT "id","externalId","title","stageExternalId","pipelineExternalId",
            "opportunity","currencyId","assignedByExternalId","contactExternalId",
            "companyExternalId","contactId","companyId","dateCreate","dateModify",
            "rawPayload","isDeleted","bitrixUpdatedAt","syncedAt"
     FROM "CrmDeal" WHERE "orgId"=$1`,
    [analyticsOrgId],
  );

  const dealMap = new Map<string, string>(); // externalId → CRM Deal.id
  let dealCount = 0;

  for (const d of deals) {
    const row = d as Record<string, unknown>;
    const sourceId = String(row.externalId);

    const pipelineId = row.pipelineExternalId
      ? pipelineMap.get(String(row.pipelineExternalId)) ?? null
      : null;
    const stageId = row.stageExternalId
      ? stageMap.get(String(row.stageExternalId)) ?? null
      : null;

    let contactId: string | null = null;
    if (row.contactExternalId) {
      contactId = contactMap.get(String(row.contactExternalId)) ?? null;
    }

    let companyId: string | null = null;
    if (row.companyExternalId) {
      companyId = companyMap.get(String(row.companyExternalId)) ?? null;
    }

    const value = row.opportunity ? Number(row.opportunity) : 0;

    const result = await prisma.deal.upsert({
      where: { orgId_sourceId: { orgId: crmOrgId, sourceId } },
      update: {
        title: String(row.title ?? "Без названия"),
        value,
        currency: row.currencyId ? String(row.currencyId) : "RUB",
        currencyId: row.currencyId ? String(row.currencyId) : null,
        pipelineId,
        stageId,
        contactId,
        companyId,
        assignedByExternalId: row.assignedByExternalId ? String(row.assignedByExternalId) : null,
        dateCreate: row.dateCreate ? new Date(row.dateCreate as string) : null,
        dateModify: row.dateModify ? new Date(row.dateModify as string) : null,
        rawPayload: row.rawPayload as any ?? undefined,
        isDeleted: Boolean(row.isDeleted),
        bitrixUpdatedAt: row.bitrixUpdatedAt ? new Date(row.bitrixUpdatedAt as string) : null,
        syncedAt: new Date(),
      },
      create: {
        orgId: crmOrgId,
        sourceId,
        title: String(row.title ?? "Без названия"),
        value,
        currency: row.currencyId ? String(row.currencyId) : "RUB",
        currencyId: row.currencyId ? String(row.currencyId) : null,
        pipelineId,
        stageId,
        contactId,
        companyId,
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
    if (dealCount % 1000 === 0) {
      send({ stage: "DEALS", message: `Сделки: ${dealCount}/${deals.length}...`, count: dealCount, total: deals.length });
    }
  }

  send({ stage: "DEALS", message: `Сделки: ${deals.length}`, count: deals.length });

  // ── 7. Deal-Contact links ───────────────────────────────────────────────
  send({ stage: "DEAL_CONTACTS", message: "Загрузка связей сделка-контакт..." });

  const dealContacts = await queryAnalytics(
    `SELECT dc."id", dc."dealId", dc."contactId", dc."isPrimary", dc."isDeleted"
     FROM "DealContact" dc WHERE dc."orgId"=$1`,
    [analyticsOrgId],
  );

  // Build deal internal ID → externalId map
  const dealIdToExternal = new Map<string, string>();
  for (const d of deals) {
    const row = d as Record<string, unknown>;
    dealIdToExternal.set(String(row.id), String(row.externalId));
  }

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
        create: {
          orgId: crmOrgId,
          dealId,
          contactId,
          isPrimary: Boolean(row.isPrimary),
          isDeleted: Boolean(row.isDeleted),
        },
      });
      dcCount++;
    } catch {
      // skip
    }
  }

  send({ stage: "DEAL_CONTACTS", message: `Связи сделка-контакт: ${dcCount}`, count: dcCount });

  // ── 8. Leads ────────────────────────────────────────────────────────────
  send({ stage: "LEADS", message: "Загрузка лидов..." });

  const leads = await queryAnalytics(
    `SELECT "id","externalId","title","statusId","statusSemantic","opportunity","currencyId",
            "assignedByExternalId","contactExternalId","companyExternalId","contactId","companyId",
            "dateCreate","dateModify","rawPayload","isDeleted","bitrixUpdatedAt","syncedAt"
     FROM "CrmLead" WHERE "orgId"=$1`,
    [analyticsOrgId],
  );

  let leadCount = 0;
  for (const l of leads) {
    const row = l as Record<string, unknown>;
    const sourceId = String(row.externalId);

    let contactId: string | null = null;
    if (row.contactExternalId) {
      contactId = contactMap.get(String(row.contactExternalId)) ?? null;
    }
    let companyId: string | null = null;
    if (row.companyExternalId) {
      companyId = companyMap.get(String(row.companyExternalId)) ?? null;
    }

    try {
      await prisma.lead.upsert({
        where: { orgId_sourceId: { orgId: crmOrgId, sourceId } },
        update: {
          title: row.title ? String(row.title) : null,
          statusId: row.statusId ? String(row.statusId) : null,
          statusSemantic: row.statusSemantic ? String(row.statusSemantic) : null,
          value: row.opportunity ? Number(row.opportunity) : 0,
          currency: row.currencyId ? String(row.currencyId) : "RUB",
          contactId,
          companyId,
          assignedByExternalId: row.assignedByExternalId ? String(row.assignedByExternalId) : null,
          dateCreate: row.dateCreate ? new Date(row.dateCreate as string) : null,
          dateModify: row.dateModify ? new Date(row.dateModify as string) : null,
          rawPayload: row.rawPayload as any ?? undefined,
          isDeleted: Boolean(row.isDeleted),
          bitrixUpdatedAt: row.bitrixUpdatedAt ? new Date(row.bitrixUpdatedAt as string) : null,
          syncedAt: new Date(),
        },
        create: {
          orgId: crmOrgId,
          sourceId,
          title: row.title ? String(row.title) : null,
          statusId: row.statusId ? String(row.statusId) : null,
          statusSemantic: row.statusSemantic ? String(row.statusSemantic) : null,
          value: row.opportunity ? Number(row.opportunity) : 0,
          currency: row.currencyId ? String(row.currencyId) : "RUB",
          contactId,
          companyId,
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
    } catch {
      // skip
    }
  }

  send({ stage: "LEADS", message: `Лиды: ${leadCount}`, count: leadCount });

  // ── 9. Activities ───────────────────────────────────────────────────────
  send({ stage: "ACTIVITIES", message: "Загрузка активностей..." });

  const activities = await queryAnalytics(
    `SELECT "id","externalId","type","direction","subject","description",
            "ownerType","leadId","contactId","companyId",
            "startedAt","endedAt","isDeleted","rawPayload"
     FROM "Activity" WHERE "orgId"=$1`,
    [analyticsOrgId],
  );

  // leadId in analytics maps to Lead in DWH, but Lead there has externalId which corresponds to deals
  // We need to map activity's leadId (which is DWH Lead.id) to CRM Deal
  // DWH Lead has externalId which is the Bitrix deal/lead external ID
  // But activities in DWH reference Lead.id, not externalId

  // Load DWH leads to map leadId → externalId
  const dwhLeads = await queryAnalytics(
    `SELECT "id","externalId" FROM "Lead" WHERE "orgId"=$1`,
    [analyticsOrgId],
  );
  const leadIdToExternal = new Map<string, string>();
  for (const l of dwhLeads) {
    const row = l as Record<string, unknown>;
    leadIdToExternal.set(String(row.id), String(row.externalId));
  }

  const activityTypeMap: Record<string, string> = {
    CALL: "CALL",
    EMAIL: "EMAIL",
    CHAT: "NOTE",
    TASK: "TASK",
    OTHER: "NOTE",
  };

  let actCount = 0;
  for (const a of activities) {
    const row = a as Record<string, unknown>;
    const sourceId = String(row.externalId);
    const actType = activityTypeMap[String(row.type)] ?? "NOTE";

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

    const dirMap: Record<string, string> = {
      INBOUND: "INCOMING",
      OUTBOUND: "OUTGOING",
      INTERNAL: "INTERNAL",
    };

    try {
      await prisma.activity.create({
        data: {
          orgId: crmOrgId,
          sourceId,
          type: actType as any,
          title: String(row.subject ?? "Активность"),
          body: row.description ? String(row.description) : null,
          direction: row.direction ? (dirMap[String(row.direction)] ?? null) : null,
          dealId,
          contactId,
          metadata: row.rawPayload as any ?? undefined,
          createdAt: row.startedAt ? new Date(row.startedAt as string) : new Date(),
        },
      });
      actCount++;
    } catch {
      // duplicate or error — skip
    }

    if (actCount % 500 === 0) {
      send({ stage: "ACTIVITIES", message: `Активности: ${actCount}...`, count: actCount });
    }
  }

  // ── Also import Calls as Activities ─────────────────────────────────────
  const calls = await queryAnalytics(
    `SELECT "id","externalId","leadId","duration","direction","timestamp","recordingUrl"
     FROM "Call" WHERE "orgId"=$1`,
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

    const dir = Number(row.direction) === 1 ? "INCOMING" : "OUTGOING";

    try {
      await prisma.activity.create({
        data: {
          orgId: crmOrgId,
          sourceId,
          type: "CALL" as any,
          title: `Звонок (${Number(row.duration)}с)`,
          direction: dir,
          duration: Number(row.duration),
          recordingUrl: row.recordingUrl ? String(row.recordingUrl) : null,
          dealId,
          createdAt: row.timestamp ? new Date(row.timestamp as string) : new Date(),
        },
      });
      actCount++;
    } catch {
      // skip
    }
  }

  send({ stage: "ACTIVITIES", message: `Активности: ${actCount} (вкл. звонки)`, count: actCount });

  // ── Summary ─────────────────────────────────────────────────────────────
  send({
    stage: "SUMMARY",
    message: "Импорт завершён",
    summary: {
      pipelines: pipelines.length,
      stages: stages.length,
      companies: companies.length,
      contacts: contacts.length,
      channels: channelCount,
      deals: deals.length,
      dealContacts: dcCount,
      leads: leadCount,
      activities: actCount,
    },
  });
}
