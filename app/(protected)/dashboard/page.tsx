'use client';
import { useMemo, useState, Suspense, ReactNode } from 'react';
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
  Layout, Briefcase, 
  CheckCircle, ArrowsLeftRight,
  Waveform, Smiley, Target, CurrencyNgn,
  Lightning, TrendUp, Icon,
  Link as LinkIcon, Plus, CircleNotch,
  ChatCircleText, Megaphone
} from '@phosphor-icons/react';
import { useMeProfile } from '@/lib/api/hooks';
import { useAuthStore } from '@/lib/auth/store';
import api from '@/lib/api/client';
import { toast } from 'sonner';

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

// --- Style System ---

const PALETTE = {
  blue: "#E3F2FD",
  pink: "#FFF0F0",
  yellow: "#FFF9DB",
  green: "#EBFBEE",
  purple: "#F3F0FF",
  black: "#111111",
  cream: "#FFF9F5"
};

const MetricCard = ({ title, value, icon: Icon, trend }: MetricCardProps) => (
  <div className="flex flex-col items-center text-center gap-3 group cursor-default p-5 bg-white border border-black/5 rounded-[2.1rem] hover:border-black transition-all shadow-sm">
    <Icon size={24} weight="bold" className="text-black transition-transform group-hover:scale-110" />
    <div>
      <div className="flex items-center justify-center gap-1.5">
        <h4 className="text-xl font-black tracking-tighter text-black leading-none font-[family-name:var(--font-bricolage)]">{value}</h4>
        {trend && <span className="text-[9px] font-black text-green-600">+{trend}</span>}
      </div>
      <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 leading-none mt-1.5">{title}</p>
    </div>
  </div>
);

const SectionBox = ({ title, children, className = "", action, color = "white", svg = "/undraw_document-analysis_3c0y.svg" }: SectionBoxProps) => (
  <div className={`bg-white rounded-[2.1rem] p-7 border border-black shadow-xl shadow-black/5 relative group overflow-hidden ${className}`} style={{ backgroundColor: color }}>
    <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none flex items-center justify-center overflow-hidden">
       <img src={svg} alt="" className="w-[120%] max-none grayscale" />
    </div>
    <div className="flex justify-between items-center mb-6 relative z-10">
      <h3 className="text-xl font-black tracking-tighter text-black font-[family-name:var(--font-bricolage)] leading-none">{title}</h3>
      {action}
    </div>
    <div className="relative z-10 h-full">{children}</div>
  </div>
);

const InfluenceScore = ({ score }: { score: number }) => (
  <div className="relative w-40 h-40 flex items-center justify-center">
    <svg className="w-full h-full -rotate-90">
      <circle cx="80" cy="80" r="70" fill="transparent" stroke="rgba(0,0,0,0.05)" strokeWidth="12" />
      <motion.circle 
          cx="80" cy="80" r="70" fill="transparent" stroke="#000" strokeWidth="12"
          strokeDasharray="440"
          initial={{ strokeDashoffset: 440 }}
          animate={{ strokeDashoffset: 440 - (440 * score) / 100 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
      />
    </svg>
    <div className="absolute flex flex-col items-center">
      <span className="text-4xl font-black text-black font-[family-name:var(--font-bricolage)]">{score}</span>
      <span className="text-[8px] font-bold uppercase tracking-tighter text-zinc-400">Score</span>
    </div>
  </div>
);

const EmptyState = ({ onManage }: { onManage: () => void }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 bg-white border border-black border-dashed rounded-[3rem]">
     <div className="w-64 opacity-20">
        <img src="/undraw_connected-world_anke.svg" alt="" />
     </div>
     <div className="space-y-3 px-6">
        <h2 className="text-3xl font-black tracking-tighter font-[family-name:var(--font-bricolage)] text-black">Connect an account</h2>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">Link your YouTube or Instagram to see your numbers.</p>
     </div>
     <button onClick={onManage} className="flex items-center gap-3 px-10 py-4 bg-black text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-black/30">
        <Plus size={18} weight="bold" />
        Add Account
     </button>
  </div>
);

// --- Sub-Views ---

const MainDashboard = ({ data, role, onManage }: { data: any, role: string, onManage: () => void }) => {
  const isCreator = role === 'creator';
  const hasIntegrations = Object.values(data?.platformStatus || {}).some((p: any) => p.connected);

  const chartData = [
    { name: 'Mon', views: 4200 }, { name: 'Tue', views: 3500 }, { name: 'Wed', views: 6800 },
    { name: 'Thu', views: 2900 }, { name: 'Fri', views: 1800 }, { name: 'Sat', views: 4500 }, { name: 'Sun', views: 5200 },
  ];

  const distributionData = [
    { name: 'YouTube', value: 45 },
    { name: 'TikTok', value: 30 },
    { name: 'Music', value: 15 },
    { name: 'Others', value: 10 },
  ];

  if (!hasIntegrations && isCreator) return <EmptyState onManage={onManage} />;

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 pb-10 border-b border-black/5">
        {isCreator ? (
          <>
            <MetricCard title="Reach" value="1.8M" icon={TrendUp} trend="12%" />
            <MetricCard title="Score" value="84" icon={Lightning} />
            <MetricCard title="Loyalty" value="76%" icon={Users} />
            <MetricCard title="Sales ROI" value="4.2x" icon={CurrencyNgn} />
          </>
        ) : (
          <>
            <MetricCard title="Total Reach" value="24.5M" icon={Globe} trend="8%" />
            <MetricCard title="Avg. Score" value="72" icon={Lightning} />
            <MetricCard title="Creators" value="142" icon={Users} />
            <MetricCard title="Network ROI" value="5.1x" icon={CurrencyNgn} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <SectionBox title={isCreator ? "Activity" : "Market Activity"} className="xl:col-span-8" color={PALETTE.blue} svg="/undraw_speed-test_wdyh.svg">
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="1 1" vertical={true} horizontal={true} stroke="rgba(0,0,0,0.1)" />
                    <XAxis dataKey="name" axisLine={{ stroke: '#000', strokeWidth: 1 }} tickLine={true} tick={{ fontSize: 9, fontWeight: 800, fill: '#000' }} dy={10} />
                    <YAxis axisLine={{ stroke: '#000', strokeWidth: 1 }} tickLine={true} tick={{ fontSize: 9, fontWeight: 800, fill: '#000' }} />
                    <Tooltip contentStyle={{ borderRadius: '0px', border: '1px solid #000', fontWeight: 800, fontSize: '10px', backgroundColor: '#fff' }} />
                    <Area type="stepAfter" dataKey="views" stroke="#000" strokeWidth={1.5} fillOpacity={0.1} fill="#000" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </SectionBox>

        <SectionBox title="Platforms" className="xl:col-span-4" color={PALETTE.pink} svg="/undraw_online-community_3o0l.svg">
           <div className="h-full flex flex-col">
              <div className="h-[140px] mb-6">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData} layout="vertical" margin={{ left: -10, right: 30 }}>
                       <CartesianGrid strokeDasharray="2 2" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                       <XAxis type="number" hide domain={[0, 100]} />
                       <YAxis dataKey="name" type="category" axisLine={{ stroke: '#000', strokeWidth: 1 }} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#111' }} width={70} />
                       <Bar dataKey="value" radius={[0, 0, 0, 0]} barSize={14} fill="#000" stroke="#000" strokeWidth={1}>
                          {distributionData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={index === 0 ? '#000' : 'rgba(0,0,0,0.6)'} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                 {distributionData.map((item) => (
                   <div key={item.name} className="flex items-center justify-between p-2.5 bg-white border border-black rounded-lg hover:bg-zinc-50 transition-all">
                      <span className="text-[9px] font-black text-black uppercase tracking-widest">{item.name}</span>
                      <span className="text-xs font-black text-black">{item.value}%</span>
                   </div>
                 ))}
              </div>
           </div>
        </SectionBox>
      </div>
    </div>
  );
};

const AnalyticsView = ({ data, role, onManage }: { data: any, role: string, onManage: () => void }) => {
  const isCreator = role === 'creator';
  const hasIntegrations = Object.values(data?.platformStatus || {}).some((p: any) => p.connected);

  if (!hasIntegrations && isCreator) return <EmptyState onManage={onManage} />;

  return (
    <div className="space-y-8">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SectionBox title={isCreator ? "Your Score" : "Network Score"} color={PALETTE.green} svg="/undraw_video-influencer_7ak0.svg">
             <div className="flex flex-col md:flex-row items-center justify-around h-[240px]">
                <InfluenceScore score={isCreator ? 88 : 72} />
                <div className="space-y-4">
                   {[
                     { label: 'Loyalty', val: 92 },
                     { label: 'Quality', val: 78 },
                     { label: 'Sales', val: 64 }
                   ].map(m => (
                     <div key={m.label} className="w-32">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest mb-1">
                           <span>{m.label}</span>
                           <span>{m.val}%</span>
                        </div>
                        <div className="h-1 bg-black/5 rounded-full overflow-hidden">
                           <div className="h-full bg-black" style={{ width: `${m.val}%` }} />
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
                      <p className="text-xl font-black">74%</p>
                   </div>
                   <div className="w-px h-12 bg-black/10" />
                   <div className="text-center">
                      <Waveform size={32} weight="bold" className="text-zinc-300 mb-1 mx-auto" />
                      <p className="text-[9px] font-black uppercase">Neutral</p>
                      <p className="text-xl font-black">21%</p>
                   </div>
                </div>
                <div className="flex -space-x-3">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-lg">
                        <img src={`https://i.pravatar.cc/100?u=${i + 100}`} alt="" className="w-full h-full object-cover" />
                     </div>
                   ))}
                   <div className="w-10 h-10 rounded-full bg-black border-2 border-white flex items-center justify-center text-[8px] font-black text-white shadow-lg">+1.2M</div>
                </div>
                <div className="w-full max-w-xs p-4 bg-white border border-black rounded-xl text-[10px] font-bold tracking-tight leading-relaxed italic text-black text-center">
                  {isCreator ? '"Strong resonance with Nigerian youth segments."' : '"High engagement in Lagos and Abuja."'}
                </div>
             </div>
          </SectionBox>
       </div>

       <SectionBox title="Estimates" color={PALETTE.yellow} svg="/undraw_revenue_kv38.svg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[
               { title: 'Reach', val: '250k - 400k', icon: Eye },
               { title: 'Sales', val: '3.8x', icon: Target },
               { title: 'Fit', val: '92%', icon: Star }
             ].map((item, i) => (
               <div key={i} className="p-6 bg-white border border-black rounded-[1.8rem] hover:bg-zinc-50 transition-all group">
                  <div className="flex flex-col gap-3">
                     <item.icon size={18} weight="fill" className="text-black" />
                     <h5 className="text-lg font-black text-black font-[family-name:var(--font-bricolage)]">{item.val}</h5>
                     <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">{item.title}</p>
                  </div>
               </div>
             ))}
          </div>
       </SectionBox>
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

const MarketView = ({ data }: { data: any }) => (
  <div className="space-y-8">
     <div className="flex justify-between items-end">
        <div>
           <h2 className="text-4xl font-black tracking-tighter text-black font-[family-name:var(--font-bricolage)]">Find</h2>
           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Creators in Nigeria</p>
        </div>
        <button className="px-5 py-2 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest">Filter</button>
     </div>

     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="bg-white rounded-[2rem] border border-black overflow-hidden group hover:shadow-2xl transition-all">
             <div className="aspect-[4/5] relative overflow-hidden bg-zinc-50 border-b border-black">
               <img src={`https://i.pravatar.cc/800?u=${i + 800}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               <div className="absolute top-5 right-5 bg-white px-3 py-1.5 rounded-full text-[8px] font-black text-black border border-black shadow-lg">8{i} Score</div>
             </div>
             <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-8 h-8 rounded-full border border-black overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?u=${i + 100}`} alt="" />
                   </div>
                   <div>
                      <h3 className="font-black text-lg text-black tracking-tighter leading-none font-[family-name:var(--font-bricolage)]">Creator {i}</h3>
                      <p className="text-[7px] font-bold uppercase tracking-widest text-zinc-400 mt-1">Lifestyle • Lagos</p>
                   </div>
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-black/5">
                  <div className="space-y-0.5">
                    <p className="text-2xl font-black text-black tracking-tighter">1.2M</p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Reach</p>
                  </div>
                  <button onClick={() => toast.info(`Viewing deep analytics...`)} className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center hover:bg-zinc-800 transition-all active:scale-90">
                    <ArrowsLeftRight size={18} weight="bold" />
                  </button>
                </div>
             </div>
          </div>
        ))}
     </div>
  </div>
);

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

  const role = data?.role || user?.role || 'creator';

  const setActiveTab = (tab: string) => {
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center">
       <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const hasIntegrations = Object.values(data?.platformStatus || {}).some((p: any) => p.connected);

  return (
    <div className="min-h-screen bg-[#FFF9F5] flex font-[family-name:var(--font-bricolage)] text-black overflow-x-hidden relative">
      <main className="flex-1 min-h-screen flex flex-col relative z-10">
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full pb-24 md:pb-8">
           <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                 {activeTab === 'dashboard' && (
                   <div className="space-y-10">
                     <MainDashboard data={data} role={role} onManage={() => setActiveTab('settings')} />
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
                 {activeTab === 'market' && role !== 'creator' && <MarketView data={data} />}
                 {activeTab === 'settings' && (
                   <div className="max-w-3xl mx-auto space-y-8">
                     <SectionBox title="Settings" color={PALETTE.blue} svg="/undraw_cloud-sync_h1ig.svg">
                        <div className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Full Name</label>
                                 <input type="text" defaultValue={data?.profile?.name} className="w-full p-4 bg-white border border-black rounded-2xl font-bold text-xs text-black outline-none focus:bg-zinc-50 transition-all shadow-sm" />
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Email</label>
                                 <input type="email" defaultValue={data?.profile?.email} className="w-full p-4 bg-white border border-black rounded-2xl font-bold text-xs text-black outline-none focus:bg-zinc-50 transition-all shadow-sm" />
                              </div>
                           </div>
                           <button onClick={() => toast.success('Profile updated')} className="w-full py-4 bg-black text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-black/10 transition-all hover:bg-zinc-800 active:scale-[0.98]">Update Profile</button>
                        </div>
                     </SectionBox>

                     {role === 'creator' && (
                        <div className="space-y-4">
                           <h4 className="text-lg font-black tracking-tighter text-black font-[family-name:var(--font-bricolage)] ml-2">Accounts</h4>
                           <ConnectionView data={data} compact={true} onManage={() => setActiveTab('settings')} />
                        </div>
                     )}

                     {/* Sign Out Action */}
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
                 )}
              </motion.div>
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function AppDashboard() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[#FFF9F5] flex items-center justify-center"><div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}