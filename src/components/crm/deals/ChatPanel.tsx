"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  AlertCircle,
  Send,
  Loader2,
  Paperclip,
  ChevronDown,
  Wifi,
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

type Conversation = {
  id: string;
  externalId: string;
  title?: string;
  avatarUrl?: string;
  unreadCount: number;
  lastMessageAt?: string;
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
  { bg: string; border: string; text: string; label: string; dot: string }
> = {
  MAX: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-600",
    label: "M",
    dot: "bg-indigo-500",
  },
  VK: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-600",
    label: "VK",
    dot: "bg-blue-500",
  },
  TELEGRAM: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-600",
    label: "TG",
    dot: "bg-sky-500",
  },
  AVITO: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-600",
    label: "AV",
    dot: "bg-emerald-500",
  },
  WHATSAPP: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-600",
    label: "WA",
    dot: "bg-green-500",
  },
  INSTAGRAM: {
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-600",
    label: "IN",
    dot: "bg-pink-500",
  },
};

function getMeta(type: string) {
  return (
    CONNECTOR_META[type] ?? {
      bg: "bg-gray-50",
      border: "border-gray-200",
      text: "text-gray-600",
      label: type[0] ?? "?",
      dot: "bg-gray-500",
    }
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function connectorApi(path: string, opts: RequestInit = {}) {
  const url = `/api/connector?path=${encodeURIComponent(path)}`;
  const res = await fetch(url, opts);
  return res.json();
}

function connectorBase(type: string, id: string) {
  return `/connectors/${type.toLowerCase()}/${id}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "только что";
  if (s < 3600) return Math.floor(s / 60) + " мин назад";
  if (s < 86400) return Math.floor(s / 3600) + " ч назад";
  return Math.floor(s / 86400) + " дн назад";
}

// ─── Connector icon ───────────────────────────────────────────────────────────

function ConnectorIcon({
  type,
  size = "sm",
}: {
  type: string;
  size?: "sm" | "md";
}) {
  const m = getMeta(type);
  const sz =
    size === "md"
      ? "w-8 h-8 text-[11px] rounded-lg"
      : "w-6 h-6 text-[10px] rounded-md";
  return (
    <div
      className={`${sz} flex items-center justify-center font-bold border ${m.bg} ${m.border} ${m.text} shrink-0`}
    >
      {m.label}
    </div>
  );
}

// ─── Line selector ────────────────────────────────────────────────────────────

function LineSelector({
  connectors,
  selectedId,
  onSelect,
}: {
  connectors: Connector[];
  selectedId: string;
  onSelect: (c: Connector) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = connectors.find((c) => c.id === selectedId);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!selected) return null;

  const status = selected.liveStatus || selected.status;
  const isOnline = status === "CONNECTED";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <ConnectorIcon type={selected.type} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-800 truncate">
            {selected.name}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? "bg-green-500" : "bg-gray-400"}`}
            />
            {isOnline ? "Онлайн" : status?.toLowerCase() ?? "Офлайн"}
          </div>
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {connectors.map((c) => {
            const s = c.liveStatus || c.status;
            const on = s === "CONNECTED";
            return (
              <button
                key={c.id}
                onClick={() => {
                  onSelect(c);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${c.id === selectedId ? "bg-brand-50" : ""}`}
              >
                <ConnectorIcon type={c.type} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">
                    {c.name}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${on ? "bg-green-500" : "bg-gray-400"}`}
                    />
                    {c.type}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Conversation list item ───────────────────────────────────────────────────

function ConvItem({
  conv,
  isActive,
  onClick,
}: {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 transition-colors flex items-center gap-2.5 ${
        isActive
          ? "bg-brand-50 border-l-2 border-brand-500"
          : "hover:bg-gray-50 border-l-2 border-transparent"
      }`}
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0 bg-brand-500">
        {conv.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={conv.avatarUrl}
            alt=""
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          conv.title?.[0]?.toUpperCase() || "#"
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-xs truncate ${conv.unreadCount > 0 && !isActive ? "font-bold text-gray-900" : "text-gray-700"}`}
          >
            {conv.title || `ID ${conv.externalId}`}
          </span>
          {conv.unreadCount > 0 && !isActive && (
            <span className="bg-brand-600 text-white text-[9px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1 shrink-0">
              {conv.unreadCount}
            </span>
          )}
        </div>
        <div className="text-[10px] text-gray-400">
          {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : "—"}
        </div>
      </div>
    </button>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({ message }: { message: Message }) {
  const isInbound = message.direction === "INBOUND";

  return (
    <div
      className={`flex ${isInbound ? "justify-start" : "justify-end"} mb-2`}
    >
      <div
        className={`max-w-[78%] flex flex-col gap-0.5 ${isInbound ? "items-start" : "items-end"}`}
      >
        {isInbound && message.senderName && (
          <span className="text-[10px] text-gray-400 ml-1">
            {message.senderName}
          </span>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap ${
            isInbound
              ? "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
              : "bg-brand-600 text-white rounded-tr-sm"
          } ${message.status === "SENDING" ? "opacity-55" : ""}`}
        >
          {message.mediaUrl &&
            ((message.mediaType || "").startsWith("image") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={message.mediaUrl}
                alt=""
                className="max-w-[200px] rounded-xl mb-1 cursor-pointer"
                onClick={() => window.open(message.mediaUrl)}
              />
            ) : (message.mediaType || "").startsWith("video") ? (
              <video
                src={message.mediaUrl}
                controls
                className="max-w-[200px] rounded-xl mb-1"
              />
            ) : (
              <a
                href={message.mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-black/5 rounded-lg text-xs mb-1"
              >
                <Paperclip size={12} /> {message.fileName || "Файл"}
              </a>
            ))}
          {message.text && <div>{message.text}</div>}
        </div>
        <span
          className={`text-[10px] text-gray-400 ${isInbound ? "ml-1" : "mr-1"}`}
        >
          {message.status === "SENDING" ? (
            "Отправка..."
          ) : (
            <>
              {formatTime(message.createdAt)}
              {!isInbound &&
                (message.status === "FAILED" ? (
                  <span className="ml-1 text-red-400">✗</span>
                ) : (
                  <span className="ml-1">✓</span>
                ))}
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
}

export default function ChatPanel({ dealId }: ChatPanelProps) {
  void dealId;

  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [selectedConnId, setSelectedConnId] = useState("");
  const [selectedConnType, setSelectedConnType] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const activeChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);
  useEffect(() => {
    return () => eventSourceRef.current?.close();
  }, []);

  // Load connectors on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await connectorApi("/connectors");
        if (!cancelled && Array.isArray(data)) {
          setConnectors(data);
          if (data.length > 0) {
            setSelectedConnId(data[0].id);
            setSelectedConnType(data[0].type);
          }
        }
      } catch {
        if (!cancelled) setError("Не удалось загрузить коннекторы");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load conversations when connector selected
  const loadConversations = useCallback(
    async (connId: string, connType: string) => {
      try {
        const data = await connectorApi(
          `${connectorBase(connType, connId)}/conversations`,
        );
        if (Array.isArray(data)) setConversations(data);
      } catch {
        setConversations([]);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedConnId) return;
    loadConversations(selectedConnId, selectedConnType);
  }, [selectedConnId, selectedConnType, loadConversations]);

  // Open SSE when connector selected
  useEffect(() => {
    if (!selectedConnId) return;
    eventSourceRef.current?.close();
    const base = connectorBase(selectedConnType, selectedConnId);
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
        // Refresh conversation list for unread counts
        loadConversations(selectedConnId, selectedConnType);
      } catch {
        /* ignore parse errors */
      }
    });
    eventSourceRef.current = es;
    return () => es.close();
  }, [selectedConnId, selectedConnType, loadConversations]);

  function selectConnector(c: Connector) {
    setSelectedConnId(c.id);
    setSelectedConnType(c.type);
    setActiveChatId(null);
    setActiveConvId(null);
    setMessages([]);
    setConversations([]);
  }

  async function selectConversation(conv: Conversation) {
    setActiveChatId(conv.externalId);
    setActiveConvId(conv.id);
    const base = connectorBase(selectedConnType, selectedConnId);
    const msgs = await connectorApi(
      `${base}/conversations/${conv.id}/messages`,
    );
    if (Array.isArray(msgs)) setMessages(msgs);
    if (conv.unreadCount > 0) {
      connectorApi(`${base}/conversations/${conv.id}/read`, {
        method: "POST",
      }).catch(() => {});
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
      );
    }
  }

  async function handleSend() {
    if (!selectedConnId || !activeChatId) return;
    if (!msgText.trim() && !pendingFile) return;
    const text = msgText.trim();
    setMsgText("");
    const file = pendingFile;
    setPendingFile(null);
    setSending(true);

    setMessages((prev) => [
      ...prev,
      {
        direction: "OUTBOUND",
        text: text || (file ? `[${file.name}]` : ""),
        fileName: file?.name,
        mediaType: file?.type,
        status: "SENDING",
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const base = connectorBase(selectedConnType, selectedConnId);
      if (file) {
        const fd = new FormData();
        fd.append("to", activeChatId);
        fd.append("text", text);
        fd.append("file", file);
        await fetch(
          `/api/connector?path=${encodeURIComponent(`${base}/send-file`)}`,
          { method: "POST", body: fd },
        );
      } else {
        await connectorApi(`${base}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: activeChatId, text }),
        });
      }
    } catch {
      /* optimistic — message already shown */
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
          <span className="text-xs">Загрузка линий...</span>
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

  // ── No connectors ───────────────────────────────────────────────────────────
  if (connectors.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400 px-6">
        <WifiOff size={36} strokeWidth={1.5} className="opacity-30" />
        <p className="text-sm font-medium text-gray-500">
          Нет подключённых линий
        </p>
        <p className="text-xs text-center text-gray-400 max-w-[240px]">
          Подключите мессенджер в разделе{" "}
          <a
            href="https://connector.orinax.ai"
            target="_blank"
            rel="noreferrer"
            className="text-brand-500 hover:underline"
          >
            Коннектор
          </a>{" "}
          чтобы начать общение с клиентами.
        </p>
      </div>
    );
  }

  const canSend = !!activeChatId && (!!msgText.trim() || !!pendingFile) && !sending;

  // ── Main UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* Line selector */}
      <div className="shrink-0 px-3 pt-3 pb-2 border-b border-gray-100">
        <LineSelector
          connectors={connectors}
          selectedId={selectedConnId}
          onSelect={selectConnector}
        />
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 flex">
        {/* Conversation sidebar */}
        <div className="w-[200px] shrink-0 border-r border-gray-100 overflow-y-auto bg-white">
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-gray-400 text-[11px]">
              Нет диалогов
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {conversations.map((c) => (
                <ConvItem
                  key={c.id}
                  conv={c}
                  isActive={activeChatId === c.externalId}
                  onClick={() => selectConversation(c)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Messages + composer */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50/40">
            {!activeChatId ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 py-10">
                <Wifi size={28} strokeWidth={1.5} className="opacity-25" />
                <p className="text-sm">Выберите диалог</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 py-10">
                <MessageSquare
                  size={28}
                  strokeWidth={1.5}
                  className="opacity-25"
                />
                <p className="text-sm">Сообщений пока нет</p>
              </div>
            ) : (
              messages.map((msg, i) => <Bubble key={msg.id ?? i} message={msg} />)
            )}
            <div ref={bottomRef} />
          </div>

          {/* File preview */}
          {pendingFile && (
            <div className="flex items-center gap-2 px-4 py-1.5 border-t border-gray-100 text-xs text-gray-500 bg-gray-50">
              <Paperclip size={12} />
              <span className="flex-1 truncate">{pendingFile.name}</span>
              <button
                onClick={() => setPendingFile(null)}
                className="text-red-400 hover:text-red-500"
              >
                ✕
              </button>
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
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPendingFile(f);
                  e.target.value = "";
                }}
              />
              <textarea
                ref={textareaRef}
                rows={1}
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                onInput={handleTextareaInput}
                disabled={!activeChatId}
                placeholder={
                  activeChatId ? "Сообщение..." : "Выберите диалог"
                }
                className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none max-h-[120px] leading-relaxed disabled:opacity-40"
              />
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="shrink-0 p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 disabled:opacity-30 transition-colors"
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
