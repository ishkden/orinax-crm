"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle2, Circle, Plus, Loader2, ListChecks, AlertCircle } from "lucide-react";
import {
  getDealTasks,
  toggleTaskStatus,
  createDealTask,
  type TaskItem,
} from "@/app/actions/deals";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDeadline(iso: string): { label: string; overdue: boolean } {
  const date = new Date(iso);
  const now = new Date();
  const overdue = date < now;
  const label = date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
  return { label, overdue };
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW:    "bg-gray-100 text-gray-500",
  MEDIUM: "bg-blue-50 text-blue-600",
  HIGH:   "bg-amber-50 text-amber-600",
  URGENT: "bg-red-50 text-red-600",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Низкий", MEDIUM: "Средний", HIGH: "Высокий", URGENT: "Срочный",
};

// ─── Single task row ──────────────────────────────────────────────────────────

function TaskRow({
  task,
  onToggle,
}: {
  task: TaskItem;
  onToggle: (id: string, isDone: boolean) => void;
}) {
  const isDone = task.status === "DONE" || task.status === "CANCELLED";
  const deadline = task.dueDate ? formatDeadline(task.dueDate) : null;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors ${
        isDone
          ? "bg-gray-50 border-gray-100 opacity-60"
          : "bg-white border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(task.id, !isDone)}
        className={`mt-0.5 shrink-0 transition-colors ${
          isDone ? "text-emerald-500" : "text-gray-300 hover:text-brand-500"
        }`}
        aria-label={isDone ? "Открыть задачу" : "Закрыть задачу"}
      >
        {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${
            isDone ? "line-through text-gray-400" : "text-gray-800"
          }`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {/* Priority badge */}
          <span
            className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
              PRIORITY_COLORS[task.priority] ?? "bg-gray-100 text-gray-500"
            }`}
          >
            {PRIORITY_LABELS[task.priority] ?? task.priority}
          </span>

          {/* Deadline badge */}
          {deadline && (
            <span
              className={`flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                deadline.overdue && !isDone
                  ? "bg-red-50 text-red-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {deadline.overdue && !isDone && (
                <AlertCircle size={10} className="shrink-0" />
              )}
              {deadline.label}
            </span>
          )}

          {/* Assignee */}
          {task.assignee && (
            <span className="text-[11px] text-gray-400 truncate">
              {task.assignee}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TaskList({ dealId }: { dealId: string }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDealTasks(dealId);
      setTasks(data);
    } catch {
      // silently ignore — component shows empty list on error
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleToggle(taskId: string, isDone: boolean) {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: isDone ? "DONE" : "TODO" } : t
      )
    );
    startTransition(async () => {
      try {
        await toggleTaskStatus(taskId, isDone);
        await load();
      } catch {
        // silently ignore
      }
    });
  }

  function handleAddTask() {
    const title = newTitle.trim();
    if (!title) return;
    startTransition(async () => {
      try {
        await createDealTask(dealId, title);
        setNewTitle("");
        await load();
      } catch {
        // silently ignore
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTask();
    }
  }

  const active = tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");
  const done = tasks.filter((t) => t.status === "DONE" || t.status === "CANCELLED");

  return (
    <div className="flex flex-col gap-4 px-5 pb-6">
      {/* ── Quick add input ── */}
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm focus-within:border-brand-400 transition-colors">
        <Plus size={15} className="text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Добавить задачу… (Enter)"
          className="flex-1 text-sm text-gray-800 placeholder:text-gray-400 bg-transparent focus:outline-none"
        />
        {isPending && (
          <Loader2 size={14} className="animate-spin text-gray-400 shrink-0" />
        )}
      </div>

      {/* ── Task list ── */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin text-gray-300" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 py-10 text-gray-400">
          <ListChecks size={28} strokeWidth={1.5} className="opacity-40" />
          <p className="text-sm">Задач пока нет</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {active.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={handleToggle} />
          ))}
          {done.length > 0 && active.length > 0 && (
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[11px] text-gray-400 font-medium">
                Выполнено {done.length}
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
          )}
          {done.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={handleToggle} />
          ))}
        </div>
      )}
    </div>
  );
}
