// ─── Core UI types ────────────────────────────────────────────────────────────
// Deal.stage holds the DealStage enum value as a plain string so the type is
// serializable across the Server Action boundary and usable as a dnd-kit id.

export interface Deal {
  id: string;
  serialNumber: number;
  title: string;
  value: number;
  currency: string;
  /** Dynamic Stage.id or fallback DealStage enum value */
  stage: string;
  contactId: string | null;
  contactSerialNumber: number | null;
  contactName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  company: string | null;
  assignedId: string | null;
  assignee: string | null;
  description: string | null;
  tags: string[];
  createdAt: string;
  stageId: string | null;
  pipelineId: string | null;
  lastActivityTime: string | null;
  customFieldValues: Record<string, unknown>;
}

export interface CreateDealInput {
  title: string;
  value: number;
  stage: string;
  pipelineId?: string;
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

