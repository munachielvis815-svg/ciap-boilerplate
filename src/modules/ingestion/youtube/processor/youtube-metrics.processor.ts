import { Logger } from '@nestjs/common';
import { Job as BullJob } from 'bullmq';
import { YoutubeMetricsJobPayload } from '@modules/queue/queue.service';
import { YoutubeMetricsRepository } from '../repository/youtube-metrics.repository';
import { YoutubeRepository } from '../repository/youtube.repository';
import { YoutubeVideo } from '@database/drizzle/schema';

/**
 * YouTube Metrics Job Processor
 * Processes enqueued YouTube metrics jobs: scores videos, computes recommendations, stores results.
 * Designed to work with BullMQ worker registration in YoutubeIngestionModule.
 */
export class YoutubeMetricsProcessor {
  private readonly logger = new Logger(YoutubeMetricsProcessor.name);

  constructor(
    private readonly youtubeRepository: YoutubeRepository,
    private readonly metricsRepository: YoutubeMetricsRepository,
  ) {}

  /**
   * Main job handler.
   * BullMQ calls this when a job is ready to process.
   * Should throw or return, not resolve with error.
   */
  async process(job: BullJob<YoutubeMetricsJobPayload, void>): Promise<void> {
    const { userId, channelId, maxVideos } = job.data;

    try {
      this.logger.log(
        `[Job ${job.id}] Processing YouTube metrics for user ${userId}, channel ${channelId || 'any'}`,
      );

      // 1. Fetch channel and recent videos from DB (assume they exist from ingestion)
      const channel = channelId
        ? await this.youtubeRepository.getChannelByYoutubeId(channelId)
        : await this.youtubeRepository.getLatestChannelForUser(userId);

      if (!channel) {
        const reason = channelId
          ? `Channel ${channelId} not found`
          : `No YouTube channel found for user ${userId}`;
        throw new Error(reason);
      }

      // 2. Fetch recent videos for this channel
      const videos = await this.youtubeRepository.getRecentVideos(
        channel.id,
        maxVideos,
      );

      if (!videos.length) {
        this.logger.log(
          `[Job ${job.id}] No videos to score for channel ${channel.youtubeChannelId}`,
        );
        return;
      }

      this.logger.log(
        `[Job ${job.id}] Fetched ${videos.length} videos for scoring`,
      );

      // 3. Run ML scoring pipeline on each video
      // Placeholder: In production, this would call an external ML service or embedded model
      const avgViews =
        videos.reduce((sum, v) => sum + (v.viewCount || 0), 0) /
        (videos.length || 1);
      const scores = videos.map((video: YoutubeVideo, index) => {
        const engagementScore = this.computeEngagementScore(video);
        const growthScore = this.computeGrowthScore(video, avgViews);
        const recommendationScore = this.computeRecommendationScore(
          engagementScore,
          growthScore,
        );

        return {
          videoId: video.id,
          engagementScore,
          growthScore,
          recommendationScore,
          performanceRank: index + 1, // Rank by recommendation score
          jobId: job.id,
        };
      });

      // 4. Store ML scores to database
      await this.metricsRepository.upsertMlScores(scores);

      this.logger.log(
        `[Job ${job.id}] Completed ML scoring: ${scores.length} videos scored and stored`,
      );
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Processing failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Re-throw to trigger BullMQ retry/DLQ logic
      throw error;
    }
  }

  /**
   * Compute engagement score based on video metrics.
   * Score: 0-100, higher = more engaged audience.
   * Formula: (likeCount / viewCount) * 50 + (commentCount / viewCount) * 50, capped at 100.
   */
  private computeEngagementScore(video: YoutubeVideo): number {
    const views = video.viewCount || 1;
    const likes = video.likeCount || 0;
    const comments = video.commentCount || 0;

    const likeEngage = (likes / views) * 50;
    const commentEngage = (comments / views) * 50;

    return Math.min(likeEngage + commentEngage, 100);
  }

  /**
   * Compute growth score based on relative engagement compared to channel average.
   * Score: 0-100, higher = video performs better than average.
   * Accepts a pre-computed avgViews to avoid O(n²) recalculation per video.
   */
  private computeGrowthScore(video: YoutubeVideo, avgViews: number): number {
    if (avgViews === 0) return 50;

    const videoViews = video.viewCount || 0;

    // Ratio: 2x avg = 100, 0.5x avg = 0
    const ratio = videoViews / avgViews;
    return Math.min(Math.max(ratio * 50, 0), 100);
  }

  /**
   * Compute composite recommendation score.
   * Weighted combination: 60% engagement, 40% growth.
   */
  private computeRecommendationScore(
    engagementScore: number,
    growthScore: number,
  ): number {
    return engagementScore * 0.6 + growthScore * 0.4;
  }
}
