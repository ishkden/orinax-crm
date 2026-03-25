export interface MigrationBatch<T> {
  /** Internal Org.id that all migrated records will be tied to */
  orgId: string;
  data: T[];
}

export interface CompanyPayload {
  /** Bitrix24 company ID — used as the upsert key */
  sourceId: string;
  name: string;
  industry?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
}

export interface ContactPayload {
  /** Bitrix24 contact ID — used as the upsert key */
  sourceId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position?: string;
  notes?: string;
  tags?: string[];
  /** Bitrix24 company ID — resolved to internal Company.id */
  companySourceId?: string;
  /** ISO 8601 string; preserved as the record's createdAt on insert */
  createdAt?: string;
}

export interface PipelinePayload {
  /** Bitrix24 pipeline/funnel ID — used as the upsert key */
  sourceId: string;
  name: string;
  sortOrder?: number;
}

export interface StagePayload {
  /** Bitrix24 stage ID — used as the upsert key */
  sourceId: string;
  name: string;
  color?: string;
  sortOrder?: number;
  isFinal?: boolean;
  isWon?: boolean;
  /** Bitrix24 pipeline ID — resolved to internal Pipeline.id */
  pipelineSourceId: string;
}

export interface DealPayload {
  /** Bitrix24 deal ID — used as the upsert key */
  sourceId: string;
  title: string;
  value?: number;
  currency?: string;
  /** One of: LEAD | QUALIFIED | PROPOSAL | NEGOTIATION | CLOSED_WON | CLOSED_LOST (legacy) */
  stage?: string;
  description?: string;
  closeDate?: string;
  tags?: string[];
  /** Bitrix24 contact ID — resolved to internal Contact.id */
  contactSourceId?: string;
  /** Bitrix24 pipeline ID — resolved to internal Pipeline.id */
  pipelineSourceId?: string;
  /** Bitrix24 stage ID — resolved to internal Stage.id */
  stageSourceId?: string;
}

export interface MessagePayload {
  /** Bitrix24 message/activity ID — used as the upsert key */
  sourceId: string;
  body: string;
  /** true = message came from the client, false = from an agent */
  fromExternal?: boolean;
  /** Resolve via Deal → contact when message belongs to a deal */
  dealSourceId?: string;
  /** Resolve directly when message belongs to a standalone contact */
  contactSourceId?: string;
  /** ISO 8601 string; preserved as the message's createdAt on insert */
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface LeadPayload {
  sourceId: string;
  title?: string;
  statusId?: string;
  statusSemantic?: string;
  value?: number;
  currency?: string;
  description?: string;
  tags?: string[];
  contactSourceId?: string;
  companySourceId?: string;
  createdAt?: string;
}
