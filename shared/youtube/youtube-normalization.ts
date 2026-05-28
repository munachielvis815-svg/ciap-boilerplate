type YoutubeStatisticValue = string | number | null | undefined;

type NormalizableYoutubeChannel = {
  title?: string | null;
  description?: string | null;
  thumbnails?: Record<string, { url?: string }> | null;
  snippet?: {
    title?: string | null;
    description?: string | null;
    thumbnails?: Record<string, { url?: string }> | null;
  };
  statistics?: {
    subscriberCount?: YoutubeStatisticValue;
    viewCount?: YoutubeStatisticValue;
    videoCount?: YoutubeStatisticValue;
  };
  contentDetails?: { relatedPlaylists?: { uploads?: string | null } };
};

type NormalizableYoutubeVideo = {
  id?: string;
  title?: string | null;
  description?: string | null;
  publishedAt?: string | null;
  durationSeconds?: number | null;
  snippet?: {
    title?: string | null;
    description?: string | null;
    publishedAt?: string | null;
  };
  statistics?: {
    viewCount?: YoutubeStatisticValue;
    likeCount?: YoutubeStatisticValue;
    commentCount?: YoutubeStatisticValue;
  };
  contentDetails?: { duration?: string | null };
};

export type NormalizedYoutubeChannel = {
  userId: number;
  youtubeChannelId: string;
  channelTitle: string | null;
  channelDescription: string | null;
  thumbnailUrl: string | null;
  subscriberCount: number;
  videoCount: number;
  totalViewCount: number;
  uploadPlaylistId: string | null;
  isApproved: boolean;
  approvedAt: Date | null;
};

export type NormalizedYoutubeVideo = {
  youtubeVideoId: string;
  videoTitle: string | null;
  videoDescription: string | null;
  durationSeconds: number | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: Date | null;
};

export type NormalizedYoutubeDailyAnalytics = {
  analyticsDate: Date;
  views: number;
  estimatedMinutesWatched: number;
  averageViewDurationSeconds: number;
  subscribersGained: number;
  subscribersLost: number;
};

export class SharedYoutubeNormalizationService {
  normalizeChannel(
    youtubeChannelId: string,
    raw: NormalizableYoutubeChannel | null,
    userId: number,
  ): NormalizedYoutubeChannel | null {
    const title = raw?.snippet?.title ?? raw?.title ?? null;
    if (!raw || !title) {
      return null;
    }

    const stats = raw.statistics || {};

    return {
      userId,
      youtubeChannelId,
      channelTitle: title,
      channelDescription: raw.snippet?.description ?? raw.description ?? null,
      thumbnailUrl: this.getThumbnailUrl(
        raw.snippet?.thumbnails ?? raw.thumbnails,
      ),
      subscriberCount: this.parseNumberishInt(stats.subscriberCount),
      videoCount: this.parseNumberishInt(stats.videoCount),
      totalViewCount: Number(this.parseNumberishBigInt(stats.viewCount)),
      uploadPlaylistId: raw.contentDetails?.relatedPlaylists?.uploads ?? null,
      isApproved: false,
      approvedAt: null,
    };
  }

  normalizeVideos(raw: NormalizableYoutubeVideo[]): NormalizedYoutubeVideo[] {
    return raw
      .filter((video) => video.id && (video.snippet || video.title))
      .map((video) => ({
        youtubeVideoId: video.id!,
        videoTitle: video.snippet?.title ?? video.title ?? null,
        videoDescription:
          video.snippet?.description ?? video.description ?? null,
        durationSeconds: video.contentDetails?.duration
          ? this.parseIso8601Duration(video.contentDetails.duration)
          : (video.durationSeconds ?? null),
        viewCount: this.parseNumberishInt(video.statistics?.viewCount),
        likeCount: this.parseNumberishInt(video.statistics?.likeCount),
        commentCount: this.parseNumberishInt(video.statistics?.commentCount),
        publishedAt:
          (video.snippet?.publishedAt ?? video.publishedAt)
            ? new Date(video.snippet?.publishedAt ?? video.publishedAt!)
            : null,
      }));
  }

  normalizeDailyAnalytics(
    rows: Array<[string, ...number[]]> | undefined,
  ): NormalizedYoutubeDailyAnalytics[] {
    if (!rows?.length) {
      return [];
    }

    return rows.map((row) => ({
      analyticsDate: new Date(row[0]),
      views: typeof row[1] === 'number' ? Math.max(0, row[1]) : 0,
      estimatedMinutesWatched:
        typeof row[2] === 'number' ? Math.max(0, row[2]) : 0,
      averageViewDurationSeconds:
        typeof row[3] === 'number' ? Math.max(0, row[3]) : 0,
      subscribersGained: typeof row[4] === 'number' ? Math.max(0, row[4]) : 0,
      subscribersLost: typeof row[5] === 'number' ? Math.max(0, row[5]) : 0,
    }));
  }

  private parseIso8601Duration(duration: string): number {
    const regex = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/;
    const match = duration.match(regex);
    if (!match) {
      return 0;
    }

    const hours = Number.parseInt(match[1] || '0', 10);
    const minutes = Number.parseInt(match[2] || '0', 10);
    const seconds = Number.parseFloat(match[3] || '0');

    return hours * 3600 + minutes * 60 + Math.round(seconds);
  }

  private parseStringInt(value: string | undefined | null): number {
    if (!value) {
      return 0;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  private parseNumberishInt(value: YoutubeStatisticValue): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
    }

    return this.parseStringInt(value);
  }

  private parseStringBigInt(value: string | undefined | null): bigint {
    if (!value) {
      return 0n;
    }

    try {
      return BigInt(value);
    } catch {
      return 0n;
    }
  }

  private parseNumberishBigInt(value: YoutubeStatisticValue): bigint {
    if (typeof value === 'number') {
      return Number.isFinite(value) && value >= 0
        ? BigInt(Math.floor(value))
        : 0n;
    }

    return this.parseStringBigInt(value);
  }

  private getThumbnailUrl(
    thumbnails: Record<string, { url?: string }> | null | undefined,
  ): string | null {
    if (!thumbnails) {
      return null;
    }

    return (
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      null
    );
  }
}
