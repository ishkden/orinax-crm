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

// ─── Connector metadata ───────────────────────────────────────────────────────

const CONNECTOR_META: Record<
  string,
  { bg: string; border: string; text: string; label: string; activeBg: string; activeBorder: string }
> = {
  MAX:       { bg: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-600",  label: "M",  activeBg: "bg-indigo-100", activeBorder: "border-indigo-400" },
  VK:        { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-600",    label: "VK", activeBg: "bg-blue-100",   activeBorder: "border-blue-400" },
  TELEGRAM:  { bg: "bg-sky-50",     border: "border-sky-200",     text: "text-sky-600",     label: "TG", activeBg: "bg-sky-100",    activeBorder: "border-sky-400" },
  AVITO:     { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600", label: "AV", activeBg: "bg-emerald-100",activeBorder: "border-emerald-400" },
  WHATSAPP:  { bg: "bg-green-50",   border: "border-green-200",   text: "text-green-600",   label: "WA", activeBg: "bg-green-100",  activeBorder: "border-green-400" },
  INSTAGRAM: { bg: "bg-pink-50",    border: "border-pink-200",    text: "text-pink-600",    label: "IN", activeBg: "bg-pink-100",   activeBorder: "border-pink-400" },
};

function getMeta(type: string) {
  return CONNECTOR_META[type] ?? {
    bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-600",
    label: type[0] ?? "?", activeBg: "bg-gray-100", activeBorder: "border-gray-400",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function connectorApi(path: string, opts: RequestInit = {}) {
  const url = `/api/connector?path=${encodeURIComponent(path)}`;
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

function connectorBase(type: string, id: string) {
  return `/connectors/${type.toLowerCase()}/${id}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

// ─── Connector icon ───────────────────────────────────────────────────────────

function ConnectorIcon({ type, size = "sm" }: { type: string; size?: "sm" | "md" }) {
  const m = getMeta(type);
  const sz = size === "md"
    ? "w-8 h-8 text-[11px] rounded-lg"
    : "w-5 h-5 text-[9px] rounded";
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
  // Selected connector ID — drives everything
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);
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

  // Derived state
  const selectedConn = connectors.find((c) => c.id === selectedConnId) ?? null;
  const activeConv = matchedConvs.find((c) => c.instanceId === selectedConnId) ?? null;
  const hasConversation = !!activeConv;

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

  // Load connectors + search conversations
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await connectorApi("/connectors");
        if (cancelled) return;
        const list: Connector[] = Array.isArray(data) ? data : [];
        setConnectors(list);

        let convs: SearchConversation[] = [];
        if (contactPhone) {
          convs = await searchConversations(contactPhone);
          if (!cancelled) setMatchedConvs(convs);
        }

        // Auto-select: prefer connector with existing conversation, else first connector
        if (!cancelled && list.length > 0) {
          const withConv = convs.length > 0
            ? list.find((c) => convs.some((cv) => cv.instanceId === c.id))
            : null;
          setSelectedConnId(withConv?.id ?? list[0].id);
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

  // Load messages when activeConv changes
  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const base = connectorBase(activeConv!.instance.type, activeConv!.instanceId);
        const msgs = await connectorApi(`${base}/conversations/${activeConv!.id}/messages`);
        if (!cancelled && Array.isArray(msgs)) setMessages(msgs);
        if (!cancelled && activeConv!.unreadCount > 0) {
          connectorApi(`${base}/conversations/${activeConv!.id}/read`, { method: "POST" }).catch(() => {});
          setMatchedConvs((prev) =>
            prev.map((c) => (c.id === activeConv!.id ? { ...c, unreadCount: 0 } : c)),
          );
        }
      } catch {
        if (!cancelled) setMessages([]);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeConv?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // SSE for active conversation
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
  }, [activeConv?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectTab(connId: string) {
    if (connId === selectedConnId) return;
    setSelectedConnId(connId);
    setMessages([]);
    setMsgText("");
    setPendingFile(null);
    setSendError(null);
  }

  async function handleSend() {
    if (!selectedConn || !contactPhone) return;
    const text = msgText.trim();
    const file = pendingFile;
    if (!text && !file) return;

    setSendError(null);

    const base = connectorBase(selectedConn.type, selectedConn.id);
    const to = activeConv ? activeConv.externalId : contactPhone.replace(/[^0-9+]/g, "");

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

      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? { ...m, status: "SENT" } : m)),
      );

      // If this was a new conversation, reload conversations
      if (!activeConv && contactPhone) {
        const convs = await searchConversations(contactPhone);
        setMatchedConvs(convs);
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

  if (connectors.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400 px-6">
        <WifiOff size={36} strokeWidth={1.5} className="opacity-30" />
        <p className="text-sm font-medium text-gray-500">Нет подключённых линий</p>
        <p className="text-xs text-center text-gray-400 max-w-[240px]">
          Подключите мессенджер в{" "}
          <a href="https://connector.orinax.ai" target="_blank" rel="noreferrer" className="text-brand-500 hover:underline">Коннекторе</a>.
        </p>
      </div>
    );
  }

  const canSend = !!contactPhone && !!selectedConn && (!!msgText.trim() || !!pendingFile) && !sending;

  // ── Main UI — always shows connector tabs + content area ────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* ── Connector tabs ─────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-gray-100 px-2 pt-2 pb-1">
        <div className="flex gap-1 overflow-x-auto">
          {connectors.map((c) => {
            const isActive = c.id === selectedConnId;
            const m = getMeta(c.type);
            const conv = matchedConvs.find((cv) => cv.instanceId === c.id);
            const status = c.liveStatus || c.status;
            const isOnline = status === "CONNECTED";

            return (
              <button
                key={c.id}
                onClick={() => selectTab(c.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? `${m.activeBg} ${m.activeBorder} ${m.text}`
                    : `bg-white border-gray-200 text-gray-500 hover:bg-gray-50`
                }`}
              >
                <ConnectorIcon type={c.type} />
                <span className="max-w-[80px] truncate">{c.name}</span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                {conv && conv.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[8px] font-bold min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-0.5">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Messages area ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50/40">
        {hasConversation && messages.length > 0 ? (
          messages.map((msg, i) => <Bubble key={msg.id ?? i} message={msg} />)
        ) : hasConversation && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
            <MessageSquare size={28} strokeWidth={1.5} className="opacity-25" />
            <p className="text-sm">Сообщений пока нет</p>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
            <Send size={24} strokeWidth={1.5} className="opacity-25" />
            <p className="text-sm">Нет переписки через {selectedConn?.name}</p>
            <p className="text-[11px] text-gray-400">
              Напишите первое сообщение на {contactPhone}
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Send error ─────────────────────────────────────────────────────── */}
      {sendError && (
        <div className="px-4 py-1.5 bg-red-50 border-t border-red-100 text-xs text-red-600 flex items-center justify-between">
          <span>{sendError}</span>
          <button onClick={() => setSendError(null)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
        </div>
      )}

      {/* ── File preview ───────────────────────────────────────────────────── */}
      {pendingFile && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-t border-gray-100 text-xs text-gray-500 bg-gray-50">
          <Paperclip size={12} />
          <span className="flex-1 truncate">{pendingFile.name}</span>
          <button onClick={() => setPendingFile(null)} className="text-red-400 hover:text-red-500">✕</button>
        </div>
      )}

      {/* ── Composer — always visible ──────────────────────────────────────── */}
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
            placeholder={hasConversation ? "Сообщение..." : `Написать на ${contactPhone}...`}
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
