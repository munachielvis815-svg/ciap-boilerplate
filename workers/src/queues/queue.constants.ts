export const YOUTUBE_SYNC_BATCH_QUEUE = 'youtube-sync-batch-queue';
export const YOUTUBE_SYNC_QUEUE = 'youtube-sync-queue';
export const ML_INFERENCING_QUEUE = 'ml-inferencing-queue';

export const YOUTUBE_SYNC_BATCH_JOB = 'youtube.sync.batch.scan';
export const YOUTUBE_SYNC_JOB = 'youtube.sync.user';
export const ML_INFERENCING_JOB = 'ml.inferencing.run';

export type YoutubeSyncBatchJobPayload = {
  requestId: string;
  reason: 'scheduler' | 'manual';
  scheduledAt: string;
};

export type YoutubeSyncJobPayload = {
  requestId: string;
  userId: number;
  tenantId: number;
  reason: 'scheduler' | 'manual' | 'batch';
  scheduledAt: string;
};

export type MlInferencingJobPayload = {
  requestId: string;
  scheduledAt: string;
  reason: 'scheduler';
  placeholder: true;
};
