'use client';

import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  UserCircle, 
  Gear,
  MagnifyingGlass,
  UserList,
  TrendUp,
  X,
  Plus,
  DownloadSimple,
  Globe,
  PencilSimple,
  Prohibit,
  CheckCircle
} from '@phosphor-icons/react';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useDashboard } from '@/app/(protected)/layout';
import { useAdminUsers, useApiHealth, useDatabaseHealth, useCacheHealth, useReadinessHealth, useAdminCreateUser, useAdminUpdateUser, useAuditLogs, useAdminStats, useAdminGrowth, useMeProfile } from '@/lib/api/hooks';
import { useAuthStore } from '@/lib/auth/store';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import SettingsScreen from '../settings';
import NotificationsScreen from '../notifications';
import { getAvatarSrc } from '@/lib/utils/avatars';

// Dynamic import for ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const GEO_URL = "https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json";

// ─── User Modal ──────────────────────────────────────────────────────────────

function UserModal({ isOpen, onClose, onSuccess, user = null, roleDefault = 'creator' }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, user?: any, roleDefault?: string }) {
  const createUser = useAdminCreateUser();
  const updateUser = useAdminUpdateUser();
  const [formData, setFormData] = useState({ name: '', email: '', role: roleDefault, password: 'Password123!' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ 
        name: user.name || '', 
        email: user.email || '', 
        role: user.role || roleDefault,
        password: '' // Don't show password on edit
      });
    } else {
      setFormData({ name: '', email: '', role: roleDefault, password: 'Password123!' });
    }
  }, [user, isOpen, roleDefault]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (user) {
        await updateUser.mutateAsync({ userId: user.id, data: { name: formData.name, email: formData.email, role: formData.role } });
      } else {
        await createUser.mutateAsync(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert(`Failed to ${user ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B1C30]/40 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-[#F1F5F9]">
        <div className="p-6 border-b border-[#F1F5F9] flex justify-between items-center bg-[#FBFBFF]">
           <h3 className="font-bold text-[#0B1C30] text-lg tracking-tight" style={{ fontFamily: "'Space Grotesk'" }}>{user ? 'Edit' : 'Add New'} {formData.role === 'creator' ? 'Creator' : 'User'}</h3>
           <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] rounded-xl transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">Full Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-[#F8F9FF] border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006D32]/10 transition-all placeholder:text-gray-300" placeholder="e.g. John Doe" />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">Email Address</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-[#F8F9FF] border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006D32]/10 transition-all placeholder:text-gray-300" placeholder="john@example.com" />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">Account Role</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: formData.role})} className="w-full px-4 py-3 bg-[#F8F9FF] border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006D32]/10 transition-all appearance-none cursor-pointer">
                 <option value="creator">Creator</option>
                 <option value="sme">SME Partner</option>
                 <option value="admin">Administrator</option>
              </select>
           </div>
           {!user && (
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">Default Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 bg-[#F8F9FF] border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006D32]/10 transition-all" />
             </div>
           )}
           <div className="pt-2">
              <button disabled={loading} type="submit" className="w-full py-3.5 bg-[#0B1C30] text-white font-bold rounded-2xl shadow-xl shadow-[#0B1C30]/10 hover:bg-[#1a2e44] active:scale-[0.98] transition-all disabled:opacity-50">
                {loading ? 'Processing...' : (user ? 'Update Profile' : 'Create Account')}
              </button>
           </div>
        </form>
      </motion.div>
    </div>
  );
}


// ─── Health Monitor Component ────────────────────────────────────────────────

function HealthMonitor() {
  const apiHealth = useApiHealth();
  const dbHealth = useDatabaseHealth();
  const cacheHealth = useCacheHealth();
  const readyHealth = useReadinessHealth();

  const services = [
    { name: 'Core API',     status: apiHealth.data?.status === 'ok',    loading: apiHealth.isLoading },
    { name: 'Database',     status: dbHealth.data?.status === 'ok',     loading: dbHealth.isLoading },
    { name: 'Redis Cache',  status: cacheHealth.data?.status === 'ok',  loading: cacheHealth.isLoading },
    { name: 'Ingestion',    status: readyHealth.data?.ready === true,  loading: readyHealth.isLoading },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F1F5F9]">
      <h2 className="font-bold text-[#0B1C30] text-base mb-5 flex items-center gap-2 tracking-tight" style={{ fontFamily: "'Space Grotesk'" }}>
        <ShieldCheck size={20} className="text-[#006D32]" />
        System Health
      </h2>
      <div className="space-y-4">
        {services.map((s, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#6B7280]">{s.name}</span>
            <div className="flex items-center gap-2">
              {s.loading ? (
                <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse" />
              ) : (
                <div className={`w-2 h-2 rounded-full ${s.status ? 'bg-[#00D166]' : 'bg-[#EF4444]'}`} />
              )}
              <span className={`text-[10px] font-bold uppercase tracking-wider ${s.status ? 'text-[#006D32]' : 'text-red-600'}`}>
                {s.loading ? 'CHECKING...' : s.status ? 'OPERATIONAL' : 'DEGRADED'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sub-screens ─────────────────────────────────────────────────────────────

function OverviewScreen() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const formatViews = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toString();
  };

  if (!mounted) return null;

  const { data: usersData, isLoading } = useAdminUsers();
  const { data: stats } = useAdminStats();
  const { setActiveTab } = useDashboard();
  const users = usersData || [];
  const displayUsers = users.slice(0, 5);

  const kpis = [
    { label: 'Total Users', value: stats?.totalUsers?.toLocaleString() || (isLoading ? '...' : users.length.toLocaleString()), trend: 'ACTIVE', up: true, bg: '#EFF4FF', accent: '#006D32' },
    { label: 'Active Creators', value: stats?.creatorsCount?.toLocaleString() || (isLoading ? '...' : users.filter(u => u.role === 'creator').length.toLocaleString()), trend: 'VERIFIED', up: true, bg: '#E5EEFF', accent: '#0059BB' },
    { label: 'SME Partners', value: stats?.smeCount?.toLocaleString() || (isLoading ? '...' : users.filter(u => u.role === 'sme').length.toLocaleString()), trend: 'ONBOARDED', up: true, bg: '#EFF4FF', accent: '#006D32' },
    { label: 'Platform Reach', value: formatViews(stats?.totalViews || 0), trend: 'LIVE', up: true, bg: '#D3E4FE', accent: '#0B1C30' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1C30] tracking-tight" style={{ fontFamily: "'Space Grotesk'" }}>Admin Overview</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Real-time platform intelligence and operational health.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-2xl p-6 h-[148px] relative flex flex-col justify-between shadow-sm border border-black/5" style={{ background: k.bg }}>
            <p className="text-xs font-bold text-[#3C4A3D] uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk'" }}>{k.label}</p>
            <p className="text-2xl font-bold text-[#0B1C30] tracking-tighter" style={{ fontFamily: "'Space Grotesk'" }}>{k.value}</p>
            <p className="text-xs font-bold" style={{ color: k.accent }}>{k.up ? '↑' : '↓'} {k.trend}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-[#F1F5F9]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#0B1C30] text-lg tracking-tight" style={{ fontFamily: "'Space Grotesk'" }}>Recent User Registrations</h2>
            <button 
              onClick={() => setActiveTab('Users')}
              className="text-sm text-[#006D32] font-semibold hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <div className="py-10 text-center text-[#6B7280]">Loading users...</div>
            ) : displayUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-4 py-2 border-b border-[#F3F4F6] last:border-none">
                <div className="w-9 h-9 rounded-lg bg-[#EFF4FF] flex items-center justify-center flex-shrink-0">
                  <UserCircle size={22} className="text-[#006D32]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#0B1C30] truncate">{u.name}</p>
                  <p className="text-xs text-[#6B7280] truncate">{u.email}</p>
                </div>
                <span className="text-xs font-semibold text-[#6B7280] capitalize hidden sm:block">{u.role}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.isActive ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-red-50 text-red-700'}`}>
                  {u.isActive ? 'active' : 'suspended'}
                </span>
                <span className="text-xs text-[#9CA3AF] hidden md:block">{new Date(u.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </motion.div>
        <div className="space-y-6">
           <HealthMonitor />
        </div>
      </div>
    </div>
  );
}

function UsersScreen() {
  const { data: users, isLoading, refetch } = useAdminUsers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1C30] tracking-tight" style={{ fontFamily: "'Space Grotesk'" }}>User Management</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Control platform access and permissions.</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="bg-[#0B1C30] text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all hover:bg-[#1a2e44]"
        >
          Add New User
        </button>
      </div>

      <UserModal isOpen={isModalOpen} onClose={handleClose} onSuccess={refetch} user={editingUser} roleDefault="creator" />

      <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#F8F9FF] border-b border-[#F1F5F9]">
              <th className="p-6 text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk'" }}>USER</th>
              <th className="p-6 text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk'" }}>ROLE</th>
              <th className="p-6 text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk'" }}>TENANT ID</th>
              <th className="p-6 text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk'" }}>JOIN DATE</th>
              <th className="p-6 text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk'" }}>STATUS</th>
              <th className="p-6 text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest text-right" style={{ fontFamily: "'Space Grotesk'" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="h-16 bg-white" />
                </tr>
              ))
            ) : users?.map((u) => (
              <tr key={u.id} className="hover:bg-[#FBFBFF] transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#EFF4FF] flex items-center justify-center font-bold text-[#006D32] text-xs">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-[#0B1C30] text-sm">{u.name}</p>
                      <p className="text-xs text-[#6B7280]">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'sme' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-6 text-xs text-[#6B7280] font-mono">{String(u.tenantId || '').slice(0, 8)}...</td>
                <td className="p-6 text-sm text-[#0B1C30] font-medium">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="p-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-[#00D166]' : 'bg-red-500'}`} />
                    <span className="text-xs font-bold text-[#0B1C30]">{u.isActive ? 'Active' : 'Locked'}</span>
                  </div>
                </td>
                <td className="p-6 text-right">
                  <button 
                    onClick={() => handleEdit(u)}
                    className="text-[#6B7280] hover:text-[#0B1C30] font-bold text-xs bg-[#F1F5F9] px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreatorsScreen() {
  const { data: users, isLoading, refetch } = useAdminUsers();
  const updateUser = useAdminUpdateUser();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };
  
  const creators = users?.filter(u => u.role === 'creator') || [];
  const filtered = creators.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleStatus(userId: string, currentStatus: boolean) {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} this creator?`)) return;
    
    try {
      await updateUser.mutateAsync({ userId, data: { isActive: !currentStatus } });
      refetch();
    } catch (err) {
      alert('Failed to update status');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1C30] tracking-tight" style={{ fontFamily: "'Space Grotesk'" }}>Creator Management</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Audit, verify, and moderate platform creators.</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
              <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input 
                type="text" 
                placeholder="Search creators..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-[#F1F5F9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006D32]/10 w-[240px]"
              />
           </div>
           <button 
             onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
             className="bg-[#006D32] text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-[#00592b] transition-colors"
           >
             Add Creator
           </button>
        </div>
      </div>

      <UserModal isOpen={isModalOpen} onClose={handleClose} onSuccess={refetch} user={editingUser} roleDefault="creator" />

      <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#F8F9FF] border-b border-[#F1F5F9]">
              <th className="p-6 text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk'" }}>CREATOR</th>
              <th className="p-6 text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk'" }}>TENANT</th>
              <th className="p-6 text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk'" }}>PERFORMANCE</th>
              <th className="p-6 text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk'" }}>STATUS</th>
              <th className="p-6 text-[10px] font-bold text-[#3C4A3D] uppercase tracking-widest text-right" style={{ fontFamily: "'Space Grotesk'" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {isLoading ? (
               Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="h-20 bg-white" />
                </tr>
              ))
            ) : filtered.map((c) => (
              <tr key={c.id} className="hover:bg-[#FBFBFF] transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#EFF4FF]">
                       <img src={getAvatarSrc(c.id, c.role, c.name)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-[#0B1C30] text-sm">{c.name}</p>
                      <p className="text-xs text-[#6B7280]">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                   <p className="text-xs font-mono text-[#6B7280]">{String(c.tenantId || '').slice(0, 8)}...</p>
                </td>
                <td className="p-6">
                   <div className="flex items-center gap-2">
                      <TrendUp size={16} className={Number(c.influenceScore || 0) > 50 ? "text-[#00D166]" : "text-amber-500"} />
                      <span className="text-xs font-bold text-[#0B1C30]">{c.influenceScore || 0}/100</span>
                   </div>
                </td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.isActive ? 'bg-[#F0FDF4] text-[#006D32]' : 'bg-red-50 text-red-600'}`}>
                    {c.isActive ? 'Verified' : 'Suspended'}
                  </span>
                </td>
                <td className="p-6 text-right">
                  <div className="flex items-center justify-end gap-2 transition-all">
                    <button 
                      onClick={() => handleEdit(c)}
                      className="p-2 bg-[#F8F9FF] text-[#6B7280] hover:text-[#0B1C30] hover:bg-[#EFF4FF] rounded-lg transition-all"
                      title="Edit User"
                    >
                      <PencilSimple size={18} weight="bold" />
                    </button>
                    <button 
                      onClick={() => toggleStatus(c.id, c.isActive)}
                      className={`p-2 rounded-lg transition-all ${c.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-[#F0FDF4] text-[#006D32] hover:bg-[#DCFCE7]'}`}
                      title={c.isActive ? 'Suspend User' : 'Activate User'}
                    >
                      {c.isActive ? <Prohibit size={18} weight="bold" /> : <CheckCircle size={18} weight="bold" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div className="py-20 text-center text-[#6B7280]">
             <UserList size={40} className="mx-auto mb-3 opacity-20" />
             <p className="text-sm font-medium">No creators found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsScreen() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: growthData, isLoading: growthLoading } = useAdminGrowth();
  const [timeframe, setTimeframe] = useState('30D');

  const formatViews = (val: number) => {
    if (val >= 1000000000) return (val / 1000000000).toFixed(2) + 'B';
    if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(2) + 'K';
    return val.toString();
  };

  const chartOptions: any = {
    chart: {
      type: 'candlestick',
      height: 350,
      toolbar: { show: false },
      background: 'transparent',
    },
    xaxis: {
      type: 'datetime',
      labels: { style: { colors: '#9CA3AF', fontSize: '10px', fontWeight: 600 } }
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: { style: { colors: '#9CA3AF', fontSize: '10px', fontWeight: 600 } }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#00D166',
          downward: '#EF4444'
        },
        wick: { useFillColor: true }
      }
    },
    grid: { borderColor: '#F1F5F9' }
  };

  const chartSeries = [
    {
      name: 'Platform Growth',
      data: growthData || []
    }
  ];

  const markers = [
    { markerOffset: -15, name: "New York", coordinates: [-74.006, 40.7128] },
    { markerOffset: -15, name: "London", coordinates: [-0.1278, 51.5074] },
    { markerOffset: -15, name: "Lagos", coordinates: [3.3792, 6.5244] },
    { markerOffset: -15, name: "Tokyo", coordinates: [139.6917, 35.6895] },
    { markerOffset: -15, name: "Sydney", coordinates: [151.2093, -33.8688] },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1C30] tracking-tight" style={{ fontFamily: "'Space Grotesk'" }}>Platform Analytics</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Aggregate metrics across all tenants and creators.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#0B1C30] rounded-xl text-[12px] font-bold hover:bg-gray-50 transition-all shadow-sm">
           <DownloadSimple size={16} />
           Export Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Chart Section */}
         <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-[#F1F5F9] shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="font-bold text-[#0B1C30] text-lg tracking-tight" style={{ fontFamily: "'Space Grotesk'" }}>Platform Growth Analytics</h3>
               <div className="flex gap-2 bg-[#F8F9FF] p-1 rounded-lg">
                  {['7D', '30D', '90D', 'All'].map(t => (
                    <button key={t} onClick={() => setTimeframe(t)} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${t === timeframe ? 'bg-white text-[#006D32] shadow-sm' : 'text-[#6B7280] hover:text-[#0B1C30]'}`}>{t}</button>
                  ))}
               </div>
            </div>
            
            <div className="h-[320px] w-full">
              {growthLoading ? (
                <div className="w-full h-full bg-[#F8F9FF] rounded-2xl animate-pulse flex items-center justify-center">
                   <span className="text-xs font-bold text-[#6B7280] uppercase tracking-widest">Loading Market Data...</span>
                </div>
              ) : (
                <Chart
                  options={chartOptions}
                  series={chartSeries}
                  type="candlestick"
                  height="100%"
                />
              )}
            </div>
         </div>

         {/* Stats Stack */}
         <div className="space-y-6">
            {statsLoading ? (
               Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-[#F1F5F9] animate-pulse" />
              ))
            ) : (
              [
                { label: 'Total Platform Reach', val: formatViews(stats?.totalViews ?? 0), trend: `+${stats?.growthRate || 0}%`, sub: 'vs last month', color: '#006D32' },
                { label: 'System Throughput', val: `${((stats?.totalUsers || 0) * 12.4).toFixed(1)}K`, sub: 'Events / day', trend: 'OPTIMAL', color: '#0059BB' },
                { label: 'Active Content Items', val: stats?.activeCampaigns?.toLocaleString() || '0', trend: `+${Math.floor((stats?.activeCampaigns || 0) * 0.1)}`, sub: 'Real-time count', color: '#0B1C30' }
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-[#F1F5F9] shadow-sm relative overflow-hidden group">
                   <div className="absolute right-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#006D32] transition-all" style={{ backgroundColor: s.color }} />
                   <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">{s.label}</p>
                   <div className="flex items-baseline gap-2">
                      <h4 className="text-2xl font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>{s.val}</h4>
                      <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.trend}</span>
                   </div>
                   <p className="text-[11px] text-[#9CA3AF] mt-0.5">{s.sub}</p>
                </div>
              ))
            )}
         </div>
      </div>

      {/* Live Traffic Section */}
      <div className="bg-white rounded-3xl p-8 border border-[#F1F5F9] shadow-sm">
        <div className="flex items-center justify-between mb-8">
           <div>
             <h3 className="font-bold text-[#0B1C30] text-lg tracking-tight flex items-center gap-2" style={{ fontFamily: "'Space Grotesk'" }}>
               <Globe size={22} className="text-[#006D32]" />
               Live Platform Traffic
             </h3>
             <p className="text-xs text-[#6B7280] mt-1">Real-time engagement distribution across regions.</p>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#00D166] animate-ping" />
                 <span className="text-[10px] font-bold text-[#0B1C30] uppercase tracking-widest">Live: 1,429 Users</span>
              </div>
           </div>
        </div>

        <div className="h-[400px] w-full bg-[#F8F9FF] rounded-3xl overflow-hidden relative border border-[#F1F5F9]">
          <ComposableMap projectionConfig={{ scale: 140 }}>
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#E2E8F0"
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "#CBD5E1", outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>
            {markers.map(({ name, coordinates, markerOffset }) => (
              <Marker key={name} coordinates={coordinates as any}>
                <circle r={4} fill="#006D32" stroke="#fff" strokeWidth={2} />
                <text
                  textAnchor="middle"
                  y={markerOffset}
                  style={{ fontFamily: "Space Grotesk", fill: "#0B1C30", fontSize: "8px", fontWeight: 700 }}
                >
                  {name}
                </text>
              </Marker>
            ))}
          </ComposableMap>
          
          <div className="absolute bottom-6 right-6 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-[#F1F5F9] shadow-lg">
             <h4 className="text-[10px] font-bold text-[#0B1C30] uppercase tracking-widest mb-3">Top Regions</h4>
             <div className="space-y-2">
                {[
                  { region: 'North America', val: 42 },
                  { region: 'Europe', val: 28 },
                  { region: 'Africa', val: 18 }
                ].map(r => (
                  <div key={r.region} className="flex items-center gap-3">
                     <span className="text-[10px] font-bold text-[#6B7280] w-20">{r.region}</span>
                     <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#006D32] rounded-full" style={{ width: `${r.val}%` }} />
                     </div>
                     <span className="text-[10px] font-bold text-[#0B1C30]">{r.val}%</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function AuditScreen() {
  const { data: logs, isLoading } = useAuditLogs(20);
  const { data: stats } = useAdminStats();

  const milestones = [
    { name: 'Initial Admin Deployment', date: '2026-05-10', icon: ShieldCheck, status: 'COMPLETED' },
    { name: `Platform Scale: ${stats?.totalUsers || 0} Users`, date: 'Current', icon: UserList, status: (stats?.totalUsers || 0) > 0 ? 'ACHIEVED' : 'IN_PROGRESS' },
    { name: 'Global Traffic Activation', date: '2026-05-15', icon: Globe, status: 'ACHIEVED' }
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1C30] tracking-tight" style={{ fontFamily: "'Space Grotesk'" }}>Audit & Governance</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Transparent log of every platform event and administrative action.</p>
        </div>
        <div className="flex gap-2">
           <div className="flex -space-x-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-[#D3E4FE] flex items-center justify-center text-[10px] font-bold text-[#006D32]">
                   {['A', 'M', 'S'][i]}
                </div>
              ))}
           </div>
           <div className="pl-3 border-l border-[#E5E7EB] ml-2">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest leading-none mb-1">Active Admins</p>
              <p className="text-xs font-bold text-[#0B1C30]">3 Operators</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Log Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#F1F5F9] flex justify-between items-center bg-[#FBFBFF]">
              <h3 className="font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>System Event Log</h3>
              <button className="px-4 py-1.5 bg-[#EFF4FF] text-[#006D32] rounded-lg text-xs font-bold hover:bg-[#D3E4FE] transition">Download Full Log (CSV)</button>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-6 animate-pulse bg-white h-16" />
                ))
              ) : logs?.length > 0 ? logs.map((log: any, i: number) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-[#FBFBFF] transition-colors group">
                   <div className="flex gap-4 items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00D166]" />
                      <div>
                        <p className="font-bold text-sm text-[#0B1C30] capitalize">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-[#6B7280]">Entity: {log.entity} • ID: {log.entityId}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">{new Date(log.createdAt).toLocaleTimeString()}</p>
                      <p className="text-xs font-medium text-[#6B7280]">{new Date(log.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>
              )) : (
                <div className="py-20 text-center text-[#6B7280]">
                   <ShieldCheck size={40} className="mx-auto mb-3 opacity-10" />
                   <p className="text-sm font-medium">No system events recorded yet.</p>
                   <p className="text-[10px] uppercase tracking-widest font-bold mt-1 text-[#9CA3AF]">Waiting for platform activity...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Milestones Sidebar */}
        <div className="space-y-6">
           <div className="bg-[#0B1C30] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk'" }}>
                 <TrendUp size={20} className="text-[#00D166]" />
                 Platform Milestones
              </h3>
              <div className="space-y-6">
                 {milestones.map((m, i) => (
                   <div key={i} className="flex gap-4 relative">
                      {i < milestones.length - 1 && <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2px] bg-white/10" />}
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${m.status === 'ACHIEVED' || m.status === 'COMPLETED' ? 'bg-[#00D166]' : 'bg-white/10'}`}>
                         <m.icon size={14} className={m.status === 'ACHIEVED' || m.status === 'COMPLETED' ? 'text-[#0B1C30]' : 'text-white/40'} />
                      </div>
                      <div>
                         <p className="text-xs font-bold leading-tight">{m.name}</p>
                         <p className="text-[10px] text-white/50 mt-1 uppercase tracking-widest font-bold">{m.date} • {m.status.replace('_', ' ')}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-white rounded-3xl p-6 border border-[#F1F5F9] shadow-sm">
              <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-4">Security Overview</h4>
              <div className="space-y-4">
                 {[
                   { label: 'Admin Access', val: 'Authorized', color: '#006D32' },
                   { label: 'DB Connection', val: 'Live', color: '#006D32' },
                   { label: 'Audit Guard', val: 'Active', color: '#006D32' }
                 ].map(s => (
                   <div key={s.label} className="flex justify-between items-center">
                      <span className="text-xs font-medium text-[#6B7280]">{s.label}</span>
                      <span className="text-xs font-bold" style={{ color: s.color }}>{s.val}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore();
  const { data: profile, isLoading: profileLoading } = useMeProfile();

  useEffect(() => { 
    setMounted(true);
  }, []);

  // Graceful exit if role has changed to non-admin
  if (profile && profile.role !== 'admin' && !profileLoading) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-8 text-center">
         <div className="w-16 h-16 bg-[#F8F9FF] rounded-2xl flex items-center justify-center mb-6 animate-bounce">
            <ShieldCheck size={32} className="text-[#006D32]" />
         </div>
         <h2 className="text-xl font-bold text-[#0B1C30] mb-2" style={{ fontFamily: "'Space Grotesk'" }}>Synchronizing Identity...</h2>
         <p className="text-sm text-[#6B7280] max-w-xs">Your permissions have been updated. Redirecting you to your new dashboard.</p>
         <div className="mt-8 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#006D32] animate-ping" />
            <span className="text-[10px] font-bold text-[#0B1C30] uppercase tracking-widest">Applying Changes</span>
         </div>
         <button 
           onClick={() => window.location.href = '/dashboard'}
           className="mt-10 text-xs font-bold text-[#006D32] hover:underline"
         >
           Click here if not redirected automatically
         </button>
      </div>
    );
  }

  const { activeTab } = useDashboard();

  if (!mounted) return <div className="h-screen bg-[#F8F9FF]" />;

  return (
    <div className="pb-20 px-4 lg:px-0">
      {activeTab === 'Dashboard' && <OverviewScreen />}
      {activeTab === 'Users'     && <UsersScreen />}
      {activeTab === 'Creators'  && <CreatorsScreen />}
      {activeTab === 'Analytics' && <AnalyticsScreen />}
      {activeTab === 'Audit'     && <AuditScreen />}
      {activeTab === 'Settings'  && <SettingsScreen />}
      {activeTab === 'Notifications' && <NotificationsScreen />}
      {['Security'].includes(activeTab) && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
           <Gear size={48} className="text-[#D3E4FE] mb-4" />
           <h2 className="text-xl font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>Modular Section</h2>
           <p className="text-[#6B7280] mt-2">This section is being wired to the new governance API.</p>
        </div>
      )}
    </div>
  );
}
