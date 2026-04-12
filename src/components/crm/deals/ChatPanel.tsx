"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  AlertCircle,
  Send,
  Loader2,
  Paperclip,
  Phone,
  WifiOff,
  ArrowLeft,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Connector = {
  id: string;
  type: string;
  name: string;
  status: string;
  liveStatus?: string;
  running?: boolean;
  phoneNumber?: string;
  createdAt: string;
};

type SearchConversation = {
  id: string;
  externalId: string;
  title?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  unreadCount: number;
  lastMessageAt?: string;
  instanceId: string;
  instance: {
    id: string;
    type: string;
    name: string;
    status: string;
  };
};

type Message = {
  id?: string;
  direction: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  fileName?: string;
  senderName?: string;
  status?: string;
  createdAt: string;
};

type WriteTarget = {
  connector: Connector;
  phone: string;
};

// ─── Connector metadata ───────────────────────────────────────────────────────

const CONNECTOR_META: Record<
  string,
  { bg: string; border: string; text: string; label: string }
> = {
  MAX: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-600", label: "M" },
  VK: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", label: "VK" },
  TELEGRAM: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-600", label: "TG" },
  AVITO: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600", label: "AV" },
  WHATSAPP: { bg: "bg-green-50", border: "border-green-200", text: "text-green-600", label: "WA" },
  INSTAGRAM: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-600", label: "IN" },
};

function getMeta(type: string) {
  return CONNECTOR_META[type] ?? {
    bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-600", label: type[0] ?? "?",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function connectorApi(path: string, opts: RequestInit = {}) {
  const url = `/api/connector?path=${encodeURIComponent(path)}`;
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}

function connectorBase(type: string, id: string) {
  return `/connectors/${type.toLowerCase()}/${id}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "только что";
  if (s < 3600) return Math.floor(s / 60) + " мин назад";
  if (s < 86400) return Math.floor(s / 3600) + " ч назад";
  return Math.floor(s / 86400) + " дн назад";
}

// ─── Connector icon ───────────────────────────────────────────────────────────

function ConnectorIcon({ type, size = "sm" }: { type: string; size?: "sm" | "md" }) {
  const m = getMeta(type);
  const sz = size === "md"
    ? "w-8 h-8 text-[11px] rounded-lg"
    : "w-6 h-6 text-[10px] rounded-md";
  return (
    <div className={`${sz} flex items-center justify-center font-bold border ${m.bg} ${m.border} ${m.text} shrink-0`}>
      {m.label}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({ message }: { message: Message }) {
  const isInbound = message.direction === "INBOUND";

  return (
    <div className={`flex ${isInbound ? "justify-start" : "justify-end"} mb-2`}>
      <div className={`max-w-[78%] flex flex-col gap-0.5 ${isInbound ? "items-start" : "items-end"}`}>
        {isInbound && message.senderName && (
          <span className="text-[10px] text-gray-400 ml-1">{message.senderName}</span>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap ${
            isInbound
              ? "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
              : "bg-brand-600 text-white rounded-tr-sm"
          } ${message.status === "SENDING" ? "opacity-55" : ""}`}
        >
          {message.mediaUrl && (
            (message.mediaType || "").startsWith("image") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={message.mediaUrl} alt="" className="max-w-[200px] rounded-xl mb-1 cursor-pointer" onClick={() => window.open(message.mediaUrl)} />
            ) : (message.mediaType || "").startsWith("video") ? (
              <video src={message.mediaUrl} controls className="max-w-[200px] rounded-xl mb-1" />
            ) : (
              <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 bg-black/5 rounded-lg text-xs mb-1">
                <Paperclip size={12} /> {message.fileName || "Файл"}
              </a>
            )
          )}
          {message.text && <div>{message.text}</div>}
        </div>
        <span className={`text-[10px] text-gray-400 ${isInbound ? "ml-1" : "mr-1"}`}>
          {message.status === "SENDING" ? "Отправка..." : (
            <>
              {formatTime(message.createdAt)}
              {!isInbound && (message.status === "FAILED"
                ? <span className="ml-1 text-red-400">✗</span>
                : <span className="ml-1">✓</span>
              )}
            </>
          )}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ChatPanelProps {
  dealId: string;
  contactPhone?: string | null;
  contactName?: string | null;
}

export default function ChatPanel({ dealId, contactPhone, contactName }: ChatPanelProps) {
  void dealId;

  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [matchedConvs, setMatchedConvs] = useState<SearchConversation[]>([]);
  const [activeConv, setActiveConv] = useState<SearchConversation | null>(null);
  const [writeTarget, setWriteTarget] = useState<WriteTarget | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const activeChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);
  useEffect(() => {
    activeChatIdRef.current = activeConv?.externalId ?? null;
  }, [activeConv]);
  useEffect(() => () => eventSourceRef.current?.close(), []);

  const searchConversations = useCallback(async (phone: string): Promise<SearchConversation[]> => {
    try {
      const convs = await connectorApi(
        `/conversations/search?phone=${encodeURIComponent(phone)}`,
      );
      if (Array.isArray(convs)) return convs;
    } catch { /* ignore */ }
    return [];
  }, []);

  // Load connectors + search conversations by phone
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await connectorApi("/connectors");
        if (cancelled) return;
        if (Array.isArray(data)) setConnectors(data);

        if (contactPhone) {
          const convs = await searchConversations(contactPhone);
          if (!cancelled) {
            setMatchedConvs(convs);
            if (convs.length === 1) selectConv(convs[0]);
          }
        }
      } catch {
        if (!cancelled) setError("Не удалось загрузить данные");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactPhone]);

  // Open SSE for the active conversation's connector
  useEffect(() => {
    if (!activeConv) return;
    eventSourceRef.current?.close();
    const base = connectorBase(activeConv.instance.type, activeConv.instanceId);
    const url = `/api/connector/sse?path=${encodeURIComponent(`${base}/events`)}`;
    const es = new EventSource(url);
    es.addEventListener("message", (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.chatId === activeChatIdRef.current) {
          setMessages((prev) => [
            ...prev,
            {
              direction: data.direction || "INBOUND",
              text: data.text,
              mediaUrl: data.mediaUrl,
              mediaType: data.mediaType,
              senderName: data.senderName,
              status: "SENT",
              createdAt: data.timestamp || new Date().toISOString(),
            },
          ]);
        }
      } catch { /* ignore */ }
    });
    eventSourceRef.current = es;
    return () => es.close();
  }, [activeConv]);

  const selectConv = useCallback(async (conv: SearchConversation) => {
    setActiveConv(conv);
    setWriteTarget(null);
    setSendError(null);
    try {
      const base = connectorBase(conv.instance.type, conv.instanceId);
      const msgs = await connectorApi(`${base}/conversations/${conv.id}/messages`);
      if (Array.isArray(msgs)) setMessages(msgs);
      if (conv.unreadCount > 0) {
        connectorApi(`${base}/conversations/${conv.id}/read`, { method: "POST" }).catch(() => {});
        setMatchedConvs((prev) =>
          prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
        );
      }
    } catch {
      setMessages([]);
    }
  }, []);

  function openWriteComposer(connector: Connector) {
    if (!contactPhone) return;
    setActiveConv(null);
    setMessages([]);
    setSendError(null);
    setWriteTarget({ connector, phone: contactPhone.replace(/[^0-9+]/g, "") });
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  function backToList() {
    setWriteTarget(null);
    setActiveConv(null);
    setMessages([]);
    setSendError(null);
  }

  async function handleSend() {
    const text = msgText.trim();
    const file = pendingFile;
    if (!text && !file) return;

    setSendError(null);

    // Determine the target: either an existing conversation or a new write target
    let base: string;
    let to: string;

    if (activeConv) {
      base = connectorBase(activeConv.instance.type, activeConv.instanceId);
      to = activeConv.externalId;
    } else if (writeTarget) {
      base = connectorBase(writeTarget.connector.type, writeTarget.connector.id);
      to = writeTarget.phone;
    } else {
      return;
    }

    setMsgText("");
    setPendingFile(null);
    setSending(true);

    const optimisticId = `_opt_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        direction: "OUTBOUND",
        text: text || (file ? `[${file.name}]` : ""),
        fileName: file?.name,
        mediaType: file?.type,
        status: "SENDING",
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      if (file) {
        const fd = new FormData();
        fd.append("to", to);
        fd.append("text", text);
        fd.append("file", file);
        const res = await fetch(
          `/api/connector?path=${encodeURIComponent(`${base}/send-file`)}`,
          { method: "POST", body: fd },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || `HTTP ${res.status}`);
        }
      } else {
        await connectorApi(`${base}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, text }),
        });
      }

      // Mark as sent
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? { ...m, status: "SENT" } : m)),
      );

      // If this was a "write first" flow, search for the new conversation
      if (writeTarget && contactPhone) {
        const convs = await searchConversations(contactPhone);
        setMatchedConvs(convs);
        const newConv = convs.find(
          (c) => c.instanceId === writeTarget.connector.id,
        );
        if (newConv) {
          setActiveConv(newConv);
          setWriteTarget(null);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ошибка отправки";
      setSendError(msg);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? { ...m, status: "FAILED" } : m)),
      );
    } finally {
      setSending(false);
    }
  }

  function handleTextareaInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
          <span className="text-xs">Загрузка чата...</span>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-2 text-red-500">
          <AlertCircle size={24} />
          <p className="text-sm text-center">{error}</p>
        </div>
      </div>
    );
  }

  // ── No phone on contact ─────────────────────────────────────────────────────
  if (!contactPhone) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400 px-6">
        <Phone size={32} strokeWidth={1.5} className="opacity-25" />
        <p className="text-sm font-medium text-gray-500">Нет номера телефона</p>
        <p className="text-xs text-center text-gray-400 max-w-[240px]">
          Добавьте номер телефона контакту, чтобы видеть переписку и писать в мессенджеры.
        </p>
      </div>
    );
  }

  // ── No connectors ───────────────────────────────────────────────────────────
  if (connectors.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400 px-6">
        <WifiOff size={36} strokeWidth={1.5} className="opacity-30" />
        <p className="text-sm font-medium text-gray-500">Нет подключённых линий</p>
        <p className="text-xs text-center text-gray-400 max-w-[240px]">
          Подключите мессенджер в разделе{" "}
          <a href="https://connector.orinax.ai" target="_blank" rel="noreferrer" className="text-brand-500 hover:underline">
            Коннектор
          </a>{" "}
          чтобы начать общение.
        </p>
      </div>
    );
  }

  // ── "Write first" composer mode ─────────────────────────────────────────────
  if (writeTarget) {
    const isOnline =
      (writeTarget.connector.liveStatus || writeTarget.connector.status) === "CONNECTED";
    const canSend = (!!msgText.trim() || !!pendingFile) && !sending;

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
          <button onClick={backToList} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <ArrowLeft size={16} />
          </button>
          <ConnectorIcon type={writeTarget.connector.type} size="md" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-800 truncate">
              {writeTarget.connector.name}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? "bg-green-500" : "bg-amber-400"}`} />
              {isOnline ? "Онлайн" : "Офлайн"}
              <span className="mx-1">·</span>
              {contactName || writeTarget.phone}
            </div>
          </div>
        </div>

        {/* Empty message area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50/40">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
              <MessageSquare size={28} strokeWidth={1.5} className="opacity-25" />
              <p className="text-sm">Напишите первое сообщение</p>
              <p className="text-[11px] text-gray-400">
                {writeTarget.phone}
              </p>
            </div>
          ) : (
            messages.map((msg, i) => <Bubble key={msg.id ?? i} message={msg} />)
          )}
          <div ref={bottomRef} />
        </div>

        {/* Send error */}
        {sendError && (
          <div className="px-4 py-1.5 bg-red-50 border-t border-red-100 text-xs text-red-600">
            {sendError}
          </div>
        )}

        {/* File preview */}
        {pendingFile && (
          <div className="flex items-center gap-2 px-4 py-1.5 border-t border-gray-100 text-xs text-gray-500 bg-gray-50">
            <Paperclip size={12} />
            <span className="flex-1 truncate">{pendingFile.name}</span>
            <button onClick={() => setPendingFile(null)} className="text-red-400 hover:text-red-500">✕</button>
          </div>
        )}

        {/* Composer */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-2">
          <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-200 transition-all">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 p-1 rounded text-gray-400 hover:text-brand-500 transition-colors"
              title="Прикрепить файл"
            >
              <Paperclip size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setPendingFile(f); e.target.value = ""; }}
            />
            <textarea
              ref={textareaRef}
              rows={1}
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              onInput={handleTextareaInput}
              placeholder="Введите сообщение..."
              className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none max-h-[120px] leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="shrink-0 p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 disabled:opacity-30 transition-colors"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── No conversations found — show connector list to initiate ────────────────
  if (matchedConvs.length === 0 && !activeConv) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-6">
        <MessageSquare size={32} strokeWidth={1.5} className="text-gray-300" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600 mb-1">
            Нет переписки с {contactName || contactPhone}
          </p>
          <p className="text-xs text-gray-400">{contactPhone}</p>
        </div>
        <div className="w-full max-w-[280px] space-y-2">
          <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium text-center">
            Написать через
          </p>
          {connectors.map((c) => {
            const status = c.liveStatus || c.status;
            const isOnline = status === "CONNECTED";
            return (
              <button
                key={c.id}
                onClick={() => openWriteComposer(c)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-left"
              >
                <ConnectorIcon type={c.type} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{c.name}</div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? "bg-green-500" : "bg-amber-400"}`} />
                    {isOnline ? "Онлайн" : "Офлайн"}
                  </div>
                </div>
                <Send size={14} className="text-brand-500 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Conversations found — show list + messages ──────────────────────────────
  const canSend = !!activeConv && (!!msgText.trim() || !!pendingFile) && !sending;

  return (
    <div className="h-full flex flex-col">
      {/* Conversation tabs when multiple */}
      {matchedConvs.length > 1 && (
        <div className="shrink-0 flex gap-1 px-3 pt-3 pb-2 border-b border-gray-100 overflow-x-auto">
          {matchedConvs.map((conv) => {
            const isActive = activeConv?.id === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => selectConv(conv)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <ConnectorIcon type={conv.instance.type} />
                <span>{conv.title || conv.instance.name}</span>
                {conv.unreadCount > 0 && (
                  <span className="bg-brand-600 text-white text-[9px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Single conversation header */}
      {matchedConvs.length === 1 && activeConv && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-gray-100">
          <ConnectorIcon type={activeConv.instance.type} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-700 truncate">
              {activeConv.title || activeConv.instance.name}
            </div>
            <div className="text-[10px] text-gray-400">
              {activeConv.instance.type} · {activeConv.lastMessageAt ? timeAgo(activeConv.lastMessageAt) : "—"}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50/40">
        {!activeConv ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 py-10">
            <MessageSquare size={28} strokeWidth={1.5} className="opacity-25" />
            <p className="text-sm">Выберите диалог</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 py-10">
            <MessageSquare size={28} strokeWidth={1.5} className="opacity-25" />
            <p className="text-sm">Сообщений пока нет</p>
          </div>
        ) : (
          messages.map((msg, i) => <Bubble key={msg.id ?? i} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Send error */}
      {sendError && (
        <div className="px-4 py-1.5 bg-red-50 border-t border-red-100 text-xs text-red-600">
          {sendError}
        </div>
      )}

      {/* File preview */}
      {pendingFile && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-t border-gray-100 text-xs text-gray-500 bg-gray-50">
          <Paperclip size={12} />
          <span className="flex-1 truncate">{pendingFile.name}</span>
          <button onClick={() => setPendingFile(null)} className="text-red-400 hover:text-red-500">✕</button>
        </div>
      )}

      {/* Composer */}
      {activeConv && (
        <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-2">
          <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-200 transition-all">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 p-1 rounded text-gray-400 hover:text-brand-500 transition-colors"
              title="Прикрепить файл"
            >
              <Paperclip size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setPendingFile(f); e.target.value = ""; }}
            />
            <textarea
              ref={textareaRef}
              rows={1}
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              onInput={handleTextareaInput}
              placeholder="Сообщение..."
              className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none max-h-[120px] leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="shrink-0 p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 disabled:opacity-30 transition-colors"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
