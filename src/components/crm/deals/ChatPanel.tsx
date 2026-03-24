"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, AlertCircle } from "lucide-react";
import {
  getDealConversation,
  sendChatMessage,
  type ChatMessage,
} from "@/app/actions/chat";
import MessageComposer from "./MessageComposer";

const POLL_INTERVAL_MS = 4000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

type OptimisticMessage = ChatMessage & { sending?: boolean };

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({ message }: { message: OptimisticMessage }) {
  const isInbound = message.fromExternal;

  return (
    <div className={`flex ${isInbound ? "justify-start" : "justify-end"} mb-2.5`}>
      <div
        className={`max-w-[78%] flex flex-col gap-0.5 ${
          isInbound ? "items-start" : "items-end"
        }`}
      >
        {isInbound && message.authorName && (
          <span className="text-[10px] text-gray-400 ml-1">
            {message.authorName}
          </span>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap ${
            isInbound
              ? "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
              : "bg-brand-600 text-white rounded-tr-sm"
          } ${message.sending ? "opacity-55" : ""}`}
        >
          {message.body ?? ""}
        </div>
        <span
          className={`text-[10px] text-gray-400 ${
            isInbound ? "ml-1" : "mr-1"
          }`}
        >
          {message.sending ? "Отправка..." : formatTime(message.createdAt)}
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
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const data = await getDealConversation(dealId);
        setConversationId(data.conversationId);
        setMessages((prev) => {
          // Preserve optimistic (sending) messages not yet confirmed by DB
          const serverIds = new Set(data.messages.map((m) => m.id));
          const optimistic = prev.filter(
            (m) => m.sending && !serverIds.has(m.id)
          );
          return [...data.messages, ...optimistic];
        });
        if (!silent) setError(null);
      } catch {
        if (!silent) setError("Не удалось загрузить чат");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [dealId]
  );

  // Initial load
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Polling for incoming messages
  useEffect(() => {
    pollingRef.current = setInterval(() => loadMessages(true), POLL_INTERVAL_MS);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loadMessages]);

  // Auto-scroll to bottom whenever message count changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(text: string) {
    const optimisticId = `opt_${Date.now()}`;
    const optimisticMsg: OptimisticMessage = {
      id: optimisticId,
      body: text,
      fromExternal: false,
      createdAt: new Date().toISOString(),
      authorName: null,
      sending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const saved = await sendChatMessage(dealId, text);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId ? { ...saved, sending: false } : m
        )
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
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

  // ── Error state ────────────────────────────────────────────────────────────
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

  const noConversation = !conversationId;

  // ── Chat UI ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* Message feed */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50/40">
        {noConversation ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 py-10">
            <MessageSquare size={32} strokeWidth={1.5} className="opacity-30" />
            <p className="text-sm text-center">
              Диалог не найден.
            </p>
            <p className="text-xs text-center text-gray-400">
              Убедитесь, что у контакта есть активный чат в мессенджере.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 py-10">
            <MessageSquare size={32} strokeWidth={1.5} className="opacity-30" />
            <p className="text-sm">Сообщений пока нет</p>
          </div>
        ) : (
          messages.map((msg) => <Bubble key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <MessageComposer onSend={handleSend} disabled={noConversation} />
    </div>
  );
}
