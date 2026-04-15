export interface Creator {
  id: string;
  name: string;
  handle: string;
  category: string;
  avatar: string;
  influenceScore: number;
  platforms: {
    type: 'YOUTUBE' | 'INSTAGRAM' | 'TIKTOK' | 'TWITTER' | 'SPOTIFY';
    followers: number;
    growth: number;
  }[];
  metrics: {
    date: string;
    views: number;
    engagement: number;
    reach: number;
  }[];
}

export const MOCK_CREATORS: Creator[] = [
  {
    id: '1',
    name: 'Tunde Snyder',
    handle: '@tundesnyder',
    category: 'Comedy',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tunde',
    influenceScore: 92.4,
    platforms: [
      { type: 'YOUTUBE', followers: 1200000, growth: 12.5 },
      { type: 'INSTAGRAM', followers: 850000, growth: 5.2 },
      { type: 'TIKTOK', followers: 2400000, growth: 22.1 },
    ],
    metrics: Array.from({ length: 6 }).map((_, i) => ({
      date: new Date(2026, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      views: 500000 + Math.random() * 200000,
      engagement: 4.5 + Math.random() * 2,
      reach: 1000000 + Math.random() * 500000,
    })),
  },
  {
    id: '2',
    name: 'Ada Fashionista',
    handle: '@ada_styles',
    category: 'Fashion',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ada',
    influenceScore: 88.1,
    platforms: [
      { type: 'INSTAGRAM', followers: 1500000, growth: 8.4 },
      { type: 'TIKTOK', followers: 900000, growth: 15.3 },
    ],
    metrics: Array.from({ length: 6 }).map((_, i) => ({
      date: new Date(2026, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      views: 300000 + Math.random() * 100000,
      engagement: 6.2 + Math.random() * 3,
      reach: 800000 + Math.random() * 300000,
    })),
  },
  {
    id: '3',
    name: 'Tech Bro Chi',
    handle: '@chi_codes',
    category: 'Tech',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chi',
    influenceScore: 75.5,
    platforms: [
      { type: 'TWITTER', followers: 45000, growth: 2.1 },
      { type: 'YOUTUBE', followers: 15000, growth: 10.5 },
    ],
    metrics: Array.from({ length: 6 }).map((_, i) => ({
      date: new Date(2026, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      views: 10000 + Math.random() * 5000,
      engagement: 8.5 + Math.random() * 4,
      reach: 50000 + Math.random() * 20000,
    })),
  },
];

export const MOCK_STATS = {
  totalViews: '12.4M',
  avgEngagement: '5.8%',
  totalReach: '8.2M',
  growthRate: '+14.2%',
};
