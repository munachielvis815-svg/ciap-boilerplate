export const YOUTUBE_METRICS_QUEUE = 'youtube-metrics';
export const YOUTUBE_METRICS_PULL_JOB = 'youtube-metrics.pull';

export type YoutubeMetricsPullJobPayload = {
  provider: 'google';
  userId: number;
  tenantId: number;
  days: number;
  maxVideos: number;
  requestedAt: string;
};

export function buildYoutubeMetricsPullJobPayload(input: {
  userId: number;
  tenantId: number;
  days: number;
  maxVideos: number;
}): YoutubeMetricsPullJobPayload {
  return {
    provider: 'google',
    userId: input.userId,
    tenantId: input.tenantId,
    days: input.days,
    maxVideos: input.maxVideos,
    requestedAt: new Date().toISOString(),
  };
}
