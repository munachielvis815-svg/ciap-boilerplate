'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MagnifyingGlass, Star, Users, TrendUp, Briefcase, Bell, GearSix } from '@phosphor-icons/react';
import { useDashboard } from '@/app/(protected)/layout';
import { useDiscoverCreators, useCreatorProfile, useMeProfile, useSmeStats, useScoutCreator, useUnscoutCreator, useScoutedCreators } from '@/lib/api/hooks';
import { getAvatarSrc } from '@/lib/utils/avatars';
import { Image, EnvelopeSimple, Plus, CheckCircle, Trash, UserList } from '@phosphor-icons/react';
import api from '@/lib/api/client';
import SettingsScreen from '../settings';

const growthData = [
  { name: 'WK 01', avgFollowers: 1200000 },
  { name: 'WK 02', avgFollowers: 1350000 },
  { name: 'WK 03', avgFollowers: 1520000 },
  { name: 'WK 04', avgFollowers: 1800000 },
];



// ─── Discovery Screen (main) ──────────────────────────────────────────────────

function DiscoveryScreen() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: profile } = useMeProfile();
  const [search, setSearch] = useState('');
  const { data: discoveryData, isLoading } = useDiscoverCreators(20, 0, search ? { query: search } : {});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!mounted) return null;

  const creators = discoveryData?.creators || [];
  const selected = creators.find(c => c.userId === selectedId) || null;
  const { data: fullProfile } = useCreatorProfile(selectedId || '', !!selectedId);

  const { data: stats } = useSmeStats();
  const { data: scoutedList, refetch: refetchScouted } = useScoutedCreators();
  const scoutMutation = useScoutCreator();
  const unscoutMutation = useUnscoutCreator();

  const toggleShortlist = async (id: string) => {
    const isScouted = scoutedList?.some((c: any) => String(c.userId) === id);
    if (isScouted) {
      await unscoutMutation.mutateAsync(id);
    } else {
      await scoutMutation.mutateAsync(id);
    }
    refetchScouted();
  };

  const isShortlisted = (id: string) => scoutedList?.some((c: any) => String(c.userId) === id);

  const dynamicKpis = [
    { label: 'Total Reach', value: stats?.totalReach > 1000000 ? `${(stats.totalReach / 1000000).toFixed(1)}M` : `${(stats?.totalReach / 1000).toFixed(0)}K`, trend: 'LIVE', up: true, bg: '#EFF4FF' },
    { label: 'Avg Influence Score', value: (stats?.avgInfluenceScore || 0).toFixed(1), trend: 'AVG', up: true, bg: '#E5EEFF' },
    { label: 'Creators Discovery', value: stats?.totalCreators?.toLocaleString() || '0', trend: 'INDEXED', up: true, bg: '#EFF4FF' },
    { label: 'Discovery Coverage', value: `${stats?.discoveryCoverage || 0}%`, trend: 'SYNCED', up: true, bg: '#D3E4FE' },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#0B1C30] tracking-tight" style={{ fontFamily: "'Space Grotesk'" }}>
          Creator Discovery
        </h1>
        <p className="text-[#3C4A3D] mt-1">Scout and evaluate high-potential creators across platforms.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {dynamicKpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-2xl p-6 h-[148px] relative flex flex-col justify-between border border-black/5 shadow-sm"
            style={{ background: k.bg }}
          >
            <p className="text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest">{k.label}</p>
            <p className="text-2xl font-bold text-[#0B1C30] leading-none" style={{ fontFamily: "'Space Grotesk'" }}>
              {k.value}
            </p>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-[#006D32]" />
               <p className="text-[10px] font-bold text-[#006D32] uppercase tracking-tighter">{k.trend}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Growth Chart */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <h2 className="font-bold text-[#0B1C30] text-lg mb-6" style={{ fontFamily: "'Space Grotesk'" }}>
          Scouted Creators — Average Growth Trend
        </h2>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} tickFormatter={v => `${(v/1e6).toFixed(1)}M`} />
              <Tooltip formatter={(v: any) => `${(v/1e6).toFixed(2)}M followers`} />
              <Line type="monotone" dataKey="avgFollowers" stroke="#006D32" strokeWidth={3} dot={{ fill: '#006D32', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Creators Grid + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search creators by name or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#EFF4FF] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006D32]/20"
            />
          </div>
          
          {isLoading ? (
            <div className="py-20 text-center text-[#6B7280]">Searching for creators...</div>
          ) : creators.length === 0 ? (
            <div className="py-20 text-center text-[#6B7280]">No creators found matching your criteria.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {creators.map(c => (
                <motion.div
                  key={c.userId} whileHover={{ y: -3 }} onClick={() => setSelectedId(c.userId)}
                  className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-shadow ${
                    selectedId === c.userId ? 'border-[#006D32] shadow-md' : 'border-[#E5E7EB] hover:border-[#006D32]/40'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#EFF4FF]">
                       <img src={getAvatarSrc(c.userId, 'creator', c.displayName)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-[#0B1C30]">{c.displayName}</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold text-[#6B7280] bg-[#F3F4F6] px-1.5 py-0.5 rounded uppercase">{c.category || 'Creator'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#F3F4F6]">
                    <div>
                      <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide">Reach</p>
                      <p className="font-bold text-[#0B1C30] mt-0.5">{(c.audienceSize / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide">Platform</p>
                      <p className="font-bold text-[#0B1C30] mt-0.5">YT</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide">Score</p>
                      <p className="font-bold text-[#0B1C30] mt-0.5">{c.influenceScore || '--'}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#F3F4F6]">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#6B7280] font-semibold">Influence Score</span>
                      <span className="font-bold text-[#006D32]">{c.influenceScore || 0}/100</span>
                    </div>
                    <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${c.influenceScore || 0}%` }} transition={{ duration: 1 }}
                        className="h-full bg-[#006D32] rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div>
          {selected ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-6 sticky top-6 space-y-6 shadow-sm border border-[#E2E8F0]"
            >
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#EFF4FF] border-2 border-white shadow-sm">
                   <img src={getAvatarSrc(selected.userId, 'creator', selected.displayName)} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>{selected.displayName}</h2>
                  <p className="text-sm text-[#6B7280] font-medium">{selected.category || 'Creative Creator'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#6B7280] font-bold uppercase tracking-wider">Bio</p>
                  <p className="text-sm text-[#3C4A3D] mt-1 leading-relaxed">{selected.bio || 'This creator hasn\'t added a bio yet.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#6B7280] font-bold uppercase tracking-wider">Reach</p>
                    <p className="text-lg font-bold text-[#0B1C30]">{(selected.audienceSize / 1000).toFixed(1)}K</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280] font-bold uppercase tracking-wider">Score</p>
                    <p className="text-lg font-bold text-[#006D32]">{selected.influenceScore || '--'}</p>
                  </div>
                </div>

                {fullProfile?.profile.contactEmail && (
                  <div>
                    <p className="text-xs text-[#6B7280] font-bold uppercase tracking-wider">Contact Details</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-[#0B1C30] font-bold">
                      <EnvelopeSimple size={16} />
                      {fullProfile.profile.contactEmail}
                    </div>
                  </div>
                )}

                {fullProfile?.library && fullProfile.library.length > 0 && (
                  <div>
                    <p className="text-xs text-[#6B7280] font-bold uppercase tracking-wider mb-2">Content Library</p>
                    <div className="grid grid-cols-3 gap-2">
                      {fullProfile.library.map(item => (
                        <div key={item.id} className="aspect-square rounded-lg bg-[#EFF4FF] overflow-hidden border border-black/5 hover:border-[#006D32]/40 transition-colors">
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#6B7280]">
                              <Image size={20} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => toggleShortlist(selected.userId)}
                className={`w-full py-3 font-bold rounded-xl transition text-sm flex items-center justify-center gap-2 ${
                  isShortlisted(selected.userId) 
                    ? 'bg-[#F0FDF4] text-[#006D32] border border-[#006D32]/20' 
                    : 'bg-[#006D32] text-white hover:bg-[#005227]'
                }`}
              >
                {isShortlisted(selected.userId) ? (
                  <><CheckCircle size={18} weight="fill" /> Shortlisted</>
                ) : (
                  <><Plus size={18} weight="bold" /> Add to Campaign</>
                )}
              </button>
            </motion.div>
          ) : (
            <div className="bg-[#EFF4FF] rounded-2xl p-5 text-center py-16">
              <p className="text-xs text-[#6B7280] font-semibold">Select a creator to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Scouted Creators ────────────────────────────────────────────────────────

function ScoutedCreators() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: scouted, isLoading, refetch } = useScoutedCreators();

  const handleUnscout = async (id: string) => {
    await api.delete(`/sme/creators/${id}/scout`);
    refetch();
  };

  if (!mounted) return null;
  if (isLoading) return <div className="py-20 text-center text-[#6B7280]">Loading your scouted team...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>Scouted Team</h1>
        <p className="text-[#3C4A3D] mt-1">Manage and evaluate your shortlisted creator partners.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scouted?.map((c: any) => (
          <div key={c.userId} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-all relative group">
            <button 
              onClick={() => handleUnscout(c.userId)}
              className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash size={18} />
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#EFF4FF] border border-[#E2E8F0]">
                 <img src={getAvatarSrc(c.userId, 'creator', c.displayName)} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1C30]">{c.displayName}</h3>
                <p className="text-xs text-[#6B7280] font-bold uppercase tracking-wider">{c.status || 'SCOUTED'}</p>
              </div>
            </div>
            <div className="space-y-4">
               <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#6B7280]">Potential Reach</span>
                  <span className="text-[#0B1C30]">{(c.audienceSize / 1000).toFixed(0)}K</span>
               </div>
               <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#6B7280]">Influence Score</span>
                  <span className="text-[#006D32]">{c.influenceScore || '--'}</span>
               </div>
               <button className="w-full py-2.5 bg-[#F8F9FF] text-[#006D32] font-bold rounded-xl text-xs hover:bg-[#EFF4FF] transition border border-[#E2E8F0]">
                  Deep Analytics
               </button>
            </div>
          </div>
        ))}
        {(!scouted || scouted.length === 0) && (
          <div className="col-span-full py-20 text-center bg-[#F8F9FF] rounded-3xl border-2 border-dashed border-[#E2E8F0]">
             <UserList size={48} className="mx-auto mb-4 text-[#D3E4FE]" />
             <p className="text-sm font-bold text-[#6B7280]">Your shortlist is empty.</p>
             <p className="text-xs text-[#9CA3AF] mt-1">Add creators from the Discovery engine to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Market Insights ─────────────────────────────────────────────────────────

function MarketInsights() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>Market Insights</h1>
        <p className="text-[#3C4A3D] mt-1">Global creator ecosystem performance data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-[#F1F5F9] shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-[#0B1C30]">Cross-Platform Engagement Pulse</h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2 text-[10px] font-bold">
                    <div className="w-2 h-2 rounded-full bg-[#006D32]" />
                    <span>YOUTUBE</span>
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-bold">
                    <div className="w-2 h-2 rounded-full bg-[#6B61F0]" />
                    <span>TIKTOK</span>
                 </div>
              </div>
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={growthData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Line type="natural" dataKey="avgFollowers" stroke="#006D32" strokeWidth={4} dot={false} />
                    <Line type="natural" dataKey="avgFollowers" stroke="#6B61F0" strokeWidth={4} strokeDasharray="8 5" dot={false} />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-[#0B1C30] rounded-3xl p-8 text-white">
              <p className="text-[10px] font-bold opacity-60 tracking-widest uppercase">Global Top Category</p>
              <h4 className="text-2xl font-bold mt-2" style={{ fontFamily: "'Space Grotesk'" }}>Education & Tech</h4>
              <p className="text-sm opacity-80 mt-4 leading-relaxed">Highly engaged 18-24 demographic driving 42% of platform conversions this quarter.</p>
           </div>
           <div className="bg-white rounded-3xl p-8 border border-[#F1F5F9] shadow-sm">
              <h4 className="font-bold text-[#0B1C30] mb-4">Market Share</h4>
              <div className="space-y-4">
                 {[
                   { label: 'YouTube', val: 58, color: '#FF0000' },
                   { label: 'TikTok', val: 24, color: '#000000' },
                   { label: 'Instagram', val: 18, color: '#E4405F' }
                 ].map(p => (
                   <div key={p.label} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                         <span>{p.label}</span>
                         <span>{p.val}%</span>
                      </div>
                      <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                         <div className="h-full rounded-full" style={{ width: `${p.val}%`, backgroundColor: p.color }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// ─── Campaign Manager ────────────────────────────────────────────────────────

function CampaignManager() {
  const campaigns = [
    { title: 'Summer Tech Review', creator: 'TechMaster Pro', status: 'Active', progress: 65, reach: '1.2M' },
    { title: 'Global Launch 2024', creator: 'Creative Pulse', status: 'Review', progress: 90, reach: '850K' },
    { title: 'Omniview Feature Drop', creator: 'Dev Insights', status: 'Draft', progress: 15, reach: '340K' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>Campaign Manager</h1>
        <p className="text-[#3C4A3D] mt-1">Track performance and milestones of active creator collaborations.</p>
      </div>

      <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
         <table className="w-full text-left">
            <thead>
               <tr className="bg-[#F8F9FF] border-b border-[#F1F5F9]">
                  <th className="p-6 text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest">CAMPAIGN TITLE</th>
                  <th className="p-6 text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest">PARTNER</th>
                  <th className="p-6 text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest">MILESTONE</th>
                  <th className="p-6 text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest">REACH</th>
                  <th className="p-6 text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest">STATUS</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
               {campaigns.map((c, i) => (
                  <tr key={i} className="hover:bg-[#FBFBFF] transition-colors">
                     <td className="p-6">
                        <p className="font-bold text-[#0B1C30] text-sm">{c.title}</p>
                        <p className="text-xs text-[#6B7280] mt-1">ID: #OMN-2024-{i}</p>
                     </td>
                     <td className="p-6 font-medium text-sm text-[#0B1C30]">{c.creator}</td>
                     <td className="p-6 w-[200px]">
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                           <span>Progress</span>
                           <span>{c.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-[#EFF4FF] rounded-full overflow-hidden">
                           <div className="h-full bg-[#006D32] rounded-full" style={{ width: `${c.progress}%` }} />
                        </div>
                     </td>
                     <td className="p-6 font-bold text-sm text-[#0B1C30]">{c.reach}</td>
                     <td className="p-6">
                        <span className={`
                          px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${c.status === 'Active' ? 'bg-[#F0FDF4] text-[#006D32]' : 
                            c.status === 'Review' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}
                        `}>
                           {c.status}
                        </span>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}

// ─── SME Dashboard ────────────────────────────────────────────────────────────
 
export default function SMEDashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { activeTab } = useDashboard();

  if (!mounted) return <div className="h-screen bg-[#F8F9FF]" />;
 
  return (
    <div className="pb-20">
      {activeTab === 'Dashboard' && <DiscoveryScreen />}
      {activeTab === 'Scouted'   && <ScoutedCreators />}
      {activeTab === 'Insights'  && <MarketInsights />}
      {activeTab === 'Campaigns' && <CampaignManager />}
      {activeTab === 'Alerts'    && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
           <Bell size={48} className="text-[#D3E4FE] mb-4" />
           <h2 className="text-xl font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>No Active Alerts</h2>
           <p className="text-[#6B7280] mt-2">You will be notified when scouted creators reach key milestones.</p>
        </div>
      )}
      {activeTab === 'Settings'  && <SettingsScreen />}
    </div>
  );
}
