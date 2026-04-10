"use strict";

process.on("unhandledRejection", (reason) => {
  console.error(
    "[crm-worker] unhandledRejection:",
    reason instanceof Error ? reason.message : reason
  );
});

process.on("uncaughtException", (err) => {
  console.error("[crm-worker] uncaughtException:", err.message);
});

require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[crm-worker] DATABASE_URL is not set — exiting");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

function buildRedisOptions(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "localhost",
    port: parseInt(parsed.port || "6379", 10),
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

const connection = new IORedis(buildRedisOptions(REDIS_URL));

connection.on("connect", () => console.log("[crm-worker] Redis connected"));
connection.on("error", (err) =>
  console.error("[crm-worker] Redis error:", err.message)
);

// ── Business logic ────────────────────────────────────────────────────────────

async function resolveOrgId(chatId, jobOrgId) {
  if (chatId) {
    const existing = await prisma.conversation.findFirst({
      where: { externalId: chatId },
      select: { orgId: true },
    });
    if (existing?.orgId) return existing.orgId;
  }
  return jobOrgId || process.env.MAX_DEFAULT_ORG_ID || null;
}

async function handleMaxWebhook(data) {
  const { payload, orgId: jobOrgId } = data;
  const updateType = String(payload.update_type || "");

  if (updateType !== "message_created" && updateType !== "bot_started") return;

  const msg = payload.message || {};
  const chatId = String(
    (msg.recipient && msg.recipient.chat_id) || payload.chat_id || ""
  );

  if (!chatId) {
    console.warn("[crm-worker] MAX_WEBHOOK: no chatId in payload, skipping");
    return;
  }

  const orgId = await resolveOrgId(chatId, jobOrgId);
  if (!orgId) {
    console.error(
      "[crm-worker] MAX_WEBHOOK: cannot determine orgId for chatId",
      chatId,
      "— set MAX_DEFAULT_ORG_ID env var"
    );
    return;
  }

  // Find or create Conversation
  let conversation = await prisma.conversation.findFirst({
    where: { orgId, externalId: chatId },
    select: { id: true },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        orgId,
        channel: "OTHER",
        externalId: chatId,
        status: "OPEN",
      },
      select: { id: true },
    });
    console.log(
      "[crm-worker] Created Conversation",
      conversation.id,
      "for chatId",
      chatId
    );
  }

  if (updateType !== "message_created") return;

  const text =
    (msg.body && typeof msg.body.text === "string" ? msg.body.text : null) ||
    null;
  const senderName =
    (msg.sender && msg.sender.name) ||
    (payload.user && payload.user.name) ||
    null;

  const externalMsgId =
    String(msg.seq_no || msg.mid || "") ||
    `max-${chatId}-${Date.now()}`;

  const message = await prisma.message.upsert({
    where: {
      conversationId_sourceId: {
        conversationId: conversation.id,
        sourceId: externalMsgId,
      },
    },
    update: {},
    create: {
      conversationId: conversation.id,
      fromExternal: true,
      body: text,
      sourceId: externalMsgId,
      metadata: { senderName, updateType, maxChatId: chatId },
    },
    select: { id: true },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  console.log(
    "[crm-worker] Saved inbound message",
    message.id,
    "conversation:",
    conversation.id
  );
}

// ── BullMQ Worker ─────────────────────────────────────────────────────────────

const worker = new Worker(
  "external-webhooks",
  async (job) => {
    if (job.name === "MAX_WEBHOOK") {
      await handleMaxWebhook(job.data);
    }
  },
  {
    connection,
    concurrency: 5,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  }
);

worker.on("completed", (job) =>
  console.log(`[crm-worker] Job ${job.id} (${job.name}) completed`)
);

worker.on("failed", (job, err) =>
  console.error(
    `[crm-worker] Job ${job?.id} (${job?.name}) failed:`,
    err.message
  )
);

worker.on("error", (err) =>
  console.error("[crm-worker] Worker error:", err.message)
);

console.log(
  "[crm-worker] BullMQ worker started — listening on queue: external-webhooks"
);
