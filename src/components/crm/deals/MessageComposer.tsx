"use client";

import { useRef, useState, useTransition, type KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";

interface MessageComposerProps {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
}

export default function MessageComposer({
  onSend,
  disabled,
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = text.trim().length > 0 && !isPending && !disabled;

  function resetTextarea() {
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleSend() {
    if (!canSend) return;
    const value = text.trim();
    resetTextarea();
    startTransition(async () => {
      await onSend(value);
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  return (
    <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-2.5">
      <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-200 transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={isPending || disabled}
          placeholder={
            disabled ? "Диалог не найден" : "Написать сообщение..."
          }
          className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none max-h-[120px] leading-relaxed disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="shrink-0 p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Отправить"
        >
          {isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
      <p className="mt-1 text-[10px] text-gray-400 pl-1">
        Enter — отправить · Shift+Enter — перенос строки
      </p>
    </div>
  );
}
