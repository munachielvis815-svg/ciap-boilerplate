import type {
  WorkerJobName,
  WorkerQueueName,
} from '@shared/queue/queue.constants';

export type WorkerJobStatus =
  | 'pending'
  | 'queued'
  | 'active'
  | 'retrying'
  | 'completed'
  | 'failed';

export type WorkerJobRecordInput = {
  queueName: WorkerQueueName;
  jobName: WorkerJobName;
  requestId: string;
  userId?: number | null;
  tenantId?: number | null;
  parentJobId?: string | null;
  payload?: Record<string, unknown> | null;
  scheduledFor?: Date | null;
  maxAttempts?: number;
};
