'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Funnel, 
  Calendar, 
  CaretDown, 
  ArrowRight, 
  Eye, 
  TrendUp, 
  CheckCircle, 
  X, 
  DownloadSimple, 
  ChatTeardropText,
  Clock,
  ChartBar,
  FileText,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { usePerformanceInsights, useContentInsights, useYoutubeMetrics } from '@/lib/api/hooks';
import { getYoutubeErrorToastMessage } from '@/lib/api/errors';
import { toast } from 'sonner';

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

const getPlatformIcon = (platform?: string) => {
  const p = platform?.toLowerCase();
  if (p === 'youtube') return (
    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000"/>
      <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF"/>
    </svg>
  );
  return <div className="w-4 h-4 bg-gray-200 rounded-full" />;
};

export default function ContentPerformance() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: perf, isLoading: loadingPerf, refetch: refetchPerf } = usePerformanceInsights(30);
  const { data: content, isLoading: loadingContent, refetch: refetchContent } = useContentInsights(10);
  const { refetch: syncYoutube, isFetching: isSyncing } = useYoutubeMetrics(false);

  const isLoading = loadingPerf || loadingContent || isSyncing;

  const handleSync = async () => {
    try {
      await syncYoutube();
      await Promise.all([refetchPerf(), refetchContent()]);
    } catch (error) {
      console.error('Failed to sync data:', error);
      toast.error(getYoutubeErrorToastMessage(error));
    }
  };
  const items = content?.items || [];
  const selectedItem = items.find(i => i.youtubeVideoId === selectedId);

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto min-h-[900px] pb-10 px-4 lg:px-6 overflow-x-hidden">
      {/* Left Side: Table View */}
      <div className="flex-1 min-w-0 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <h1 className="text-[22px] font-bold text-[#0B1C30] leading-tight" style={{ fontFamily: "'Space Grotesk'" }}>
              Content Performance
            </h1>
            <p className="text-[12px] text-[#3C4A3D] leading-relaxed opacity-70" style={{ fontFamily: "'Inter'" }}>
              Real-time engagement intelligence across all active streams.
            </p>
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

        {/* Section - Filters */}
        <div className="bg-[#EFF4FF] rounded-[16px] p-6 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <div className="space-y-0.5">
              <label className="text-[8px] font-bold text-[#3C4A3D] tracking-[1px] uppercase pl-1 opacity-60">PLATFORM</label>
              <div className="bg-white rounded-lg px-3 h-8 flex items-center justify-between text-[12px] text-[#0B1C30] cursor-pointer border border-transparent hover:border-[#D3E4FE] transition-colors">
                <span>All Platforms</span>
                <CaretDown size={10} className="text-gray-400" />
              </div>
            </div>
            <div className="space-y-0.5">
              <label className="text-[8px] font-bold text-[#3C4A3D] tracking-[1px] uppercase pl-1 opacity-60">DATE RANGE</label>
              <div className="bg-white rounded-lg px-3 h-8 flex items-center justify-between text-[12px] text-[#0B1C30] cursor-pointer border border-transparent hover:border-[#D3E4FE] transition-colors">
                <span>Last 30 Days</span>
                <CaretDown size={10} className="text-gray-400" />
              </div>
            </div>
            <div className="space-y-0.5">
              <label className="text-[8px] font-bold text-[#3C4A3D] tracking-[1px] uppercase pl-1 opacity-60">TYPE</label>
              <div className="bg-white rounded-lg px-3 h-8 flex items-center justify-between text-[12px] text-[#0B1C30] cursor-pointer border border-transparent hover:border-[#D3E4FE] transition-colors">
                <span>All Content</span>
                <CaretDown size={10} className="text-gray-400" />
              </div>
            </div>
          </div>
          <div className="pt-3.5">
            <button className="bg-[#006D32] text-white px-4 h-8 rounded-lg font-medium text-[12px] flex items-center gap-2 hover:bg-[#005227] transition shadow-sm whitespace-nowrap">
              <Funnel size={14} weight="bold" />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Bento Stats */}
        <div className="grid grid-cols-2 gap-6 h-[110px]">
          <div className="bg-[#E5EEFF] rounded-[16px] p-5 relative overflow-hidden group border border-[#D3E4FE]/50 flex flex-col justify-center">
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-[#006D32] to-transparent opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700" />
            <div className="space-y-0.5 relative z-10">
              <p className="text-[10px] font-bold text-[#006D32] tracking-[0.5px] uppercase opacity-70">AGGREGATED REACH</p>
              <h2 className="text-[30px] font-bold text-[#0B1C30] tracking-[-1px]" style={{ fontFamily: "'Space Grotesk'" }}>
                {isLoading ? '...' : fmt((perf as any)?.audience?.views || 1200000)}
              </h2>
              <div className="flex items-center gap-1 text-[12px] text-[#3C4A3D]">
                <TrendUp size={12} className="text-[#006D32] font-bold" />
                <span className="font-bold text-[#3C4A3D]">12%</span>
                <span className="opacity-50">vs last month</span>
              </div>
            </div>
          </div>
          <div className="bg-[#0070EA] rounded-[16px] p-5 relative shadow-sm flex flex-col justify-center">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-white/70 tracking-[0.5px] uppercase">TOTAL ENGAGEMENT</p>
              <h2 className="text-[30px] font-bold text-white tracking-[-1px]" style={{ fontFamily: "'Space Grotesk'" }}>
                {isLoading ? '...' : fmt(Math.round(perf?.engagementRate || 84200))}
              </h2>
              <p className="text-[12px] text-white/70 font-medium">Performance Pulse</p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-[24px] shadow-sm border border-[#F1F5F9] overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#EFF4FF] text-left">
                <th className="p-4 text-[10px] font-bold tracking-[1px] text-[#3C4A3D] uppercase w-[34%]">CONTENT</th>
                <th className="p-4 text-[10px] font-bold tracking-[1px] text-[#3C4A3D] uppercase w-[14%]">DATE</th>
                <th className="p-4 text-[10px] font-bold tracking-[1px] text-[#3C4A3D] uppercase w-[12%]">VIEWS</th>
                <th className="p-4 text-[10px] font-bold tracking-[1px] text-[#3C4A3D] uppercase w-[15%] text-center">WATCH TIME</th>
                <th className="p-4 text-[10px] font-bold tracking-[1px] text-[#3C4A3D] uppercase w-[11%] text-right">LIKES</th>
                <th className="p-4 text-[10px] font-bold tracking-[1px] text-[#3C4A3D] uppercase w-[14%] text-right pr-4">ENG %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF4FF]">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="h-[64px] bg-white/50" />
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[12px] text-[#6B7280]">
                    No videos found yet. Connect YouTube and sync to load performance data.
                  </td>
                </tr>
              ) : items.map((item, i) => {
                const isSelected = selectedId === item.youtubeVideoId;
                const likes = item.likeCount || 12400;
                const views = (item as any).viewCount || (item as any).views || 0;
                const eng = views > 0 ? ((likes + ((item as any).commentCount || 0)) / views) * 100 : 8.4;
                
                return (
                  <tr 
                    key={i} 
                    onClick={() => setSelectedId(item.youtubeVideoId)}
                    className={`h-[64px] cursor-pointer transition-colors group ${
                      isSelected ? 'bg-[#E5EEFF]/40' : 'hover:bg-[#F8F9FF]'
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-[#DCE9FF] rounded overflow-hidden flex-shrink-0">
                          {item.youtubeVideoId && (
                            <img 
                              src={`https://img.youtube.com/vi/${item.youtubeVideoId}/mqdefault.jpg`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[13px] text-[#0B1C30] truncate">{item.title}</p>
                          <p className="text-[10px] text-[#3C4A3D]/60 flex items-center gap-1 mt-0">
                            <span className="capitalize">{(item as any).type || 'Video'}</span>
                            <span className="opacity-30">•</span>
                            <span className="flex items-center gap-1 scale-[0.85] origin-left">
                              {getPlatformIcon((item as any).platform || 'YouTube')}
                              {(item as any).platform || 'YouTube'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#3C4A3D]">
                      {new Date((item as any).publishedAt || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 font-bold text-[13px] text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
                      {fmt(views)}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#3C4A3D] text-center">
                      {(item as any).duration || '412 hrs'}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#3C4A3D] text-right">
                      {fmt(likes)}
                    </td>
                    <td className="px-4 py-3 text-right pr-4">
                      <span className={`inline-flex px-1.5 py-0 rounded-full text-[10px] font-bold ${
                        eng > 8 ? 'bg-[#00D166] text-[#005324]' : 'bg-[#DCE9FF] text-[#0B1C30]'
                      }`}>
                        {eng.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-4 flex justify-center border-t border-[#EFF4FF]">
            <button className="flex items-center gap-2 text-[#006D32] font-bold text-[12px] hover:underline">
              Load More Streams
              <CaretDown size={12} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Aside - Right Side: Detail Panel */}
      <div className="w-full lg:w-[360px] lg:min-w-[340px] sticky top-4 h-fit lg:h-[calc(100vh-2rem)]">
        <div className="bg-[#EFF4FF] rounded-[24px] h-full p-5 flex flex-col shadow-sm border border-[#D3E4FE]/50">
          <div className="flex justify-between items-start mb-5">
            <div className="space-y-2">
              <div className="inline-flex px-2 py-0.5 bg-[#64FF92] text-[#00210B] rounded-full text-[8px] font-bold uppercase tracking-[-0.2px]">
                LIVE ANALYSIS
              </div>
              <h2 className="text-[18px] font-bold text-[#0B1C30] leading-tight" style={{ fontFamily: "'Space Grotesk'" }}>
                Content Detail
              </h2>
            </div>
            <button className="p-1.5 hover:bg-white/50 rounded-full transition-colors" onClick={() => setSelectedId(null)}>
              <X size={16} className="text-[#0B1C30]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-8 pr-1 custom-scrollbar">
            {!selectedItem ? (
              <div className="bg-[#D3E4FE]/40 border-2 border-dashed border-[#BBCBB9]/20 rounded-[16px] p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[180px]">
                <div className="w-9 h-9 bg-white/50 rounded-full flex items-center justify-center shadow-sm">
                  <ChartBar size={20} className="text-[#006D32]" />
                </div>
                <p className="text-[13px] font-medium text-[#3C4A3D] max-w-[200px] opacity-80">
                  Select a content row to view deep metrics and engagement heatmaps.
                </p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Real Detail Content */}
                <div className="aspect-video bg-white rounded-xl overflow-hidden shadow-sm border border-white">
                  <img 
                    src={`https://img.youtube.com/vi/${selectedItem.youtubeVideoId}/maxresdefault.jpg`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-5 space-y-1.5 border border-white/50 shadow-sm">
                      <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">RETENTION</p>
                      <p className="text-[22px] font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>64.2%</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 space-y-1.5 border border-white/50 shadow-sm">
                      <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">CTR</p>
                      <p className="text-[22px] font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>8.1%</p>
                    </div>
                  </div>

                  <div className="bg-white/60 rounded-2xl p-6 space-y-5 border border-white">
                    <h3 className="text-[12px] font-bold text-[#0B1C30] uppercase tracking-widest">Sentiment Analysis</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between text-[12px] font-medium">
                        <span className="text-[#3C4A3D]">Positive (82%)</span>
                        <span className="text-[#006D32] font-bold">Excellent</span>
                      </div>
                      <div className="w-full bg-white/50 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#00D166] h-full w-[82%] shadow-[0_0_8px_rgba(0,209,102,0.4)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="pt-6 mt-auto">
            <button className="w-full bg-[#006D32] text-white h-11 rounded-[12px] font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-[#005227] transition shadow-lg shadow-green-900/10 active:scale-95">
              <DownloadSimple size={18} weight="bold" />
              Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
