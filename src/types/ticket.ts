import {
  Ticket,
  TicketHistory,
  TicketAttachment,
  Sector,
  TicketStatus,
  TicketPriority,
  AttachmentStage,
} from '@prisma/client';

// ==============================================================================
// OMNIFLUX - DEFINIÇÕES DE TIPOS DE TICKETS E WORKFLOWS
// ==============================================================================

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface TicketHistoryEntry extends TicketHistory {
  user: UserSummary;
}

export interface TicketAttachmentEntry extends TicketAttachment {
  uploader: UserSummary;
  downloadUrl?: string;
}

export interface TicketDetail extends Ticket {
  sector: Sector;
  requester: UserSummary;
  executor: UserSummary | null;
  history: TicketHistoryEntry[];
  attachments: TicketAttachmentEntry[];
}

export interface TicketListItem {
  id: string;
  ticketNumber: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  amount: string | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  sector: {
    id: string;
    name: string;
    slug: string;
    isFinancial: boolean;
  };
  requester: UserSummary;
  executor: UserSummary | null;
  attachmentsCount: number;
}

export interface TicketFilters {
  status?: TicketStatus;
  sectorId?: string;
  priority?: TicketPriority;
  onlyMyTickets?: boolean;
  onlyAssignedToMe?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedTickets {
  items: TicketListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type TicketTransitionAction =
  | 'ASSUME'
  | 'CONCLUDE_EXECUTION'
  | 'APPROVE_HOMOLOGATION'
  | 'REJECT_HOMOLOGATION'
  | 'RESUME_REWORK';

export interface TransitionTicketInput {
  ticketId: string;
  targetStatus: TicketStatus;
  reason?: string;
  comment?: string;
  proofAttachment?: {
    fileKey: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    stage: AttachmentStage;
  };
}
