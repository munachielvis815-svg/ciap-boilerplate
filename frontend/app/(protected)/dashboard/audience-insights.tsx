'use client';

import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Eye, ThumbsUp, ShareNetwork, ChatCircle, ArrowSquareOut, ArrowsClockwise } from '@phosphor-icons/react';
import { useAudienceInsights, usePerformanceInsights, useYoutubeMetrics } from '@/lib/api/hooks';
import { getYoutubeEmptyState, getYoutubeErrorToastMessage } from '@/lib/api/errors';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Sentiment Ring ───────────────────────────────────────────────────────────

function SentimentRing({ score }: { score: number }) {
  const pos = score;
  const neu = Math.round((100 - score) * 0.8);
  const neg = 100 - pos - neu;
  const data = [
    { name: 'Positive', value: pos,  color: '#00D166' },
    { name: 'Neutral',  value: neu,  color: '#E5EEFF' },
    { name: 'Negative', value: neg,  color: '#FEE2E2' },
  ];
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="font-bold text-[#0B1C30] text-lg" style={{ fontFamily: "'Space Grotesk'" }}>Sentiment Pulse</h2>
        <p className="text-xs text-[#6B7280] mt-0.5">Global brand perception</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-36 h-36">
          <PieChart width={144} height={144}>
            <Pie data={data} cx={68} cy={68} innerRadius={48} outerRadius={68} dataKey="value" strokeWidth={0}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>{pos}%</span>
            <span className="text-xs text-[#006D32] font-semibold uppercase tracking-wide">Positive</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full mt-4">
          {[['Pos', pos + '%', '#006D32'], ['Neu', neu + '%', '#6B7280'], ['Neg', neg + '%', '#DC2626']].map(([l, v, c]) => (
            <div key={l} className="text-center">
              <p className="text-xs text-[#6B7280] font-medium">{l}</p>
              <p className="font-bold text-sm mt-0.5" style={{ color: c as string }}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Demographic Split ────────────────────────────────────────────────────────

function DemographicSplit({ influenceScore }: { influenceScore: number }) {
  const genderData = [
    { name: 'Male',   value: 62, color: '#006D32' },
    { name: 'Female', value: 35, color: '#00D166' },
    { name: 'Other',  value: 3,  color: '#D3E4FE' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="font-bold text-[#0B1C30] text-lg mb-4" style={{ fontFamily: "'Space Grotesk'" }}>
        Demographic Split
      </h2>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <PieChart width={80} height={80}>
            <Pie data={genderData} cx={36} cy={36} innerRadius={24} outerRadius={38} dataKey="value" strokeWidth={0}>
              {genderData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-[#EFF4FF] flex items-center justify-center">
              <Eye size={14} className="text-[#006D32]" />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1.5">
          {genderData.map(g => (
            <div key={g.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: g.color }} />
                <span className="text-[13px] text-[#3C4A3D]">{g.name}</span>
              </div>
              <span className="text-[13px] font-bold text-[#0B1C30]">{g.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Age bars */}
      <div className="mt-5 space-y-3">
        {[['AGE 18-24', 42], ['AGE 25-34', 38]].map(([label, pct]) => (
          <div key={label as string}>
            <div className="flex justify-between text-[11px] text-[#6B7280] font-semibold mb-1 uppercase tracking-wide">
              <span>{label}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} transition={{ duration: 1 }}
                className="h-full bg-[#00D166] rounded-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Global Distribution ──────────────────────────────────────────────────────

function GlobalDistribution() {
  const regions = [
    { rank: '01', name: 'United States', value: '45k', pct: 85 },
    { rank: '02', name: 'Germany',       value: '22k', pct: 48 },
    { rank: '03', name: 'United Kingdom',value: '18k', pct: 40 },
    { rank: '04', name: 'Canada',        value: '12k', pct: 28 },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="font-bold text-[#0B1C30] text-lg mb-1" style={{ fontFamily: "'Space Grotesk'" }}>
        Global Distribution
      </h2>
      <p className="text-xs text-[#6B7280] mb-5">Top engaging regions</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* World map placeholder */}
        <div className="bg-[#1a2744] rounded-xl h-48 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #00D166 0%, transparent 50%), radial-gradient(circle at 70% 40%, #0059BB 0%, transparent 50%)" }} />
          <div className="text-center z-10">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
                <path d="M2 12h20M12 2c-3 3-5 6-5 10s2 7 5 10M12 2c3 3 5 6 5 10s-2 7-5 10" strokeWidth="1.5"/>
              </svg>
            </div>
            <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">Live Traffic</span>
          </div>
        </div>

        {/* Regions list */}
        <div className="space-y-3">
          {regions.map(r => (
            <div key={r.rank}>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[11px] font-bold text-[#6B7280]">{r.rank}</span>
                <span className="text-[13px] font-semibold text-[#0B1C30] flex-1">{r.name}</span>
                <span className="text-[13px] font-bold text-[#0B1C30]">{r.value}</span>
              </div>
              <div className="h-1 bg-[#E5E7EB] rounded-full overflow-hidden ml-6">
                <motion.div
                  initial={{ width: 0 }} whileInView={{ width: `${r.pct}%` }} transition={{ duration: 0.8 }}
                  className="h-full bg-[#006D32] rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── KPI Strip ────────────────────────────────────────────────────────────────

function KpiStrip({ views, engagementRate, minutesWatched, subscribersGained }: {
  views: number; engagementRate: number; minutesWatched: number; subscribersGained: number;
}) {
  const items = [
    { label: 'Total Impressions', value: fmt(views),            icon: Eye,           bg: '#EFF4FF',  color: '#006D32' },
    { label: 'Engagement Rate',   value: `${engagementRate.toFixed(1)}%`, icon: ThumbsUp, bg: '#E5EEFF', color: '#0059BB' },
    { label: 'Watch Minutes',     value: fmt(minutesWatched),   icon: ShareNetwork,  bg: '#EFF4FF',  color: '#006D32' },
    { label: 'Subscribers Gained',value: fmt(subscribersGained),icon: ChatCircle,    bg: '#D3E4FE',  color: '#0B1C30' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((k, i) => {
        const Icon = k.icon;
        return (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-xl p-4 flex items-center gap-3" style={{ background: k.bg }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: k.color + '20' }}>
              <Icon size={18} style={{ color: k.color }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">{k.label}</p>
              <p className="font-bold text-lg text-[#0B1C30] leading-tight" style={{ fontFamily: "'Space Grotesk'" }}>
                {k.value}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Loading / Error states ───────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-[#E5E7EB] animate-pulse rounded-xl ${className}`} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AudienceInsights() {
  const { data: audienceData, isLoading: loadingAudience, error: audienceError, refetch: refetchAudience } = useAudienceInsights(30);
  const { data: perfData, isLoading: loadingPerf, refetch: refetchPerf } = usePerformanceInsights(30);
  const { refetch: syncYoutube, isFetching: isSyncing } = useYoutubeMetrics(false);

  const isLoading = loadingAudience || loadingPerf || isSyncing;

  const handleSync = async () => {
    try {
      await syncYoutube();
      await Promise.all([refetchAudience(), refetchPerf()]);
    } catch (error) {
      console.error('Failed to sync data:', error);
      toast.error(getYoutubeErrorToastMessage(error));
    }
  };

  // Build time-series from perf data
  const growthSeries = (perfData?.timeSeries ?? []).map(d => ({
    date: fmtDate(d.date),
    subscribers: d.subscribersGained,
    views: d.views,
  }));

  // Fallback demo series if no data yet
  const demoSeries = [
    { date: 'WK 1', subscribers: 1200, views: 45000 },
    { date: 'WK 2', subscribers: 1800, views: 62000 },
    { date: 'WK 3', subscribers: 2600, views: 98000 },
    { date: 'WK 4', subscribers: 1400, views: 71000 },
    { date: 'WK 5', subscribers: 3200, views: 115000 },
    { date: 'WK 6', subscribers: 2800, views: 89000 },
    { date: 'WK 7', subscribers: 3800, views: 142000 },
  ];

  const chartData = growthSeries.length >= 2 ? growthSeries : demoSeries;
  const influenceScore = audienceData?.influenceScore ?? 74;
  const views = audienceData?.audience.views ?? 2_400_000;
  const engRate = perfData?.engagementRate ?? 5.8;
  const minutesWatched = audienceData?.audience.estimatedMinutesWatched ?? 814_000;
  const subsGained = audienceData?.audience.subscribersGained ?? 12_200;
  const weeklyGrowthPct = perfData?.weeklyGrowth?.followerGrowth
    ? ((perfData.weeklyGrowth.followerGrowth / (audienceData?.channel?.subscriberCount || 100000)) * 100).toFixed(1)
    : '12.4';

  if (audienceError) {
    const emptyState = getYoutubeEmptyState(audienceError);
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <Eye size={24} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-[#0B1C30]">{emptyState.title}</h2>
        <p className="text-[#6B7280] mt-2 max-w-sm">{emptyState.description}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1C30] tracking-tight" style={{ fontFamily: "'Space Grotesk'" }}>
            Audience Insights
          </h1>
          <p className="text-[#3C4A3D] mt-1 text-sm">Real-time demographic intelligence and sentiment analysis.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-[#006D32] font-semibold text-sm hover:underline transition">
            Export Report
          </button>
          <button 
            onClick={handleSync}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#006D32] text-white rounded-lg font-semibold text-sm hover:bg-[#005227] transition shadow-sm disabled:opacity-50"
          >
            <ArrowsClockwise size={15} weight="bold" className={isLoading ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Row 1: Growth Chart + Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Follower Growth Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          {isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-bold text-[#0B1C30] text-lg" style={{ fontFamily: "'Space Grotesk'" }}>
                    Follower Growth Trend
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-0.5">Last {audienceData?.windowDays ?? 30} days performance</p>
                </div>
                <span className="flex items-center gap-1.5 bg-[#DCFCE7] text-[#006D32] text-xs font-bold px-3 py-1.5 rounded-full">
                  ↑ +{weeklyGrowthPct}%
                </span>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#00D166" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#00D166" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '12px' }}
                      formatter={(value, name) => [fmt(Number(value)), name === 'subscribers' ? 'Subscribers' : 'Views']}
                    />
                    <Area type="monotone" dataKey="subscribers" stroke="#00D166" strokeWidth={2.5} fill="url(#growthGrad)" dot={false} activeDot={{ r: 4, fill: '#00D166' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* Sentiment Pulse */}
        <div className="bg-[#EFF4FF] rounded-2xl p-6 shadow-sm">
          {isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <SentimentRing score={influenceScore} />
          )}
        </div>
      </div>

      {/* Row 2: Demographics + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DemographicSplit influenceScore={influenceScore} />
        <GlobalDistribution />
      </div>

      {/* Row 3: KPI Strip */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <KpiStrip
          views={views}
          engagementRate={engRate}
          minutesWatched={minutesWatched}
          subscribersGained={subsGained}
        />
      )}
    </div>
  );
}
