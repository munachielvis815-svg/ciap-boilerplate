'use client';
import { useMemo, useState, Suspense, ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import {
  Gear, MagnifyingGlass,
  Users, Eye, Star, YoutubeLogo,
  TiktokLogo, InstagramLogo, Bell,
  IdentificationCard, Globe, Camera,
  Layout, Briefcase, ChartBar,
  CheckCircle, ArrowsLeftRight,
  Waveform, Smiley, Target, CurrencyNgn,
  Lightning, TrendUp, Icon,
  Link as LinkIcon, Plus, CircleNotch,
  ChatCircleText, Megaphone
} from '@phosphor-icons/react';
import { useMeProfile, useAdminUsers, useDiscoverCreators, useUpdateCreatorProfile } from '@/lib/api/hooks';
import { useAuthStore } from '@/lib/auth/store';
import api from '@/lib/api/client';
import { toast } from 'sonner';
import Skeleton from '@/components/ui/Skeleton';

// --- Types ---

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: Icon;
  trend?: string;
}

interface SectionBoxProps {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  color?: string;
  svg?: string;
}

// --- Style System - Omniview Theme ---

const PALETTE = {
  blue: "#EFF6FF",
  pink: "#FEF2F2",
  yellow: "#FFFBEB",
  green: "#F0FDF4",
  purple: "#F0F4FF",
  black: "#0B1C30",
  cream: "#F8F9FF"
};

const MetricCard = ({ title, value, icon: Icon, trend }: MetricCardProps) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    className="flex flex-col items-center text-center gap-4 p-7 bg-white border border-[#E5E7EB] rounded-2xl hover:shadow-lg hover:border-[#6B61F0] transition-all relative overflow-hidden group cursor-default"
  >
    <div className="w-12 h-12 rounded-xl bg-[#F0F4FF] flex items-center justify-center group-hover:bg-[#6B61F0] group-hover:text-white transition-all duration-300 text-[#6B61F0]">
      <Icon size={24} weight="bold" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center justify-center gap-2">
        <h4 className="text-3xl font-black tracking-tighter text-[#0B1C30] leading-none font-[family-name:var(--font-bricolage)]">{value}</h4>
        {trend && (
          <span className="text-[10px] font-black text-[#10B981] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#10B981]/20">
            +{trend}
          </span>
        )}
      </div>
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9CA3AF] mt-2.5 leading-none">{title}</p>
    </div>
  </motion.div>
);

const SectionBox = ({ title, children, className = "", action, color = "white", svg = "/undraw_document-analysis_3c0y.svg" }: SectionBoxProps) => (
  <div className={`bg-white rounded-2xl p-7 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all relative group overflow-hidden ${className}`} style={{ backgroundColor: color }}>
    <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none flex items-center justify-center overflow-hidden">
      <img src={svg} alt="" className="w-[120%] max-none grayscale" />
    </div>
    <div className="flex justify-between items-center mb-6 relative z-10">
      <h3 className="text-xl font-black tracking-tighter text-[#0B1C30] font-[family-name:var(--font-bricolage)] leading-none">{title}</h3>
      {action}
    </div>
    <div className="relative z-10 h-full">{children}</div>
  </div>
);

const InfluenceScore = ({ score }: { score: number }) => (
  <div className="relative w-48 h-48 flex items-center justify-center group">
    <div className="absolute inset-0 bg-black/5 rounded-full blur-2xl group-hover:bg-black/10 transition-all" />
    <svg className="w-full h-full -rotate-90 relative z-10">
      <defs>
        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="100%" stopColor="#444444" />
        </linearGradient>
      </defs>
      <circle cx="96" cy="96" r="82" fill="transparent" stroke="rgba(0,0,0,0.03)" strokeWidth="14" />
      <motion.circle
        cx="96" cy="96" r="82" fill="transparent" stroke="url(#scoreGradient)" strokeWidth="14"
        strokeDasharray="515"
        initial={{ strokeDashoffset: 515 }}
        animate={{ strokeDashoffset: 515 - (515 * score) / 100 }}
        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
        strokeLinecap="round"
      />
    </svg>
    <div className="absolute flex flex-col items-center z-20">
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="text-6xl font-black text-black font-[family-name:var(--font-bricolage)] tracking-tighter"
      >
        {score}
      </motion.span>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-[-4px]">Intelligence</span>
    </div>
  </div>
);

const EmptyState = ({ onManage }: { onManage: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 bg-white border border-black border-dashed rounded-[3rem]">
      <div className="w-64 opacity-20">
        <img src="/undraw_connected-world_anke.svg" alt="" />
      </div>
      <div className="space-y-3 px-6">
        <h2 className="text-3xl font-black tracking-tighter font-[family-name:var(--font-bricolage)] text-black">Connect an account</h2>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">Link your YouTube or Instagram to see your numbers.</p>
      </div>
      <button onClick={onManage} className="flex items-center gap-3 px-12 py-5 bg-black text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-black/30">
        <Plus size={20} weight="bold" />
        Add Account
      </button>
    </div>
  );
};

const MetricCardSkeleton = () => (
  <div className="flex flex-col items-center text-center gap-3 p-5 bg-white border border-black/5 rounded-[2.1rem] shadow-sm">
    <Skeleton className="w-8 h-8 rounded-full" />
    <div className="space-y-2 flex flex-col items-center w-full">
      <Skeleton className="w-20 h-6" />
      <Skeleton className="w-12 h-3" />
    </div>
  </div>
);

const SectionBoxSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-white rounded-[2.1rem] p-7 border border-black shadow-xl shadow-black/5 relative overflow-hidden ${className}`}>
    <div className="flex justify-between items-center mb-6">
      <Skeleton className="w-32 h-6" />
    </div>
    <div className="space-y-4">
      <Skeleton className="w-full h-[240px] rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="w-full h-8" />
        <Skeleton className="w-3/4 h-8" />
      </div>
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full pb-24 md:pb-8">
    <div className="space-y-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 pb-10 border-b border-black/5">
        {[1, 2, 3, 4].map(i => <MetricCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <SectionBoxSkeleton className="xl:col-span-8" />
        <SectionBoxSkeleton className="xl:col-span-4" />
      </div>
    </div>
  </div>
);

// --- Sub-Views ---

// --- Dedicated Views ---

const CreatorDashboardView = ({ data, onManage }: { data: any, onManage: () => void }) => {
  const hasIntegrations = Object.values(data?.platformStatus || {}).some((p: any) => p.connected);

  const subscriberCount = data?.creator?.audience?.channel?.subscriberCount || 0;
  const totalViews = data?.creator?.audience?.channel?.totalViewCount || 0;
  const influenceScore = data?.creator?.audience?.influenceScore || 0;

  const chartData = useMemo(() => {
    if (data?.creator?.performance?.timeSeries?.length > 0) {
      return data.creator.performance.timeSeries.map((d: any) => ({
        name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
        views: d.views
      }));
    }
    // Fallback to empty but typed array if no data yet
    return [
      { name: 'Mon', views: 0 }, { name: 'Tue', views: 0 }, { name: 'Wed', views: 0 },
      { name: 'Thu', views: 0 }, { name: 'Fri', views: 0 }, { name: 'Sat', views: 0 }, { name: 'Sun', views: 0 },
    ];
  }, [data]);

  if (!hasIntegrations) return <EmptyState onManage={onManage} />;

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard title="Total Reach" value={subscriberCount.toLocaleString()} icon={TrendUp} />
        <MetricCard title="Total Views" value={totalViews.toLocaleString()} icon={Eye} />
        <MetricCard title="Influence" value={influenceScore} icon={Star} />
        <MetricCard title="ROI" value="--" icon={CurrencyNgn} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <SectionBox title="Analytics" className="xl:col-span-8 shadow-2xl shadow-blue-500/10" color={PALETTE.blue} svg="/undraw_speed-test_wdyh.svg">
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="creatorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#000' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#000' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: '3px solid #000', fontWeight: 900, backgroundColor: '#fff', boxShadow: '12px 12px 0px 0px rgba(0,0,0,1)' }} />
                <Area type="monotone" dataKey="views" stroke="#000" strokeWidth={4} fillOpacity={1} fill="url(#creatorGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionBox>

        <SectionBox title="Influence" className="xl:col-span-4" color={PALETTE.green} svg="/undraw_video-influencer_7ak0.svg">
          <div className="flex flex-col items-center justify-center h-full gap-10 py-6">
            {data?.creator?.audience?.channel?.channelTitle && (
              <div className="text-center space-y-2 mb-2 animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 rounded-full border-4 border-black overflow-hidden mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                   <img 
                     src={data.creator.audience.channel.thumbnailUrl || `https://i.pravatar.cc/400?u=${data.creator.audience.channel.youtubeChannelId}`} 
                     alt="" 
                     className="w-full h-full object-cover" 
                   />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight">{data.creator.audience.channel.channelTitle}</h4>
                  <p className="text-[8px] font-black uppercase text-zinc-400">Connected Channel</p>
                </div>
              </div>
            )}
            {!data?.creator?.audience?.channel?.channelTitle && <InfluenceScore score={influenceScore || 0} />}
            <div className="w-full space-y-4">
              {[
                { label: 'Engagement', val: data?.creator?.audience?.loyalty || 0, color: '#000' },
                { label: 'Growth', val: data?.creator?.audience?.growth || 0, color: '#666' }
              ].map(m => (
                <div key={m.label} className="group">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-2.5">
                    <span>{m.label}</span>
                    <span>{m.val}%</span>
                  </div>
                  <div className="h-3 bg-white border-2 border-black rounded-full overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.val}%` }}
                      transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionBox>
      </div>
    </div>
  );
};

const CreatorCard = ({ creator }: { creator: any }) => (
  <div className="bg-white rounded-[2rem] border-2 border-black overflow-hidden group hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all cursor-default">
    <div className="aspect-square relative overflow-hidden bg-zinc-50 border-b-2 border-black">
      <img
        src={creator.avatarUrl || `https://i.pravatar.cc/400?u=${creator.userId}`}
        alt=""
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-full text-[8px] font-black text-black border-2 border-black">
        {creator.influenceScore || 0} Score
      </div>
    </div>
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full border-2 border-black overflow-hidden bg-white">
          <img src={creator.avatarUrl || `https://i.pravatar.cc/400?u=${creator.userId}`} alt="" />
        </div>
        <div>
          <h3 className="font-black text-lg text-black tracking-tighter leading-none font-[family-name:var(--font-bricolage)]">{creator.displayName || creator.name || 'Unknown'}</h3>
          <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 mt-1">{creator.category || 'Lifestyle'} • {creator.location || 'Nigeria'}</p>
        </div>
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-black/5">
        <div>
          <p className="text-xl font-black text-black tracking-tighter">
            {creator.audienceSize >= 1000000 ? `${(creator.audienceSize / 1000000).toFixed(1)}M` : creator.audienceSize >= 1000 ? `${(creator.audienceSize / 1000).toFixed(0)}k` : creator.audienceSize || 0}
          </p>
          <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Reach</p>
        </div>
        <button className="px-5 py-2 bg-black text-white rounded-full text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-transform active:scale-95">Chat</button>
      </div>
    </div>
  </div>
);

const SmeDashboardView = ({ data, setActiveTab }: { data: any, setActiveTab: (tab: string) => void }) => {
  const chartData = [
    { name: 'Week 1', creators: 42 }, { name: 'Week 2', creators: 65 }, { name: 'Week 3', creators: 112 }, { name: 'Week 4', creators: 142 },
  ];

  // For SME dashboard, only show creators that have been chosen/representing brand
  // We'll mock this by checking a hypothetical 'partnerships' field or filtering
  const activePartnerships = useMemo(() => {
    return (data?.sme?.activeCreators || []).filter((c: any) => c.status === 'active');
  }, [data]);

  const activeCount = activePartnerships.length || 0;

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard title="Market Reach" value="0" icon={Globe} />
        <MetricCard title="Active Partnerships" value={activeCount} icon={Users} />
        <MetricCard title="Network ROI" value="0x" icon={CurrencyNgn} />
        <MetricCard title="Sentiment" value="--" icon={Smiley} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <SectionBox title="Market Trends" className="xl:col-span-8 shadow-2xl shadow-purple-500/10" color={PALETTE.purple} svg="/undraw_connected-world_anke.svg">
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#000' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#000' }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: '16px', border: '3px solid #000', fontWeight: 900, boxShadow: '12px 12px 0px 0px rgba(0,0,0,1)' }} />
                <Bar dataKey="creators" fill="#000" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionBox>

        <SectionBox title="Network Split" className="xl:col-span-4" color={PALETTE.pink} svg="/undraw_social-friends_mt6k.svg">
          <div className="h-full flex flex-col justify-center gap-8">
            {[
              { name: 'YouTube', value: 45, color: '#FF0000', icon: YoutubeLogo },
              { name: 'TikTok', value: 30, color: '#000', icon: TiktokLogo },
              { name: 'Instagram', value: 25, color: '#E1306C', icon: InstagramLogo }
            ].map((p) => (
              <div key={p.name} className="p-6 bg-white/50 backdrop-blur-md border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all group">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <p.icon size={20} weight="fill" style={{ color: p.color }} />
                    <span className="font-black text-xs uppercase tracking-[0.2em]">{p.name}</span>
                  </div>
                  <span className="font-black text-lg">{p.value}%</span>
                </div>
                <div className="h-3 bg-zinc-100 rounded-full overflow-hidden border border-black/5 p-0.5">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p.value}%`, backgroundColor: p.color }} />
                </div>
              </div>
            ))}
          </div>
        </SectionBox>
      </div>

      <div className="space-y-8">
         <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tighter">Your Creators</h3>
            <span className="px-4 py-1.5 bg-black text-white rounded-full text-[8px] font-black uppercase tracking-widest">Selected Brand Representitives</span>
         </div>
         {activePartnerships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activePartnerships.map((creator: any) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
         ) : (
            <div className="p-12 border-2 border-dashed border-black/10 rounded-[2.5rem] text-center bg-white">
               <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No brand representatives chosen yet</p>
               <button onClick={() => setActiveTab('market')} className="mt-4 px-6 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Explore Creators</button>
            </div>
         )}
      </div>

      <div className="space-y-8">
         <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tighter">Market Potential</h3>
            <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Creators you could reach out to</span>
         </div>
          <div className="p-12 border-2 border-dashed border-black/10 rounded-[2.5rem] text-center bg-white/50">
            <ChartBar size={48} className="mx-auto text-zinc-200 mb-4" />
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-4">Analytics for discovery available in Market tab</p>
            <button onClick={() => setActiveTab('market')} className="px-6 py-2 border-2 border-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">Go to Market</button>
          </div>
      </div>
    </div>
  );
};

// AdminDashboardView was merged into AdminManagementView below

const AnalyticsView = ({ data, role, onManage }: { data: any, role: string, onManage: () => void }) => {
  const isCreator = role === 'creator';
  const hasIntegrations = Object.values(data?.platformStatus || {}).some((p: any) => p.connected);

  if (!hasIntegrations && isCreator) return <EmptyState onManage={onManage} />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SectionBox title={isCreator ? "Your Impact" : "Network Overview"} color={PALETTE.green} svg="/undraw_video-influencer_7ak0.svg">
          <div className="flex flex-col md:flex-row items-center justify-around h-[240px] px-4">
            {isCreator ? (
              <InfluenceScore score={data?.creator?.audience?.influenceScore || 0} />
            ) : (
              <div className="text-center space-y-2">
                <div className="text-6xl font-black tracking-tighter">{data?.sme?.networkQuality || 0}%</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Network Quality</div>
              </div>
            )}
            <div className="space-y-4">
              {[
                { label: 'Loyalty', val: data?.creator?.audience?.loyalty || 0 },
                { label: 'Quality', val: data?.creator?.audience?.quality || 0 },
                { label: 'Growth', val: data?.creator?.audience?.growth || 0 }
              ].map(m => (
                <div key={m.label} className="w-40 group">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2 group-hover:text-black transition-colors">
                    <span>{m.label}</span>
                    <span>{m.val}%</span>
                  </div>
                  <div className="h-2 bg-black/5 rounded-full overflow-hidden border border-black/5">
                    <div className="h-full bg-black transition-all duration-1000" style={{ width: `${m.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionBox>

        <SectionBox title="Audience" color={PALETTE.purple} svg="/undraw_chat-with-ai_ir62.svg">
          <div className="h-[240px] flex flex-col items-center justify-center gap-6">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <Smiley size={32} weight="fill" className="text-black mb-1 mx-auto" />
                <p className="text-[9px] font-black uppercase">Positive</p>
                <p className="text-xl font-black">{data?.creator?.audience?.sentiment?.positive || 0}%</p>
              </div>
              <div className="w-px h-12 bg-black/10" />
              <div className="text-center">
                <Waveform size={32} weight="bold" className="text-zinc-300 mb-1 mx-auto" />
                <p className="text-[9px] font-black uppercase">Neutral</p>
                <p className="text-xl font-black">{data?.creator?.audience?.sentiment?.neutral || 0}%</p>
              </div>
            </div>
            <div className="flex -space-x-3">
              {(data?.creator?.audience?.topFans || []).map((fan: any, i: number) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-lg">
                  <img src={fan.avatarUrl || `https://i.pravatar.cc/100?u=${i + 100}`} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full bg-black border-2 border-white flex items-center justify-center text-[8px] font-black text-white shadow-lg">
                +{((data?.creator?.audience?.channel?.subscriberCount || 0) / 1000000).toFixed(1)}M
              </div>
            </div>
            <div className="w-full max-w-xs p-4 bg-white border border-black rounded-xl text-[10px] font-bold tracking-tight leading-relaxed italic text-black text-center">
              {data?.creator?.audience?.summary || "No resonance data available yet."}
            </div>
          </div>
        </SectionBox>
      </div>
    </div>
  );
};

const ConnectionView = ({ data, compact = false, onManage }: { data: any, compact?: boolean, onManage: () => void }) => {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (app: any) => {
    setConnecting(app.id);
    try {
      const response = await api.get(`/ingestion/${app.id}/oauth2`);
      const url = response.data?.authorizationUrl;
      if (url) {
        window.location.href = url;
      } else {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        window.location.href = `${baseUrl}/ingestion/${app.id}/oauth2`;
      }
    } catch (err) {
      console.error('Connection failed', err);
      toast.error(`Could not reach the ${app.name} connector.`);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <SectionBox title="Accounts" color={compact ? PALETTE.cream : PALETTE.green} svg="/undraw_social-friends_mt6k.svg">
      <div className={`grid ${compact ? 'grid-cols-1 gap-3' : 'grid-cols-2 md:grid-cols-4 gap-4'}`}>
        {[
          { id: 'youtube', name: 'YouTube', icon: YoutubeLogo, path: '/ingestion/youtube/oauth2' },
          { id: 'instagram', name: 'Instagram', icon: InstagramLogo, path: '/ingestion/instagram/oauth2' },
          { id: 'tiktok', name: 'TikTok', icon: TiktokLogo, path: '/ingestion/tiktok/oauth2' },
          { id: 'music', name: 'Music Hub', icon: Waveform, path: '/ingestion/music/oauth2' }
        ].map(app => {
          const status = data?.platformStatus?.[app.id] || { connected: false };
          const isConnected = status.connected;
          const isPending = connecting === app.id;

          return (
            <div key={app.name} className={`bg-white border border-black rounded-[1.8rem] hover:shadow-lg transition-all flex items-center justify-between group cursor-pointer ${compact ? 'p-4' : 'p-5 flex-col gap-4'}`}>
              <div className="flex items-center gap-4">
                <app.icon size={compact ? 20 : 24} weight={isConnected ? "fill" : "bold"} className="text-black" />
                <div>
                  <h4 className="text-sm font-black text-black font-[family-name:var(--font-bricolage)] leading-none">{app.name}</h4>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{isConnected ? 'Live' : 'Setup'}</p>
                </div>
              </div>
              <button
                disabled={isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isConnected) onManage();
                  else handleConnect(app);
                }}
                className={`px-4 py-2 border border-black rounded-full text-[8px] font-black uppercase transition-all flex items-center gap-2 ${isConnected ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
              >
                {isPending ? <CircleNotch className="animate-spin" /> : null}
                {isConnected ? 'Manage' : 'Connect'}
              </button>
            </div>
          );
        })}
      </div>
    </SectionBox>
  );
};

const AdminManagementView = () => {
  const { data: adminData, isLoading } = useAdminUsers();

  const users = useMemo(() => {
    const list = Array.isArray(adminData) ? adminData : [];
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [adminData]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      creators: users.filter(u => u.role === 'creator').length,
      smes: users.filter(u => u.role === 'sme').length,
    };
  }, [users]);

  const chartData = useMemo(() => [
    { name: 'Mon', logins: 12, syncs: 45 },
    { name: 'Tue', logins: 18, syncs: 52 },
    { name: 'Wed', logins: 15, syncs: 38 },
    { name: 'Thu', logins: 25, syncs: 61 },
    { name: 'Fri', logins: 32, syncs: 74 },
    { name: 'Sat', logins: 20, syncs: 42 },
    { name: 'Sun', logins: 14, syncs: 31 },
  ], []);

  const simulatedLogs = useMemo(() => [
    { id: 1, user: 'admin@example.com', action: 'System Backup', time: '10 mins ago', status: 'success' },
    { id: 2, user: 'creator@example.com', action: 'YouTube Sync', time: '25 mins ago', status: 'success' },
    { id: 3, user: 'sme@example.com', action: 'New Campaign', time: '1 hour ago', status: 'warning' },
    { id: 4, user: 'admin@example.com', action: 'Role Update', time: '2 hours ago', status: 'success' },
  ], []);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard title="System Users" value={stats.total} icon={Users} trend="+4" />
        <MetricCard title="Admins" value={stats.admins} icon={Gear} />
        <MetricCard title="Creators" value={stats.creators} icon={Camera} trend="+2" />
        <MetricCard title="SMEs" value={stats.smes} icon={Briefcase} trend="+1" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <SectionBox title="System Activity" className="xl:col-span-8 shadow-2xl shadow-blue-500/10" color={PALETTE.blue} svg="/undraw_performance_re_w9sd.svg">
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#000' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#000' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: '3px solid #000', fontWeight: 900, boxShadow: '12px 12px 0px 0px rgba(0,0,0,1)' }} />
                <Area type="monotone" dataKey="syncs" stroke="#000" strokeWidth={4} fillOpacity={0.1} fill="#000" />
                <Area type="monotone" dataKey="logins" stroke="#666" strokeWidth={3} strokeDasharray="8 8" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionBox>

        <SectionBox title="Recent Events" className="xl:col-span-4" color={PALETTE.pink} svg="/undraw_timeline_re_aw6g.svg">
          <div className="space-y-4">
            {simulatedLogs.map(log => (
              <div key={log.id} className="p-5 bg-white border-2 border-black rounded-[1.8rem] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-black">{log.action}</span>
                  <span className="text-[8px] font-bold text-zinc-400">{log.time}</span>
                </div>
                <div className="text-[10px] font-bold text-zinc-500 truncate">{log.user}</div>
                <div className="flex items-center gap-2 mt-3">
                  <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-[8px] font-black uppercase tracking-widest">{log.status}</span>
                </div>
              </div>
            ))}
            <button className="w-full py-4 border-2 border-black border-dashed rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all mt-2">View Audit Log</button>
          </div>
        </SectionBox>
      </div>

      <SectionBox title="Active Creator Network" className="overflow-hidden" color="white" svg="/undraw_team-page_cl7j.svg">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex gap-2">
            <button className="px-5 py-2 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest">All Users</button>
            <button className="px-5 py-2 bg-white border border-black text-black rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all">Creators Only</button>
          </div>
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input type="text" placeholder="Search registry..." className="pl-11 pr-6 py-2.5 border-2 border-black rounded-full text-[10px] font-bold focus:outline-none focus:ring-4 focus:ring-black/5 w-64" />
          </div>
        </div>
        <div className="overflow-x-auto -mx-7 px-7">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                <th className="px-4 pb-2">User</th>
                <th className="px-4 pb-2">Role</th>
                <th className="px-4 pb-2">Tenant</th>
                <th className="px-4 pb-2">Status</th>
                <th className="px-4 pb-2">Created</th>
                <th className="px-4 pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="group bg-zinc-50/50 hover:bg-white border border-black transition-all">
                  <td className="px-4 py-4 rounded-l-2xl border-y border-l border-black group-hover:bg-white transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-black overflow-hidden bg-white flex-shrink-0">
                        <img src={`https://i.pravatar.cc/100?u=${u.id}`} alt="" />
                      </div>
                      <div>
                        <div className="font-black text-sm tracking-tighter leading-none">{u.name}</div>
                        <div className="text-[10px] font-bold text-zinc-400 mt-1">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-y border-black group-hover:bg-white transition-colors">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${u.role === 'admin' ? 'bg-purple-100' :
                        u.role === 'creator' ? 'bg-pink-100' : 'bg-blue-100'
                      }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 border-y border-black group-hover:bg-white transition-colors font-bold text-[10px] text-zinc-500">
                    ID: {u.tenantId}
                  </td>
                  <td className="px-4 py-4 border-y border-black group-hover:bg-white transition-colors">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-[10px] font-black uppercase tracking-tighter">{u.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-y border-black group-hover:bg-white transition-colors text-[10px] font-bold text-zinc-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 rounded-r-2xl border-y border-r border-black group-hover:bg-white transition-colors text-right">
                    <button className="p-2 hover:bg-black hover:text-white rounded-lg transition-all border border-transparent hover:border-black active:scale-90">
                      <Gear size={16} weight="bold" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionBox>
    </div>
  );
};

const MarketView = ({ data }: { data: any }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const { data: discoveryData, isLoading } = useDiscoverCreators(20, 0, { query: searchQuery });
  const creators = useMemo(() => {
    let list = discoveryData?.creators || [];
    if (activeCategory !== 'All') {
      list = list.filter((c: any) => c.category === activeCategory);
    }
    return list;
  }, [discoveryData, activeCategory]);

  const categories = ['All', 'Lifestyle', 'Tech', 'Music', 'Fashion', 'Gaming'];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-5xl font-black tracking-tighter text-black font-[family-name:var(--font-bricolage)]">Discovery</h2>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Verified talent network in Nigeria</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-80 group">
            <MagnifyingGlass size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
            <input 
              type="text" 
              placeholder="Search creators by name or bio..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 border-2 border-black rounded-full text-xs font-bold focus:outline-none focus:ring-4 focus:ring-black/5 transition-all" 
            />
          </div>
          <button className="hidden sm:flex items-center gap-2 px-8 py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20">
             Filter
          </button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${activeCategory === cat ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-zinc-400 border-black/5 hover:border-black/20'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white rounded-[2.5rem] border-2 border-black overflow-hidden shadow-sm">
               <div className="aspect-[4/5] bg-zinc-100 animate-pulse" />
               <div className="p-8 space-y-4">
                  <div className="h-4 w-32 bg-zinc-100 animate-pulse rounded-full" />
                  <div className="h-2 w-full bg-zinc-100 animate-pulse rounded-full" />
                  <div className="flex justify-between pt-4">
                    <div className="h-8 w-16 bg-zinc-100 animate-pulse rounded-xl" />
                    <div className="h-8 w-8 bg-zinc-100 animate-pulse rounded-xl" />
                  </div>
               </div>
            </div>
          ))}
        </div>
      ) : creators.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center text-center gap-6 bg-white border-2 border-black border-dashed rounded-[3rem]">
          <div className="w-48 opacity-10">
            <MagnifyingGlass size={120} weight="bold" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tighter">No creators found</h3>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Try adjusting your search or filters</p>
          </div>
          <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} className="px-8 py-3 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest">Clear All</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {creators.map((c: any) => (
            <div key={c.userId} className="bg-white rounded-[2rem] border border-black overflow-hidden group hover:shadow-2xl transition-all">
              <div className="aspect-[4/5] relative overflow-hidden bg-zinc-50 border-b border-black">
                <img
                  src={c.avatarUrl || `https://i.pravatar.cc/800?u=${c.userId}`}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-5 right-5 bg-white px-3 py-1.5 rounded-full text-[8px] font-black text-black border border-black shadow-lg">
                  {c.influenceScore || 0} Score
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full border border-black overflow-hidden">
                    <img src={c.avatarUrl || `https://i.pravatar.cc/100?u=${c.userId}`} alt="" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-black tracking-tighter leading-none font-[family-name:var(--font-bricolage)]">{c.displayName || 'Unknown Creator'}</h3>
                    <p className="text-[7px] font-bold uppercase tracking-widest text-zinc-400 mt-1">{c.category || 'Lifestyle'} • {c.location || 'Nigeria'}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-black/5">
                  <div className="space-y-0.5">
                    <p className="text-2xl font-black text-black tracking-tighter">
                      {c.audienceSize >= 1000000 ? `${(c.audienceSize / 1000000).toFixed(1)}M` : c.audienceSize >= 1000 ? `${(c.audienceSize / 1000).toFixed(0)}k` : c.audienceSize}
                    </p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Reach</p>
                  </div>
                  <button onClick={() => toast.success(`Portfolio request sent to ${c.displayName}`)} className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center hover:bg-zinc-800 transition-all active:scale-90">
                    <Plus size={18} weight="bold" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const NotificationsView = ({ data }: { data: any }) => {
  const name = data?.profile?.name || 'Creator';
  const score = data?.profile?.influenceScore || 84;

  const notifications = [
    {
      id: 1,
      title: `Welcome back, ${name}!`,
      message: `Your influence score is currently ${score}. Keep creating amazing content to grow!`,
      time: 'Just now',
      icon: Smiley,
      color: PALETTE.blue
    },
    {
      id: 2,
      title: 'New Milestone!',
      message: 'You reached 1.8M total reach across all platforms. Great job!',
      time: '2 hours ago',
      icon: Lightning,
      color: PALETTE.yellow
    },
    {
      id: 3,
      title: 'Platform Update',
      message: 'YouTube metrics are now syncing 2x faster. Check your dashboard.',
      time: '1 day ago',
      icon: Megaphone,
      color: PALETTE.green
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-4xl font-black tracking-tighter text-black font-[family-name:var(--font-bricolage)]">Inbox</h2>
        <span className="px-3 py-1 bg-black text-white text-[8px] font-black rounded-full uppercase tracking-widest">3 New</span>
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => (
          <div key={notif.id} className="bg-white border border-black rounded-[2rem] p-6 hover:shadow-xl transition-all group flex items-start gap-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none grayscale flex items-center justify-center">
              <notif.icon size={200} />
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border border-black/10 group-hover:scale-110 transition-transform shadow-sm`} style={{ backgroundColor: notif.color }}>
              <notif.icon size={28} weight="bold" className="text-black" />
            </div>
            <div className="flex-1 space-y-1 relative z-10">
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-black tracking-tighter text-black font-[family-name:var(--font-bricolage)] leading-none">{notif.title}</h4>
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{notif.time}</span>
              </div>
              <p className="text-sm font-bold text-zinc-500 leading-relaxed max-w-xl">{notif.message}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-black text-white p-8 rounded-[2.5rem] flex items-center justify-between mt-12 shadow-2xl shadow-black/20">
        <div className="space-y-2">
          <h4 className="text-2xl font-black tracking-tight font-[family-name:var(--font-bricolage)]">Never miss a beat.</h4>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Enable push notifications for real-time updates.</p>
        </div>
        <button className="px-8 py-4 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Enable</button>
      </div>
    </div>
  );
};

// --- App Hub ---

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const { data, isLoading } = useMeProfile();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const role = data?.role || user?.role || 'creator';

  const setActiveTab = (tab: string) => {
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };

  if (!mounted || isLoading) return (
    <div className="w-full bg-[#FFF9F5]">
      <DashboardSkeleton />
    </div>
  );

  const hasIntegrations = Object.values(data?.platformStatus || {}).some((p: any) => p.connected);
  const ChatView = ({ data }: { data: any }) => {
    const [activeChat, setActiveChat] = useState<any>(null);
    const [message, setMessage] = useState('');

    const contacts = [
      { id: 1, name: 'Shalom', role: 'Creator', avatar: 'https://i.pravatar.cc/100?u=1', lastMsg: 'I have updated my metrics.' },
      { id: 2, name: 'Heccker Global', role: 'Brand', avatar: 'https://i.pravatar.cc/100?u=2', lastMsg: 'When is the next post?' },
    ];

    return (
      <div className="h-[700px] bg-white border-2 border-black rounded-[3rem] overflow-hidden flex shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="w-80 border-r-2 border-black flex flex-col">
          <div className="p-8 border-b-2 border-black">
            <h2 className="text-2xl font-black tracking-tighter">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {contacts.map(c => (
              <div
                key={c.id}
                onClick={() => setActiveChat(c)}
                className={`p-6 border-b border-black/5 cursor-pointer hover:bg-zinc-50 transition-all ${activeChat?.id === c.id ? 'bg-zinc-50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-black overflow-hidden bg-white">
                    <img src={c.avatar} alt="" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-sm">{c.name}</h4>
                    <p className="text-[10px] text-zinc-400 font-bold truncate">{c.lastMsg}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-zinc-50/30">
          {activeChat ? (
            <>
              <div className="p-8 border-b-2 border-black bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-black overflow-hidden">
                    <img src={activeChat.avatar} alt="" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm">{activeChat.name}</h4>
                    <span className="text-[8px] font-black uppercase tracking-widest text-green-500">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-8 flex flex-col gap-4 overflow-y-auto no-scrollbar">
                <div className="bg-white border border-black p-4 rounded-2xl rounded-bl-none max-w-sm">
                  <p className="text-xs font-bold">{activeChat.lastMsg}</p>
                  <span className="text-[8px] text-zinc-400 mt-2 block">10:42 AM</span>
                </div>
                <div className="bg-black text-white p-4 rounded-2xl rounded-br-none max-w-sm self-end">
                  <p className="text-xs font-bold">Received, checking now.</p>
                  <span className="text-[8px] text-zinc-400 mt-2 block">10:45 AM</span>
                </div>
              </div>
              <div className="p-8 bg-white border-t-2 border-black">
                <div className="relative">
                  <input
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full pl-6 pr-16 py-4 border-2 border-black rounded-full text-xs font-bold focus:outline-none"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white px-5 py-2 rounded-full text-[10px] font-black uppercase">Send</button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-20 gap-6">
              <ChatCircleText size={64} weight="bold" className="text-zinc-200" />
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full pb-24 md:pb-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-10">
            {role === 'admin' ? (
              <AdminManagementView />
            ) : role === 'sme' ? (
              <SmeDashboardView data={data} setActiveTab={setActiveTab} />
            ) : (
              <CreatorDashboardView data={data} onManage={() => setActiveTab('settings')} />
            )}
            {role === 'creator' && hasIntegrations && (
              <ConnectionView data={data} onManage={() => setActiveTab('settings')} />
            )}
          </div>
        )}
        {activeTab === 'analytics' && <AnalyticsView data={data} role={role} onManage={() => setActiveTab('settings')} />}
        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto space-y-12 pb-20">
            <SectionBox title="Profile" color={PALETTE.blue} svg="/undraw_online-resume_z4sp.svg">
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="w-32 h-32 rounded-full border border-black shadow-2xl shadow-black/5 overflow-hidden bg-white flex-shrink-0 group relative">
                  <img src={`https://i.pravatar.cc/400?u=${data?.profile?.id}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex-1 text-center md:text-left space-y-4">
                  <h2 className="text-4xl font-black tracking-tighter text-black font-[family-name:var(--font-bricolage)] leading-none">{data?.profile?.name || 'Creator'}</h2>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-lg">Verified data active.</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
                    <span className="px-5 py-2 bg-white border border-black text-black rounded-full text-[8px] font-bold uppercase tracking-widest shadow-sm">Verified</span>
                  </div>
                </div>
              </div>
            </SectionBox>
          </div>
        )}
        {activeTab === 'notifications' && <NotificationsView data={data} />}
        {activeTab === 'chat' && <ChatView data={data} />}
        {activeTab === 'market' && role !== 'creator' && <MarketView data={data} />}
        {activeTab === 'settings' && <SettingsView data={data} />}
      </div>
    </div>
  );
}

const SettingsView = ({ data }: { data: any }) => {
  const profile = data?.profile;
  const updateProfile = useUpdateCreatorProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    displayName: profile?.displayName || profile?.name || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    industry: profile?.industry || '',
    avatarUrl: profile?.avatarUrl || '',
  });

  useEffect(() => {
    const savedAvatar = localStorage.getItem('user_avatar');
    if (savedAvatar) {
      setFormData(prev => ({ ...prev, avatarUrl: savedAvatar }));
    }
  }, []);

  const handleSave = async () => {
    if (data?.role !== 'creator' && data?.role !== 'admin') {
      toast.error("Profile updates for SMEs are coming soon!");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        ...formData,
        creatorTypes: profile?.creatorTypes || [],
      });
      localStorage.setItem('user_avatar', formData.avatarUrl);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile. " + (error as any)?.message);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, avatarUrl: base64String });
        localStorage.setItem('user_avatar', base64String);
        toast.success('Image uploaded successfully! (Persisted locally)');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-20">
      <SectionBox title="Brand Settings" color={PALETTE.blue} svg="/undraw_cloud-sync_h1ig.svg">
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div 
              className="w-32 h-32 rounded-full border-2 border-black overflow-hidden bg-zinc-50 relative group shadow-xl cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <img
                src={formData.avatarUrl || `https://i.pravatar.cc/400?u=${profile?.id || 'demo'}`}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera size={28} className="text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-black tracking-tight font-[family-name:var(--font-bricolage)]">Identity</h4>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none">Tap image to upload new avatar</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Display Name</label>
              <input
                type="text"
                className="w-full px-6 py-4 border border-black rounded-[2rem] font-bold text-xs focus:bg-zinc-50 outline-none transition-all"
                value={formData.displayName}
                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Industry</label>
              <input
                type="text"
                className="w-full px-6 py-4 border border-black rounded-[2rem] font-bold text-xs focus:bg-zinc-50 outline-none transition-all"
                value={formData.industry}
                onChange={e => setFormData({ ...formData, industry: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Bio / Brand Description</label>
            <textarea
              rows={4}
              className="w-full px-6 py-5 border border-black rounded-[2rem] font-bold text-xs focus:bg-zinc-50 outline-none transition-all resize-none"
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Location</label>
            <input
              type="text"
              className="w-full px-6 py-4 border border-black rounded-[2rem] font-bold text-xs focus:bg-zinc-50 outline-none transition-all"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-black/10 hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Syncing...' : 'Save All Changes'}
          </button>
        </div>
      </SectionBox>

      {data?.role === 'creator' && (
        <div className="space-y-4">
          <h4 className="text-lg font-black tracking-tighter text-black font-[family-name:var(--font-bricolage)] ml-2">Connected Channels</h4>
          <ConnectionView data={data} compact={true} onManage={() => { }} />
        </div>
      )}

      <div className="pt-8">
        <button
          onClick={() => {
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }}
          className="w-full py-5 bg-white border-2 border-black text-black rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] hover:bg-red-50 hover:text-red-600 hover:border-red-600 transition-all shadow-sm"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default function AppDashboard() {
  return (
    <Suspense fallback={<div className="w-full bg-[#FFF9F5]"><DashboardSkeleton /></div>}>
      <DashboardContent />
    </Suspense>
  );
}