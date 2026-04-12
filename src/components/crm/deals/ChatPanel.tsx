"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MessageSquare,
  AlertCircle,
  Send,
  Loader2,
  Paperclip,
  Phone,
  WifiOff,
  Smile,
  Mic,
  X,
  Image as ImageIcon,
  Video,
  FileText,
  File as FileIcon,
  Reply,
  Trash2,
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
  externalId?: string;
  direction: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  fileName?: string;
  senderName?: string;
  status?: string;
  replyToExternalId?: string;
  replyToText?: string;
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

// ─── Emoji data ───────────────────────────────────────────────────────────────

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  { label: "Часто", emojis: ["😀","😂","🥹","❤️","🔥","👍","👎","👋","🙏","😊","😍","😭","😡","🤔","👀","🎉","💯","✅","❌","⭐"] },
  { label: "Лица", emojis: ["😎","🤩","🥳","😇","🤗","🤭","😏","😢","😤","🥺","😴","🤮","🤡","💀","👻","😈","🤓","😋","😜","🤯"] },
  { label: "Жесты", emojis: ["👌","✌️","🤞","🤝","💪","👏","🫶","🤙","👊","✊","🫡","🙌","☝️","👆","👇","👈","👉","🫰","🤌","💅"] },
  { label: "Символы", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","❣️","💕","💗","💖","🌟","💫","⚡","🌈","☀️","🌙","💎"] },
];

// ─── File menu options ────────────────────────────────────────────────────────

const FILE_OPTIONS = [
  { label: "Фото", icon: ImageIcon, accept: "image/*" },
  { label: "Видео", icon: Video, accept: "video/*" },
  { label: "Документ", icon: FileText, accept: ".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" },
  { label: "Файл", icon: FileIcon, accept: "*/*" },
];

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

// ─── Context menu ─────────────────────────────────────────────────────────────

function ContextMenu({
  x,
  y,
  message,
  onReply,
  onDelete,
  onClose,
}: {
  x: number;
  y: number;
  message: Message;
  onReply: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const isOutbound = message.direction === "OUTBOUND";

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: "fixed", left: x, top: y, zIndex: 9999 }}
      className="min-w-[140px] bg-white rounded-xl shadow-lg border border-gray-200 py-1 animate-in fade-in zoom-in-95 duration-100"
    >
      <button
        onClick={() => { onReply(); onClose(); }}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Reply size={14} /> Ответить
      </button>
      {isOutbound && (
        <button
          onClick={() => { onDelete(); onClose(); }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} /> Удалить
        </button>
      )}
    </div>,
    document.body,
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({
  message,
  messages,
  onContextMenu,
}: {
  message: Message;
  messages: Message[];
  onContextMenu: (e: React.MouseEvent, msg: Message) => void;
}) {
  const isInbound = message.direction === "INBOUND";
  const replyMsg = message.replyToExternalId
    ? messages.find((m) => m.externalId === message.replyToExternalId)
    : null;

  return (
    <div
      className={`flex ${isInbound ? "justify-start" : "justify-end"} mb-2`}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, message); }}
    >
      <div className={`max-w-[78%] flex flex-col gap-0.5 ${isInbound ? "items-start" : "items-end"}`}>
        {isInbound && message.senderName && (
          <span className="text-[10px] text-gray-400 ml-1">{message.senderName}</span>
        )}
        {(replyMsg || message.replyToText) && (
          <div className={`text-[11px] px-2.5 py-1 rounded-lg border-l-2 border-brand-400 bg-brand-50 text-gray-600 max-w-full truncate ${isInbound ? "ml-1" : "mr-1"}`}>
            {replyMsg?.text || message.replyToText || "..."}
          </div>
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
            ) : (message.mediaType || "").startsWith("audio") ? (
              <audio src={message.mediaUrl} controls className="max-w-[220px] mb-1" />
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
  void contactName;

  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [matchedConvs, setMatchedConvs] = useState<SearchConversation[]>([]);
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Emoji picker
  const [emojiOpen, setEmojiOpen] = useState(false);
  // File type menu
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: Message } | null>(null);
  // Reply
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  // Typing indicator
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);

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

  // Close emoji / file menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (emojiOpen && emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiOpen(false);
      if (fileMenuOpen && fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) setFileMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [emojiOpen, fileMenuOpen]);

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

  // SSE for active conversation (messages + typing)
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
              externalId: data.externalMessageId,
              replyToExternalId: data.replyToExternalId,
              replyToText: data.replyToText,
              status: "SENT",
              createdAt: data.timestamp || new Date().toISOString(),
            },
          ]);
        }
      } catch { /* ignore */ }
    });

    es.addEventListener("typing", (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.chatId === activeChatIdRef.current && data.isTyping !== false) {
          setTypingUser(data.userName || "Собеседник");
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setTypingUser(null), 6000);
        } else if (data.chatId === activeChatIdRef.current) {
          setTypingUser(null);
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
    setReplyTo(null);
    setTypingUser(null);
  }

  // ── Send message ──────────────────────────────────────────────────────────

  async function handleSend() {
    if (!selectedConn || !contactPhone) return;
    const text = msgText.trim();
    const file = pendingFile;
    if (!text && !file) return;

    setSendError(null);

    const base = connectorBase(selectedConn.type, selectedConn.id);
    const to = activeConv ? activeConv.externalId : contactPhone.replace(/[^0-9+]/g, "");

    const currentReply = replyTo;
    setMsgText("");
    setPendingFile(null);
    setReplyTo(null);
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
        replyToExternalId: currentReply?.externalId,
        replyToText: currentReply?.text,
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
      } else if (currentReply?.externalId) {
        await connectorApi(`${base}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, text, replyTo: currentReply.externalId }),
        });
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

  // ── Delete message ────────────────────────────────────────────────────────

  async function handleDeleteMessage(msg: Message) {
    if (!selectedConn || !activeConv || !msg.id) return;
    const base = connectorBase(selectedConn.type, selectedConn.id);
    try {
      await connectorApi(`${base}/conversations/${activeConv.id}/messages/${msg.id}`, {
        method: "DELETE",
      });
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } catch {
      setSendError("Не удалось удалить сообщение");
    }
  }

  // ── Voice recording ───────────────────────────────────────────────────────

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recordChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) recordChunksRef.current.push(e.data); };
      mr.onstop = () => stream.getTracks().forEach((t) => t.stop());
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordDuration(0);
      recordTimerRef.current = setInterval(() => setRecordDuration((d) => d + 1), 1000);
    } catch {
      setSendError("Нет доступа к микрофону");
    }
  }

  function cancelRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    recordChunksRef.current = [];
  }

  async function stopAndSendRecording() {
    if (!mediaRecorderRef.current || !selectedConn || !contactPhone) return;
    const mr = mediaRecorderRef.current;

    const blob = await new Promise<Blob>((resolve) => {
      mr.ondataavailable = (e) => { if (e.data.size > 0) recordChunksRef.current.push(e.data); };
      mr.onstop = () => {
        mr.stream.getTracks().forEach((t) => t.stop());
        resolve(new Blob(recordChunksRef.current, { type: "audio/webm" }));
      };
      mr.stop();
    });

    setIsRecording(false);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    mediaRecorderRef.current = null;

    if (blob.size === 0) return;

    const base = connectorBase(selectedConn.type, selectedConn.id);
    const to = activeConv ? activeConv.externalId : contactPhone.replace(/[^0-9+]/g, "");
    const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });

    setSending(true);
    const optimisticId = `_opt_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: optimisticId, direction: "OUTBOUND", text: "🎤 Голосовое сообщение", mediaType: "audio/webm", status: "SENDING", createdAt: new Date().toISOString() },
    ]);

    try {
      const fd = new FormData();
      fd.append("to", to);
      fd.append("text", "");
      fd.append("file", file);
      const res = await fetch(
        `/api/connector?path=${encodeURIComponent(`${base}/send-file`)}`,
        { method: "POST", body: fd },
      );
      if (!res.ok) throw new Error("Ошибка отправки аудио");
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, status: "SENT" } : m)));
      if (!activeConv && contactPhone) {
        const convs = await searchConversations(contactPhone);
        setMatchedConvs(convs);
      }
    } catch {
      setSendError("Не удалось отправить аудио");
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, status: "FAILED" } : m)));
    } finally {
      setSending(false);
    }
  }

  // ── Emoji insert ──────────────────────────────────────────────────────────

  function insertEmoji(emoji: string) {
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = msgText.slice(0, start);
      const after = msgText.slice(end);
      setMsgText(before + emoji + after);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + emoji.length;
        ta.focus();
      });
    } else {
      setMsgText((t) => t + emoji);
    }
  }

  // ── File menu pick ────────────────────────────────────────────────────────

  function handleFileMenuPick(accept: string) {
    setFileMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  }

  function handleTextareaInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function formatDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
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
  const showMic = !msgText.trim() && !pendingFile && !isRecording;

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
          messages.map((msg, i) => (
            <Bubble
              key={msg.id ?? i}
              message={msg}
              messages={messages}
              onContextMenu={(e, m) => setContextMenu({ x: e.clientX, y: e.clientY, message: m })}
            />
          ))
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

      {/* ── Typing indicator ───────────────────────────────────────────────── */}
      {typingUser && (
        <div className="px-4 py-1 bg-gray-50/60 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1.5">
          <span className="flex gap-0.5">
            <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
          <span>{typingUser} печатает...</span>
        </div>
      )}

      {/* ── Context menu ───────────────────────────────────────────────────── */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          message={contextMenu.message}
          onReply={() => setReplyTo(contextMenu.message)}
          onDelete={() => handleDeleteMessage(contextMenu.message)}
          onClose={() => setContextMenu(null)}
        />
      )}

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

      {/* ── Reply preview ──────────────────────────────────────────────────── */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-t border-gray-100 bg-brand-50/50">
          <Reply size={14} className="text-brand-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-brand-600 font-medium">{replyTo.direction === "INBOUND" ? (replyTo.senderName || "Собеседник") : "Вы"}</p>
            <p className="text-xs text-gray-600 truncate">{replyTo.text || "[медиа]"}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Composer ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-2">
        {isRecording ? (
          /* ── Recording UI ──────────────────────────────────────────────── */
          <div className="flex items-center gap-3 h-10">
            <button onClick={cancelRecording} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Отмена">
              <X size={18} />
            </button>
            <div className="flex items-center gap-2 flex-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">{formatDuration(recordDuration)}</span>
            </div>
            <button onClick={stopAndSendRecording} className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors" title="Отправить">
              <Send size={18} />
            </button>
          </div>
        ) : (
          /* ── Normal composer ────────────────────────────────────────────── */
          <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-200 transition-all">
            {/* File menu button */}
            <div className="relative shrink-0" ref={fileMenuRef}>
              <button
                onClick={() => { setFileMenuOpen(!fileMenuOpen); setEmojiOpen(false); }}
                className="p-1 rounded text-gray-400 hover:text-brand-500 transition-colors"
                title="Прикрепить файл"
              >
                <Paperclip size={16} />
              </button>
              {fileMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[150px] z-50">
                  {FILE_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleFileMenuPick(opt.accept)}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <opt.icon size={15} className="text-gray-400" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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

            {/* Emoji button */}
            <div className="relative shrink-0" ref={emojiRef}>
              <button
                onClick={() => { setEmojiOpen(!emojiOpen); setFileMenuOpen(false); }}
                className={`p-1 rounded transition-colors ${emojiOpen ? "text-brand-500" : "text-gray-400 hover:text-brand-500"}`}
                title="Эмодзи"
              >
                <Smile size={16} />
              </button>
              {emojiOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 w-[280px] max-h-[280px] overflow-y-auto z-50">
                  {EMOJI_CATEGORIES.map((cat) => (
                    <div key={cat.label} className="mb-2 last:mb-0">
                      <p className="text-[10px] text-gray-400 font-medium mb-1 px-0.5">{cat.label}</p>
                      <div className="grid grid-cols-10 gap-0.5">
                        {cat.emojis.map((em) => (
                          <button
                            key={em}
                            onClick={() => insertEmoji(em)}
                            className="w-6 h-6 flex items-center justify-center text-base hover:bg-gray-100 rounded transition-colors"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Send / Mic button */}
            {showMic ? (
              <button
                onClick={startRecording}
                className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                title="Записать голосовое"
              >
                <Mic size={16} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="shrink-0 p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 disabled:opacity-30 transition-colors"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
