export interface MigrationBatch<T> {
  orgId: string;
  data: T[];
}

export interface CompanyPayload {
  sourceId: string;
  name: string;
  industry?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  inn?: string;
  customFields?: Record<string, unknown>;
  isDeleted?: boolean;
  syncedFromBitrixAt?: string;
}

export interface ContactPayload {
  sourceId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  fullName?: string;
  position?: string;
  notes?: string;
  tags?: string[];
  companySourceId?: string;
  primaryIM?: string;
  customFields?: Record<string, unknown>;
  isDeleted?: boolean;
  createdAt?: string;
  syncedFromBitrixAt?: string;
}

export interface PipelinePayload {
  sourceId: string;
  name: string;
  sortOrder?: number;
  entityType?: string;
}

export interface StagePayload {
  sourceId: string;
  name: string;
  color?: string;
  sortOrder?: number;
  isFinal?: boolean;
  isWon?: boolean;
  semantics?: string;
  pipelineSourceId: string;
}

export interface DealPayload {
  sourceId: string;
  title: string;
  value?: number;
  currency?: string;
  stage?: string;
  description?: string;
  closeDate?: string;
  tags?: string[];
  contactSourceId?: string;
  companySourceId?: string;
  pipelineSourceId?: string;
  stageSourceId?: string;

  rawPayload?: Record<string, unknown>;
  currencyId?: string;
  assignedByExternalId?: string;
  createdById?: string;
  modifyById?: string;
  stageSemanticId?: string;
  sourceDescription?: string;
  beginDate?: string;
  movedTime?: string;
  lastActivityTime?: string;
  lastActivityBy?: string;
  dateCreate?: string;
  dateModify?: string;
  isDeleted?: boolean;
  syncedFromBitrixAt?: string;
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
  rawPayload?: Record<string, unknown>;
  assignedByExternalId?: string;
  createdById?: string;
  modifyById?: string;
  sourceDescription?: string;
  dateCreate?: string;
  dateModify?: string;
  isDeleted?: boolean;
  createdAt?: string;
  syncedFromBitrixAt?: string;
}

export interface DealContactPayload {
  dealSourceId: string;
  contactSourceId: string;
  isPrimary?: boolean;
  isDeleted?: boolean;
}

export interface ActivityPayload {
  sourceId: string;
  type: string;
  title: string;
  body?: string;
  dealSourceId?: string;
  contactSourceId?: string;
  direction?: string;
  duration?: number;
  recordingUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface CommentPayload {
  sourceId: string;
  body: string;
  dealSourceId?: string;
  contactSourceId?: string;
  createdAt?: string;
}

export interface ChannelPayload {
  sourceId?: string;
  contactSourceId?: string;
  companySourceId?: string;
  type: "PHONE" | "EMAIL" | "IM";
  value: string;
  isPrimary?: boolean;
  messengerType?: string;
  isDeleted?: boolean;
}

export interface MessagePayload {
  sourceId: string;
  body: string;
  fromExternal?: boolean;
  dealSourceId?: string;
  contactSourceId?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}
