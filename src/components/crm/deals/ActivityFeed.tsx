"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  MessageSquare,
  Phone,
  Mail,
  Users,
  Plus,
  ArrowRightCircle,
  UserPlus,
  CheckSquare,
  CheckCheck,
  Briefcase,
  Loader2,
  Clock,
} from "lucide-react";
import {
  getDealActivities,
  createDealNote,
  type ActivityItem,
} from "@/app/actions/deals";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ACTIVITY_META: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  NOTE:                { icon: <MessageSquare size={13} />, color: "text-violet-600", bg: "bg-violet-100" },
  CALL:                { icon: <Phone size={13} />,         color: "text-blue-600",   bg: "bg-blue-100"   },
  EMAIL:               { icon: <Mail size={13} />,          color: "text-sky-600",    bg: "bg-sky-100"    },
  MEETING:             { icon: <Users size={13} />,         color: "text-emerald-600",bg: "bg-emerald-100"},
  DEAL_CREATED:        { icon: <Briefcase size={13} />,     color: "text-gray-600",   bg: "bg-gray-100"   },
  DEAL_STAGE_CHANGED:  { icon: <ArrowRightCircle size={13} />, color: "text-amber-600", bg: "bg-amber-100"},
  CONTACT_CREATED:     { icon: <UserPlus size={13} />,      color: "text-teal-600",   bg: "bg-teal-100"   },
  TASK_CREATED:        { icon: <CheckSquare size={13} />,   color: "text-indigo-600", bg: "bg-indigo-100" },
  TASK_COMPLETED:      { icon: <CheckCheck size={13} />,    color: "text-emerald-600",bg: "bg-emerald-100"},
};

const DEFAULT_META = { icon: <Plus size={13} />, color: "text-gray-500", bg: "bg-gray-100" };

function getActivityMeta(type: string) {
  return ACTIVITY_META[type] ?? DEFAULT_META;
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} дн. назад`;
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: d > 365 ? "numeric" : undefined,
  });
}

// ─── Single feed item ─────────────────────────────────────────────────────────

function FeedItem({ item, isLast }: { item: ActivityItem; isLast: boolean }) {
  const meta = getActivityMeta(item.type);
  return (
    <div className="flex gap-3 group">
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${meta.bg} ${meta.color}`}
        >
          {meta.icon}
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-gray-100 mt-1 min-h-[16px]" />
        )}
      </div>

      {/* Content */}
      <div className={`pb-4 min-w-0 flex-1 ${isLast ? "" : ""}`}>
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-xs font-medium text-gray-800 truncate">
            {item.title}
            {item.author && (
              <span className="font-normal text-gray-400"> · {item.author}</span>
            )}
          </span>
          <time className="text-[11px] text-gray-400 shrink-0">
            {relativeTime(item.createdAt)}
          </time>
        </div>
        {item.body && (
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            {item.body}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ActivityFeed({ dealId }: { dealId: string }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDealActivities(dealId);
      setItems(data);
    } catch (err) {
      // #region agent log
      const errMsg = err instanceof Error ? err.message : String(err);
      fetch('http://127.0.0.1:7361/ingest/c3d66395-7c43-4c80-bafe-22e2cba21bb3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'054ca9'},body:JSON.stringify({sessionId:'054ca9',location:'ActivityFeed.tsx:load',message:'getDealActivities threw',data:{dealId,error:errMsg},hypothesisId:'A',timestamp:Date.now()})}).catch(()=>{});
      console.error('[DEBUG-054ca9] ActivityFeed.load error', errMsg, err);
      // #endregion
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleNote() {
    const text = noteText.trim();
    if (!text) return;
    startTransition(async () => {
      try {
        await createDealNote(dealId, text);
        setNoteText("");
        await load();
      } catch (err) {
        // #region agent log
        const errMsg = err instanceof Error ? err.message : String(err);
        fetch('http://127.0.0.1:7361/ingest/c3d66395-7c43-4c80-bafe-22e2cba21bb3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'054ca9'},body:JSON.stringify({sessionId:'054ca9',location:'ActivityFeed.tsx:handleNote',message:'createDealNote/load threw in transition',data:{dealId,error:errMsg},hypothesisId:'C',timestamp:Date.now()})}).catch(()=>{});
        console.error('[DEBUG-054ca9] ActivityFeed.handleNote transition error', errMsg, err);
        // #endregion
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleNote();
    }
  }

  return (
    <div className="flex flex-col gap-4 px-5 pb-6">
      {/* ── Note input ── */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <textarea
          ref={textareaRef}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Оставьте заметку… (⌘↵ для отправки)"
          rows={3}
          className="w-full resize-none px-3.5 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
        />
        <div className="flex justify-end px-3 py-2 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={handleNote}
            disabled={!noteText.trim() || isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <MessageSquare size={12} />
            )}
            Оставить заметку
          </button>
        </div>
      </div>

      {/* ── Feed ── */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin text-gray-300" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 py-10 text-gray-400">
          <Clock size={28} strokeWidth={1.5} className="opacity-40" />
          <p className="text-sm">Активности пока нет</p>
        </div>
      ) : (
        <div className="pt-1">
          {items.map((item, idx) => (
            <FeedItem key={item.id} item={item} isLast={idx === items.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

