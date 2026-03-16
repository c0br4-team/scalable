export type ActivityType = 'meeting' | 'task' | 'reminder' | 'deadline' | 'event';

export type ActivityStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export type ActivityPriority = 'low' | 'medium' | 'high' | 'critical';

export type HistoryAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'checklist_added'
  | 'checklist_updated'
  | 'checklist_removed'
  | 'attachment_added'
  | 'attachment_removed'
  | 'assignee_added'
  | 'assignee_removed'
  | 'note_updated';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;         // bytes
  type: string;         // MIME type
  url: string;          // object URL (local) o URL real del servidor
  uploadedAt: Date;
}

export interface Assignee {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface HistoryEntry {
  id: string;
  action: HistoryAction;
  description: string;
  performedBy: string;    // nombre del usuario
  performedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  status: ActivityStatus;
  priority: ActivityPriority;
  startDate?: Date | undefined;
  dueDate: Date;
  notes?: string;
  assignees: Assignee[];
  checklist: ChecklistItem[];
  attachments: Attachment[];
  history: HistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityFilters {
  types?: ActivityType[];
  statuses?: ActivityStatus[];
  priorities?: ActivityPriority[];
  assigneeId?: string;
  assigneeEmail?: string;
  dateRange?: { from: Date; to: Date };
  dueDateRange?: { from: Date; to: Date };
  createdDateRange?: { from: Date; to: Date };
  overdue?: boolean;
  upcoming?: boolean;
  searchTitle?: string;
}
