"use client";

export const EVENT_TYPES = {
  SESSION_START: "session.start",
  SESSION_END: "session.end",
  SESSION_HEARTBEAT: "session.heartbeat",
  SESSION_IDLE: "session.idle",
  SESSION_ACTIVE: "session.active",
  PAGE_VIEW: "page.view",
  PAGE_EXIT: "page.exit",
  PAGE_FOCUS: "page.focus",
  PAGE_BLUR: "page.blur",
  MOUSE_CLICK: "mouse.click",
  CHAT_MESSAGE_SENT: "chat.message.sent",
  CHAT_TYPING_SESSION: "chat.typing.session",
  CHAT_MESSAGE_ABANDONED: "chat.message.abandoned",
  CALL_STARTED: "call.started",
  CALL_ANSWERED: "call.answered",
  CALL_ENDED: "call.ended",
  CALL_TRANSFERRED: "call.transferred",
  DEAL_OPENED: "deal.opened",
  DEAL_STAGE_CHANGED: "deal.stage.changed",
  DEAL_CREATED: "deal.created",
  CONTACT_VIEWED: "contact.viewed",
  CONTACT_CREATED: "contact.created",
  COMPANY_VIEWED: "company.viewed",
  BUTTON_CLICKED: "button.clicked",
  MODAL_OPENED: "modal.opened",
  FILTER_APPLIED: "filter.applied",
  SEARCH_PERFORMED: "search.performed",
  SEARCH_RESULT_CLICKED: "search.result.clicked",
  AI_CHAT_SENT: "ai.chat.sent",
  AI_REPORT_GENERATED: "ai.report.generated",
} as const;

interface TrackingEvent {
  eventId: string;
  type: string;
  userId: string;
  orgId: string;
  sessionId: string;
  timestamp: string;
  source: string;
  path: string;
  properties: Record<string, unknown>;
}

interface TrackerConfig {
  userId: string;
  orgId: string;
  source: "crm-app" | "orinax-crm" | "connector";
  collectorUrl: string;
  flushSignalUrl?: string;
}

const FLUSH_INTERVAL = 30_000;
const IDLE_THRESHOLD = 60_000;
const HEARTBEAT_INTERVAL = 5 * 60_000;
const FLUSH_SIGNAL_INTERVAL = 15_000;

let config: TrackerConfig | null = null;
let sessionId = "";
let buffer: TrackingEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let flushSignalTimer: ReturnType<typeof setInterval> | null = null;
let isIdle = false;
let autoTrackEnabled = false;
let lastPath = "";

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getSessionId(): string {
  if (typeof sessionStorage === "undefined") return uuid();
  const key = "_orinax_sid";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = uuid();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

function createEvent(type: string, properties: Record<string, unknown> = {}): TrackingEvent {
  return {
    eventId: uuid(),
    type,
    userId: config!.userId,
    orgId: config!.orgId,
    sessionId,
    timestamp: new Date().toISOString(),
    source: config!.source,
    path: typeof window !== "undefined" ? window.location.pathname : "",
    properties,
  };
}

async function checkFlushSignal() {
  if (!config?.flushSignalUrl) return;
  try {
    const res = await fetch(config.flushSignalUrl, { method: "GET" });
    if (res.ok) {
      const data = await res.json() as { flush?: boolean };
      if (data.flush) await flush();
    }
  } catch {
    // silent
  }
}

async function flush() {
  if (buffer.length === 0 || !config) return;
  const events = buffer.splice(0, buffer.length);
  try {
    const res = await fetch(config.collectorUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
      keepalive: true,
    });
    if (!res.ok) {
      buffer.unshift(...events);
    }
  } catch {
    buffer.unshift(...events);
  }
}

function resetIdleTimer() {
  if (!autoTrackEnabled) return;
  if (isIdle) {
    isIdle = false;
    buffer.push(createEvent(EVENT_TYPES.SESSION_ACTIVE));
  }
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    isIdle = true;
    buffer.push(createEvent(EVENT_TYPES.SESSION_IDLE));
  }, IDLE_THRESHOLD);
}

function onVisibilityChange() {
  if (!config) return;
  if (document.hidden) {
    buffer.push(createEvent(EVENT_TYPES.PAGE_BLUR));
    flush();
  } else {
    buffer.push(createEvent(EVENT_TYPES.PAGE_FOCUS));
    resetIdleTimer();
  }
}

function onClick(e: MouseEvent) {
  if (!config) return;
  const target = e.target as HTMLElement | null;
  const selector = target
    ? `${target.tagName.toLowerCase()}${target.id ? "#" + target.id : ""}${target.className && typeof target.className === "string" ? "." + target.className.split(" ").slice(0, 2).join(".") : ""}`
    : "unknown";
  buffer.push(
    createEvent(EVENT_TYPES.MOUSE_CLICK, {
      x: e.clientX,
      y: e.clientY,
      selector,
      text: target?.textContent?.slice(0, 50) || "",
    }),
  );
}

function onBeforeUnload() {
  if (!config) return;
  buffer.push(createEvent(EVENT_TYPES.SESSION_END));
  flush();
}

function setupAutoTrack() {
  if (autoTrackEnabled) return;
  autoTrackEnabled = true;

  document.addEventListener("visibilitychange", onVisibilityChange);
  document.addEventListener("click", onClick);
  window.addEventListener("beforeunload", onBeforeUnload);

  const activityEvents = ["mousemove", "keydown", "scroll", "touchstart"] as const;
  for (const evt of activityEvents) {
    document.addEventListener(evt, resetIdleTimer, { passive: true });
  }

  resetIdleTimer();
}

export const Tracker = {
  init(cfg: TrackerConfig) {
    if (typeof window === "undefined") return;
    config = cfg;
    sessionId = getSessionId();

    buffer.push(createEvent(EVENT_TYPES.SESSION_START));

    if (!flushTimer) {
      flushTimer = setInterval(flush, FLUSH_INTERVAL);
    }
    if (!heartbeatTimer) {
      heartbeatTimer = setInterval(() => {
        if (config) buffer.push(createEvent(EVENT_TYPES.SESSION_HEARTBEAT));
      }, HEARTBEAT_INTERVAL);
    }
    if (cfg.flushSignalUrl && !flushSignalTimer) {
      flushSignalTimer = setInterval(checkFlushSignal, FLUSH_SIGNAL_INTERVAL);
    }
  },

  enableAutoTrack() {
    if (typeof window === "undefined" || !config) return;
    setupAutoTrack();
  },

  track(type: string, properties: Record<string, unknown> = {}) {
    if (!config) return;
    buffer.push(createEvent(type, properties));
  },

  trackPageView(path: string, title?: string) {
    if (!config || path === lastPath) return;
    if (lastPath) {
      buffer.push(createEvent(EVENT_TYPES.PAGE_EXIT, { from: lastPath }));
    }
    lastPath = path;
    buffer.push(createEvent(EVENT_TYPES.PAGE_VIEW, { title: title || document.title }));
  },

  async flush() {
    await flush();
  },

  destroy() {
    if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
    if (flushSignalTimer) { clearInterval(flushSignalTimer); flushSignalTimer = null; }
    if (autoTrackEnabled) {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("click", onClick);
      window.removeEventListener("beforeunload", onBeforeUnload);
      autoTrackEnabled = false;
    }
    flush();
    config = null;
  },
};
