import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  influenceScore?: number | null;
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
  thumbnailUrl?: string | null;
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

export interface MutationSuccessResponse {
  success: boolean;
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

export const useUpdateCreatorProfile = () => {
  return useMutation({
    mutationFn: async (data: { displayName?: string; bio?: string; avatarUrl?: string; location?: string; industry?: string; creatorTypes?: string[] }) => {
      const response = await api.post('/users/me/onboard', data);
      return response.data;
    }
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

export const useAdminCreateUser = () => {
  return useMutation({
    mutationFn: async (data: { name: string; email: string; role: string; password?: string }) => {
      const response = await api.post('/auth/signup', data);
      return response.data;
    }
  });
};

export const useAdminUpdateUser = () => {
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<AdminUserSummary> }) => {
      const response = await api.patch(`/users/${userId}`, data);
      return response.data;
    }
  });
};

export const useAdminUsers = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['users', 'admin', 'all'],
    queryFn: async () => {
      const response = await api.get<AdminUserSummary[]>('/users/admin/all');
      return response.data;
    },
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useAdminStats = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['users', 'admin', 'stats'],
    queryFn: async () => {
      const response = await api.get('/users/admin/stats');
      return response.data;
    },
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useSmeStats = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['users', 'sme', 'stats'],
    queryFn: async () => {
      const response = await api.get('/users/sme/stats');
      return response.data;
    },
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useAdminGrowth = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['users', 'admin', 'growth'],
    queryFn: async () => {
      const response = await api.get('/users/admin/growth');
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

export const useAuditLogs = (limit = 50) => {
  return useQuery({
    queryKey: ['audit-logs', limit],
    queryFn: async () => {
      const response = await api.get(`/auth/admin/audit-logs?limit=${limit}`);
      return response.data;
    }
  });
};

export const useMyAuditLogs = (limit = 20) => {
  return useQuery({
    queryKey: ['my-audit-logs', limit],
    queryFn: async () => {
      const response = await api.get(`/auth/me/audit-logs?limit=${limit}`);
      return response.data;
    }
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

export const useDisconnectYoutubeOauth = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<MutationSuccessResponse>(
        '/auth/socials/google/youtube/disconnect',
      );
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['users'] }),
      ]);
    },
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

export const useSearchCreators = (query: string, limit: number = 20, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['creatorSearch', query, limit],
    queryFn: async () => {
      const response = await api.get<CreatorDiscoveryResponse>('/search/creators', {
        params: { query, limit }
      });
      return response.data;
    },
    enabled: Boolean(enabled && query),
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
    contactEmail?: string;
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
  library: Array<{
    id: number;
    platform: string;
    title: string | null;
    thumbnailUrl: string | null;
    url: string | null;
  }>;
}

export interface ScoutedCreator {
  userId: string;
  displayName: string | null;
  status: string;
  audienceSize: number;
  influenceScore: number | null;
  category: string | null;
}

export interface SmeCampaign {
  id: number;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  budgetAmount: number | null;
  budgetCurrency: string | null;
  startsAt: string | null;
  endsAt: string | null;
  creatorCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSmeCampaignInput {
  name: string;
  description?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  startsAt?: string;
  endsAt?: string;
}

export interface AddCreatorToCampaignInput {
  creatorId: string;
  status?: 'shortlisted' | 'invited' | 'active' | 'removed';
}

export interface CampaignCreatorAssignment {
  campaignId: number;
  creatorId: number;
  displayName: string | null;
  status: string;
  audienceSize: number;
  influenceScore: number | null;
  addedAt: string;
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

export const useScoutCreator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (creatorId: string) => {
      const response = await api.post<MutationSuccessResponse>(
        `/sme/creators/${creatorId}/scout`,
      );
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['scoutedCreators'] }),
        queryClient.invalidateQueries({ queryKey: ['smeCampaigns'] }),
      ]);
    },
  });
};

export const useUnscoutCreator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (creatorId: string) => {
      const response = await api.delete<MutationSuccessResponse>(
        `/sme/creators/${creatorId}/scout`,
      );
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['scoutedCreators'] }),
        queryClient.invalidateQueries({ queryKey: ['smeCampaigns'] }),
      ]);
    },
  });
};

export const useScoutedCreators = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['scoutedCreators'],
    queryFn: async () => {
      const response = await api.get<{ creators: ScoutedCreator[] }>(
        '/sme/creators/scouted',
      );
      return response.data.creators;
    },
    enabled,
    retry: 1,
  });
};

export const useSmeCampaigns = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['smeCampaigns'],
    queryFn: async () => {
      const response = await api.get<SmeCampaign[]>('/sme/campaigns');
      return response.data;
    },
    enabled,
    retry: 1,
  });
};

export const useCreateSmeCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSmeCampaignInput) => {
      const response = await api.post<SmeCampaign>('/sme/campaigns', data);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['smeCampaigns'] });
    },
  });
};

export const useAddCreatorToCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      campaignId,
      data,
    }: {
      campaignId: number;
      data: AddCreatorToCampaignInput;
    }) => {
      const response = await api.post<CampaignCreatorAssignment>(
        `/sme/campaigns/${campaignId}/creators`,
        data,
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['smeCampaigns'] });
    },
  });
};

export interface ContentItem {
  id?: number;
  youtubeVideoId: string;
  platform: string;
  title?: string;
  thumbnailUrl?: string;
  url?: string;
  publishedAt?: string;
}

export const useContentItems = () => {
  return useQuery({
    queryKey: ['contentItems'],
    queryFn: async () => {
      const response = await api.get<{ items: ContentItem[] }>('/creators/insights/content');
      return response.data.items;
    },
  });
};

export const useCreateContentItem = () => {
  return useMutation({
    mutationFn: async (data: Partial<ContentItem>) => {
      const response = await api.post('/creators/insights/content', data);
      return response.data;
    },
  });
};
