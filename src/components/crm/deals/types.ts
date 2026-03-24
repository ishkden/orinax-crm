// ─── Core UI types ────────────────────────────────────────────────────────────
// Deal.stage holds the DealStage enum value as a plain string so the type is
// serializable across the Server Action boundary and usable as a dnd-kit id.

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  /** Prisma DealStage enum value, e.g. "LEAD" | "QUALIFIED" | … */
  stage: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  contactId: string | null;
  /** Derived: contact.firstName + " " + contact.lastName */
  contactName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  /** Derived: contact.company */
  company: string | null;
  assignedId: string | null;
  /** Derived: assigned.name */
  assignee: string | null;
  /** Maps from Prisma Deal.closeDate */
  dueDate: string | null;
  description: string | null;
  tags: string[];
  createdAt: string;
}

export interface CreateDealInput {
  title: string;
  value: number;
  stage: string;
  priority: Deal["priority"];
  dueDate: string;
}

export interface Stage {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export interface Pipeline {
  id: string;
  label: string;
  stages: Stage[];
}

// ─── Pipeline config ──────────────────────────────────────────────────────────
// "main" pipeline stage IDs match Prisma DealStage enum values exactly,
// so they can be written back to the DB without any translation layer.
// The b2b / partner pipelines are UI-only until a Pipeline model is added.

export const pipelines: Pipeline[] = [
  {
    id: "main",
    label: "Основная воронка",
    stages: [
      { id: "LEAD",        label: "Новый лид",       color: "#6B7280", bgColor: "bg-gray-50",    borderColor: "border-gray-300",   textColor: "text-gray-700"   },
      { id: "QUALIFIED",   label: "Квалификация",    color: "#6366F1", bgColor: "bg-indigo-50",  borderColor: "border-indigo-300", textColor: "text-indigo-700" },
      { id: "PROPOSAL",    label: "КП отправлено",   color: "#8B5CF6", bgColor: "bg-violet-50",  borderColor: "border-violet-300", textColor: "text-violet-700" },
      { id: "NEGOTIATION", label: "Переговоры",      color: "#F59E0B", bgColor: "bg-amber-50",   borderColor: "border-amber-300",  textColor: "text-amber-700"  },
      { id: "CLOSED_WON",  label: "Успешно закрыт",  color: "#10B981", bgColor: "bg-emerald-50", borderColor: "border-emerald-300",textColor: "text-emerald-700"},
      { id: "CLOSED_LOST", label: "Не реализован",   color: "#EF4444", bgColor: "bg-red-50",     borderColor: "border-red-300",    textColor: "text-red-700"    },
    ],
  },
  {
    id: "b2b",
    label: "B2B продажи",
    stages: [
      { id: "lead",     label: "Лид",     color: "#6B7280", bgColor: "bg-gray-50",   borderColor: "border-gray-300",   textColor: "text-gray-700"   },
      { id: "demo",     label: "Демо",    color: "#3B82F6", bgColor: "bg-blue-50",   borderColor: "border-blue-300",   textColor: "text-blue-700"   },
      { id: "pilot",    label: "Пилот",   color: "#8B5CF6", bgColor: "bg-violet-50", borderColor: "border-violet-300", textColor: "text-violet-700" },
      { id: "contract", label: "Договор", color: "#F59E0B", bgColor: "bg-amber-50",  borderColor: "border-amber-300",  textColor: "text-amber-700"  },
      { id: "closed",   label: "Закрыт",  color: "#10B981", bgColor: "bg-emerald-50",borderColor: "border-emerald-300",textColor: "text-emerald-700"},
    ],
  },
  {
    id: "partner",
    label: "Партнёрская программа",
    stages: [
      { id: "interest",   label: "Интерес",    color: "#6B7280", bgColor: "bg-gray-50",   borderColor: "border-gray-300",   textColor: "text-gray-700"   },
      { id: "evaluation", label: "Оценка",     color: "#6366F1", bgColor: "bg-indigo-50", borderColor: "border-indigo-300", textColor: "text-indigo-700" },
      { id: "onboarding", label: "Онбординг",  color: "#F59E0B", bgColor: "bg-amber-50",  borderColor: "border-amber-300",  textColor: "text-amber-700"  },
      { id: "active",     label: "Активный",   color: "#10B981", bgColor: "bg-emerald-50",borderColor: "border-emerald-300",textColor: "text-emerald-700"},
    ],
  },
];

// ─── UI constants ─────────────────────────────────────────────────────────────

/** Stage IDs that represent a closed deal (used for overdue-date styling). */
export const CLOSED_STAGE_IDS = new Set(["CLOSED_WON", "CLOSED_LOST"]);

export const priorities: { value: Deal["priority"]; label: string; color: string }[] = [
  { value: "LOW",    label: "Низкий",  color: "#9CA3AF" },
  { value: "MEDIUM", label: "Средний", color: "#3B82F6" },
  { value: "HIGH",   label: "Высокий", color: "#F59E0B" },
  { value: "URGENT", label: "Срочный", color: "#EF4444" },
];
