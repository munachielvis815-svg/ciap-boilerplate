import { useQuery } from '@tanstack/react-query';
import api from './client';

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime?: number;
  environment?: string;
  version?: string;
  message?: string;
  ready?: boolean;
  database?: string;
  cache?: string;
  error?: string | null;
}

export interface AuthVerifyResponse {
  valid: boolean;
  userId: string;
  email: string;
  tenantId?: string;
  role?: string;
  sessionId?: string;
}

export interface CreatorDashboardData {
  audience: {
    channel?: {
      youtubeChannelId?: string;
      channelTitle?: string;
      subscriberCount: number;
      totalViewCount: number;
      videoCount: number;
    } | null;
    audience: {
      views: number;
      estimatedMinutesWatched: number;
      averageViewDurationSeconds: number;
      subscribersGained: number;
      subscribersLost: number;
    };
    influenceScore: number | null;
    windowDays: number;
    syncedAt: string | null;
  };
  performance: {
    windowDays: number;
    weeklyGrowth: { followerGrowth: number; views: number };
    monthlyGrowth: { followerGrowth: number; views: number };
    platforms: Array<{ platform: string; engagementRate: number; followerGrowth: number }>;
    engagementRate: number;
    topContent: Array<{ title: string; viewCount: number; engagementRate: number }>;
    timeSeries: Array<{ date: string; views: number; subscribersGained: number }>;
  };
}

export interface SmeDashboardData {
  creatorStats: {
    totalCreators: number;
  };
  searchDefaults: {
    platformOptions: string[];
    minInfluenceScore: number;
    maxInfluenceScore: number;
  };
}

export interface MeProfileResponse {
  role: string;
  profile: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    tenantId: string;
    isEmailVerified: boolean;
    role: string;
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    audienceSize: number;
    influenceScore?: number | null;
    isOnboarded: boolean;
    creatorTypes: string[];
    createdAt: string;
    updatedAt: string;
  };
  platformStatus: {
    youtube: { connected: boolean; connectedAt?: string | null };
    tiktok: { connected: boolean; connectedAt?: string | null };
    instagram: { connected: boolean; connectedAt?: string | null };
  };
  creator?: CreatorDashboardData | null;
  sme?: SmeDashboardData | null;
}

export interface UserPlatformStatusResponse {
  youtube: { connected: boolean; connectedAt?: string | null };
  tiktok: { connected: boolean; connectedAt?: string | null };
  instagram: { connected: boolean; connectedAt?: string | null };
}

export interface AdminUserSummary {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  tenantId: string;
  isEmailVerified: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersResponse {
  users: AdminUserSummary[];
}

// DTO Interfaces
export interface ChannelData {
  youtubeChannelId: string;
  channelTitle: string;
  subscriberCount: number;
  totalViewCount: number;
  videoCount: number;
}

export interface AudienceData {
  views: number;
  estimatedMinutesWatched: number;
  averageViewDurationSeconds: number;
  subscribersGained: number;
  subscribersLost: number;
}

export interface InsightVideo {
  youtubeVideoId: string;
  title: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  score: {
    engagementScore: number;
    growthScore: number;
  };
}

export interface AudienceInsightResponse {
  channel: ChannelData;
  audience: AudienceData;
  influenceScore: number;
  windowDays: number;
  syncedAt: string;
}

export interface YoutubeMetricsResponse {
  channel: ChannelData;
  videosCount: number;
  analyticsCount: number;
  syncedAt: string;
  cacheStatus: string;
}

export interface OauthPrepareResponse {
  provider: string;
  redirectUri: string;
  authorizationUrl: string;
}

// ------------------------------------
// Creator Insights Hooks
// ------------------------------------

export const useApiHealth = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['health', 'api'],
    queryFn: async () => {
      const response = await api.get<HealthResponse>('/health');
      return response.data;
    },
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useDatabaseHealth = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['health', 'db'],
    queryFn: async () => {
      const response = await api.get<HealthResponse>('/health/db');
      return response.data;
    },
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useCacheHealth = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['health', 'cache'],
    queryFn: async () => {
      const response = await api.get<HealthResponse>('/health/cache');
      return response.data;
    },
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useReadinessHealth = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['health', 'ready'],
    queryFn: async () => {
      const response = await api.get<HealthResponse>('/health/ready');
      return response.data;
    },
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useVerifySession = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['auth', 'verify'],
    queryFn: async () => {
      const response = await api.get<AuthVerifyResponse>('/auth/verify');
      return response.data;
    },
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useMeProfile = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const response = await api.get<MeProfileResponse>('/users/me');
      return response.data;
    },
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useUserPlatformStatus = (userId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['users', userId, 'platform-status'],
    queryFn: async () => {
      const response = await api.get<UserPlatformStatusResponse>(`/users/${userId}/platform-status`);
      return response.data;
    },
    enabled: Boolean(enabled && userId),
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useAdminUsers = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['users', 'admin', 'all'],
    queryFn: async () => {
      const response = await api.get<AdminUsersResponse>('/users/admin/all');
      return response.data;
    },
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useRoles = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['auth', 'roles'],
    queryFn: async () => {
      const response = await api.get<string[] | { roles: string[] }>('/auth/roles');
      return response.data;
    },
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useAudienceInsights = (days: number = 30, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['audienceInsights', days],
    queryFn: async () => {
      const response = await api.get<AudienceInsightResponse>('/creators/insights/audience', {
        params: { days }
      });
      return response.data;
    },
    enabled,
    // Don't refetch on window focus automatically to avoid slamming the synced cache
    refetchOnWindowFocus: false, 
    retry: 1, 
  });
};

export const useContentInsights = (limit: number = 10, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['contentInsights', limit],
    queryFn: async () => {
      const response = await api.get<{
        youtubeChannelId: string;
        items: InsightVideo[];
      }>('/creators/insights/content', {
        params: { limit }
      });
      return response.data;
    },
    enabled,
    retry: 1,
  });
};

// ------------------------------------
// Ingestion Hooks
// ------------------------------------

export const useYoutubeMetrics = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['youtubeMetrics'],
    queryFn: async () => {
      const response = await api.get<YoutubeMetricsResponse>('/ingestion/youtube/metrics');
      return response.data;
    },
    enabled,
    retry: false, // If it 404s, it means they aren't connected
  });
};

export const usePrepareYoutubeOauth = (enabled: boolean = false) => {
  return useQuery({
    queryKey: ['youtubeOauth'],
    queryFn: async () => {
      const response = await api.get<OauthPrepareResponse>('/ingestion/youtube/oauth2');
      return response.data;
    },
    enabled, // Only fetch on explicit user interaction or role-gated screens
  });
};

// ------------------------------------
// Performance & Discovery Hooks
// ------------------------------------

export interface PerformanceInsight {
  windowDays: number;
  weeklyGrowth: {
    windowDays: number;
    followerGrowth: number;
    views: number;
    estimatedMinutesWatched: number;
  };
  monthlyGrowth: {
    windowDays: number;
    followerGrowth: number;
    views: number;
    estimatedMinutesWatched: number;
  };
  platforms: Array<{
    platform: string;
    followerGrowth?: number;
    views?: number;
    engagementRate?: number;
  }>;
  engagementRate: number;
  topContent: Array<{
    title: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
  }>;
  timeSeries: Array<{
    date: string;
    views: number;
    subscribersGained: number;
    subscribersLost: number;
    estimatedMinutesWatched: number;
  }>;
  summary?: string;
}

export const usePerformanceInsights = (days: number = 30, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['performanceInsights', days],
    queryFn: async () => {
      const response = await api.get<PerformanceInsight>('/creators/insights/performance', {
        params: { days }
      });
      return response.data;
    },
    enabled,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export interface CreatorDiscoveryItem {
  userId: string;
  displayName: string;
  bio?: string;
  category?: string;
  influenceScore?: number;
  audienceSize: number;
}

export interface CreatorDiscoveryResponse {
  creators: CreatorDiscoveryItem[];
  limit: number;
  offset: number;
}

export type CreatorDiscoveryFilters = Record<string, string | number | boolean | string[] | undefined>;

export const useDiscoverCreators = (limit: number = 20, offset: number = 0, filters?: CreatorDiscoveryFilters, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['creatorDiscovery', limit, offset, filters],
    queryFn: async () => {
      const response = await api.get<CreatorDiscoveryResponse>('/sme/creators/discovery', {
        params: { limit, offset, ...filters }
      });
      return response.data;
    },
    enabled,
    retry: 1,
  });
};

export interface CreatorCompareItem {
  userId: string;
  displayName: string;
  influenceScore?: number;
  audienceSize: number;
}

export interface CreatorCompareResponse {
  creators: CreatorCompareItem[];
  mode: string;
}

export const useCompareCreators = (creatorIds?: string[], searchQuery?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['creatorCompare', creatorIds, searchQuery],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (creatorIds?.length) params.creatorIds = creatorIds.join(',');
      if (searchQuery) params.query = searchQuery;
      
      const response = await api.get<CreatorCompareResponse>('/sme/creators/compare', {
        params
      });
      return response.data;
    },
    enabled: Boolean(enabled && (creatorIds?.length || searchQuery)),
    retry: 1,
  });
};

export interface CreatorProfile {
  profile: {
    userId: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    audienceSize: number;
    influenceScore?: number;
  };
  channel?: {
    youtubeChannelId: string;
    channelTitle: string;
  };
  audienceDemographics?: {
    ageGroups: string[];
    genderSplit?: Record<string, number>;
    topLocations: string[];
  };
  sentiment?: {
    overallScore?: number;
    topKeywords: string[];
    summary?: string;
  };
}

export const useCreatorProfile = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['creatorProfile', userId],
    queryFn: async () => {
      const response = await api.get<CreatorProfile>(`/sme/creators/${userId}/profile`);
      return response.data;
    },
    enabled: Boolean(enabled && userId),
    retry: 1,
  });
};
