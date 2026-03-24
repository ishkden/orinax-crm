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
}

export interface Pipeline {
  id: string;
  label: string;
  stages: Stage[];
}

// ─── UI constants ─────────────────────────────────────────────────────────────

/** Stage IDs that represent a closed deal (used for overdue-date styling). */
export const CLOSED_STAGE_IDS = new Set(["CLOSED_WON", "CLOSED_LOST"]);

export const priorities: { value: Deal["priority"]; label: string; color: string }[] = [
  { value: "LOW",    label: "Низкий",  color: "#9CA3AF" },
  { value: "MEDIUM", label: "Средний", color: "#3B82F6" },
  { value: "HIGH",   label: "Высокий", color: "#F59E0B" },
  { value: "URGENT", label: "Срочный", color: "#EF4444" },
];
