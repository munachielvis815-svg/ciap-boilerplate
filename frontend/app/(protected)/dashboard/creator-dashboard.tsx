'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Lightning, Users, ShoppingCart, ArrowsClockwise, PlayCircle, InstagramLogo, TiktokLogo, CaretRight } from '@phosphor-icons/react';
import { useAudienceInsights, usePerformanceInsights, useMeProfile, useYoutubeMetrics } from '@/lib/api/hooks';
import { getYoutubeErrorToastMessage } from '@/lib/api/errors';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

const getPlatformIcon = (platform?: string) => {
  const p = platform?.toLowerCase();
  if (p === 'youtube') return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000"/>
      <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF"/>
    </svg>
  );
  if (p === 'instagram') return <InstagramLogo size={20} className="text-[#E4405F]" weight="fill" />;
  if (p === 'tiktok') return <TiktokLogo size={20} className="text-black" weight="fill" />;
  return <PlayCircle size={20} className="text-[#FF0000]" weight="fill" />;
};

const getStatusBadge = (status?: string) => {
  const s = status?.toUpperCase();
  if (s === 'VIRAL') return <span className="px-3 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">VIRAL</span>;
  if (s === 'TRENDING') return <span className="px-3 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">TRENDING</span>;
  return <span className="px-3 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">STABLE</span>;
};

export default function CreatorDashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: profile } = useMeProfile();
  const { data: audience, isLoading: loadingAudience, refetch: refetchAudience } = useAudienceInsights(30);
  const { data: perf, isLoading: loadingPerf, refetch: refetchPerf } = usePerformanceInsights(30);
  const { refetch: syncYoutube, isFetching: isSyncing } = useYoutubeMetrics(false);

  const isLoading = loadingAudience || loadingPerf || isSyncing;

  const handleSync = async () => {
    try {
      // 1. Trigger backend sync from YouTube (ingestion)
      await syncYoutube();
      // 2. Refresh the local insights data (which will now fetch fresh data from DB since cache was invalidated)
      await Promise.all([refetchAudience(), refetchPerf()]);
    } catch (error) {
      console.error('Failed to sync data:', error);
      toast.error(getYoutubeErrorToastMessage(error));
    }
  };

  if (!mounted) return <div className="h-screen bg-[#F8F9FF]" />;

  const isConnected = profile?.platformStatus?.youtube?.connected ||
    profile?.platformStatus?.tiktok?.connected ||
    profile?.platformStatus?.instagram?.connected;

  // KPI Data
  const totalViews = audience?.audience?.views || 0;
  const engagementRate = perf?.engagementRate || 0;
  const followerGrowth = perf?.weeklyGrowth?.followerGrowth || 0;
  const conversions = (perf as any)?.conversions || 0;

  // Chart Data Preparation
  let finalTimeSeries = perf?.timeSeries || [];
  


  const chartData = finalTimeSeries.map((d: any, i) => {
    const weekNum = Math.floor(i / 7) + 1;
    return {
      name: `WK 0${weekNum}`,
      date: d.date,
      views: Number(d.views || 0),
      engagement: Number(d.engagement || d.estimatedMinutesWatched || 0),
    };
  });

  // Filter XAxis ticks to only show one per week to match Figma
  const xAxisTicks = chartData.filter((_, i) => i % 7 === 0).map(d => d.name);

  // Top Content
  const topContent = perf?.topContent || (perf as any)?.recentContent || [];

  return (
    <div className="w-full max-w-[1176px] mx-auto space-y-6 lg:space-y-8 pb-10 px-4 lg:px-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
            Creator Dashboard
          </h1>
          <p className="text-[#3C4A3D] mt-1 text-[13px] font-medium opacity-80">Track your platform metrics and content performance.</p>
        </div>
        <button
          onClick={handleSync}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[#006D32] text-white rounded-xl font-semibold text-[10px] hover:bg-[#005227] transition shadow-sm disabled:opacity-50"
        >
          <ArrowsClockwise size={14} className={isLoading ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Sync Data'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {[
          { 
            label: 'Total Views', 
            value: fmt(totalViews), 
            trend: 'Total', 
            icon: Eye, 
            bg: '#EFF4FF', 
            iconColor: '#006D32',
            iconBg: 'rgba(0, 109, 50, 0.1)',
            trendColor: '#006D32',
            trendBg: 'rgba(0, 109, 50, 0.1)'
          },
          { 
            label: 'Engagement Rate', 
            value: `${engagementRate.toFixed(1)}%`, 
            trend: 'Score', 
            icon: Lightning, 
            bg: '#E5EEFF', 
            iconColor: '#0059BB',
            iconBg: 'rgba(0, 89, 187, 0.1)',
            trendColor: '#0059BB',
            trendBg: 'rgba(0, 89, 187, 0.1)'
          },
          { 
            label: 'Follower Growth', 
            value: fmt(followerGrowth), 
            trend: 'Growth', 
            icon: Users, 
            bg: '#EFF4FF', 
            iconColor: '#006D32',
            iconBg: 'rgba(0, 109, 50, 0.1)',
            trendColor: '#006D32',
            trendBg: 'rgba(0, 109, 50, 0.1)'
          },
          { 
            label: 'Conversions', 
            value: fmt(conversions), 
            trend: 'Sales', 
            icon: ShoppingCart, 
            bg: '#D3E4FE', 
            iconColor: '#0B1C30',
            iconBg: 'rgba(11, 28, 48, 0.05)',
            trendColor: '#0B1C30',
            trendBg: 'rgba(11, 28, 48, 0.05)'
          },
        ].map((k, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-[12px] p-4 lg:p-6 flex flex-col justify-between h-[140px] lg:h-[164px]"
            style={{ background: k.bg }}
          >
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-[8px]" style={{ background: k.iconBg }}>
                <k.icon size={22} style={{ color: k.iconColor }} />
              </div>
              <div className="px-2 py-0.5 rounded-full text-[12px] font-bold" style={{ background: k.trendBg, color: k.trendColor, fontFamily: "'Inter'" }}>
                {k.trend}
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-[12px] font-medium text-[#3C4A3D]" style={{ fontFamily: "'Inter'" }}>{k.label}</p>
              <h3 className="text-xl lg:text-2xl leading-tight font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
                {isLoading ? '...' : k.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#F1F5F9]">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>Performance Over Time</h2>
            <p className="text-[#3C4A3D] text-[10px] mt-1">Visualizing cross-platform engagement pulse.</p>
          </div>
          <div className="flex gap-6 text-[10px] font-bold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#00D166] rounded-full" />
              <span className="text-[#0B1C30] tracking-wider">VIDEO VIEWS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#0059BB] rounded-full" />
              <span className="text-[#0B1C30] tracking-wider">DIRECT ENGAGEMENT</span>
            </div>
          </div>
        </div>

        <div className="h-[220px] lg:h-[320px] w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center bg-[#F8F9FF] rounded-2xl">
              <ArrowsClockwise size={32} className="text-[#006D32] animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D166" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#00D166" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                ticks={xAxisTicks}
                tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                tickFormatter={fmt}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }}
              />
              <Area 
                type="natural" 
                dataKey="views" 
                stroke="#00D166" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorViews)" 
                animationDuration={1500}
              />
              <Area 
                type="natural" 
                dataKey="engagement" 
                stroke="#0059BB" 
                strokeWidth={3} 
                strokeDasharray="6 4" 
                fill="none" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Content - Figma Specs Implementation */}
      <div className="bg-[#EFF4FF] rounded-[12px] p-8 space-y-6 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center h-6">
          <h2 className="text-[18px] font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>Top Performing Content</h2>
           <div className="lg:hidden flex items-center gap-1 text-[10px] font-bold text-[#6B7280]">
             SWIPE <CaretRight size={12} />
           </div>
        </div>

        <div className="w-full overflow-x-auto scrollbar-hide -mx-5 px-5 lg:mx-0 lg:px-0">
          <table className="w-full min-w-[600px] lg:min-w-0 table-fixed border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left">
                <th className="pb-3 font-bold text-[10px] tracking-[1px] uppercase text-[#3C4A3D] w-[45%] lg:w-[45%] pl-2" style={{ fontFamily: "'Inter'" }}>CONTENT ASSET</th>
                <th className="pb-3 font-bold text-[10px] tracking-[1px] uppercase text-[#3C4A3D] w-[25%] lg:w-[18%]" style={{ fontFamily: "'Inter'" }}>PLATFORM</th>
                <th className="pb-3 font-bold text-[10px] tracking-[1px] uppercase text-[#3C4A3D] w-[15%] lg:w-[10%] lg:table-cell hidden" style={{ fontFamily: "'Inter'" }}>VIEWS</th>
                <th className="pb-3 font-bold text-[10px] tracking-[1px] uppercase text-[#3C4A3D] w-[15%] lg:w-[15%] lg:table-cell hidden" style={{ fontFamily: "'Inter'" }}>ENGAGEMENT</th>
                <th className="pb-3 font-bold text-[10px] tracking-[1px] uppercase text-[#3C4A3D] w-[15%] lg:w-[12%] text-center" style={{ fontFamily: "'Inter'" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="py-12 text-center text-[#94A3B8] text-[11px]">Syncing library...</td></tr>
              ) : topContent.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-[#94A3B8] text-[11px]">No content pulse detected yet.</td></tr>
              ) : (
                topContent.map((item: any, i: number) => {
                  const score = item.score?.engagementScore;
                  const likes = item.likeCount || 0;
                  const views = item.viewCount || item.views || 0;
                  const comments = item.commentCount || 0;
                  
                  // Real engagement calculation: (Likes + Comments) / Views
                  const calculatedRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
                  const finalEngagement = score !== undefined ? score : calculatedRate;
                  
                  const status = item.status || (finalEngagement > 10 ? 'VIRAL' : finalEngagement > 5 ? 'TRENDING' : 'STABLE');
                  const videoUrl = item.youtubeVideoId ? `https://www.youtube.com/watch?v=${item.youtubeVideoId}` : '#';
                  
                  return (
                    <tr key={i} className="h-[76px] hover:bg-white/60 transition-colors group">
                      <td className="py-0 pl-2 rounded-l-xl bg-white/20">
                        <a 
                          href={videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <div className="w-14 h-9 bg-[#D3E4FE] rounded-lg overflow-hidden flex-shrink-0">
                            {item.youtubeVideoId ? (
                              <img
                                src={`https://img.youtube.com/vi/${item.youtubeVideoId}/mqdefault.jpg`}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = `https://placehold.co/64x40/D3E4FE/6B7280?text=...`;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full" />
                            )}
                          </div>
                          <p className="font-medium text-[12px] text-[#0B1C30] truncate pr-4" style={{ fontFamily: "'Inter'" }}>
                            {item.title}
                          </p>
                        </a>
                      </td>
                      <td className="py-0 bg-white/20">
                        <div className="flex items-center gap-2 text-[12px] font-normal text-[#0B1C30]" style={{ fontFamily: "'Inter'" }}>
                          {getPlatformIcon(item.platform)}
                          <span className="capitalize">{item.platform || 'YouTube'}</span>
                        </div>
                      </td>
                      <td className="py-0 bg-white/20 text-left lg:table-cell hidden">
                        <span className="font-bold text-[12px] text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
                          {fmt(views)}
                        </span>
                      </td>
                      <td className="py-0 bg-white/20 text-left lg:table-cell hidden">
                        <span className="font-bold text-[12px] text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
                          {finalEngagement > 0 ? `${finalEngagement.toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      <td className="py-0 rounded-r-xl bg-white/20 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          status === 'VIRAL' ? 'bg-emerald-100 text-[#006D32]' : 
                          status === 'TRENDING' ? 'bg-amber-100 text-[#B45309]' : 
                          'bg-blue-100 text-[#0059BB]'
                        }`} style={{ fontFamily: "'Inter'" }}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}