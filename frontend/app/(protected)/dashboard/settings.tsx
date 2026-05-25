'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  YoutubeLogo, 
  TiktokLogo, 
  InstagramLogo, 
  CheckCircle, 
  Warning, 
  ArrowsClockwise, 
  LinkSimple,
  User,
  Lock,
  Image as ImageIcon,
  Check
} from '@phosphor-icons/react';
import {
  useDisconnectYoutubeOauth,
  useMeProfile,
  usePrepareYoutubeOauth,
  useUserPlatformStatus,
} from '@/lib/api/hooks';
import { useAuthStore } from '@/lib/auth/store';
import { getAvatarSrc } from '@/lib/utils/avatars';
import { toast } from 'sonner';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsScreen() {
  const { user } = useAuthStore();
  const { data: profile } = useMeProfile();
  const { data: platforms, isLoading: loadingStatus } = useUserPlatformStatus(profile?.profile?.id);
  const disconnectYoutubeMutation = useDisconnectYoutubeOauth();
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState<'profile' | 'integrations'>('profile');
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState(profile?.profile?.displayName || user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessage = errorParam === 'youtube_connect_failed' ? 'YouTube connection failed.' : decodeURIComponent(errorParam);
      toast.error(errorMessage);
      setActiveTab('integrations');
      
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('error');
      const newUrl = `${pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  // Hook for YouTube OAuth
  const { data: youtubeOauth, isFetching: loadingOauth } = usePrepareYoutubeOauth(isConnecting === 'youtube');

  function handleConnect(platform: string) {
    if (platform === 'youtube') {
      setIsConnecting('youtube');
    }
  }

  async function handleDisconnect(platform: string) {
    if (platform !== 'youtube') {
      toast.info(`${platform} disconnect is not available yet.`);
      return;
    }

    try {
      await disconnectYoutubeMutation.mutateAsync();
      toast.success('YouTube account disconnected.');
    } catch {
      toast.error('Failed to disconnect YouTube account.');
    }
  }

  if (youtubeOauth?.authorizationUrl && isConnecting === 'youtube') {
    window.location.href = youtubeOauth.authorizationUrl;
  }

  const handleSaveProfile = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 1500);
  };

  const platformCards = [
    {
      id: 'youtube',
      name: 'YouTube',
      icon: YoutubeLogo,
      color: '#FF0000',
      connected: platforms?.youtube?.connected,
      date: platforms?.youtube?.connectedAt,
      description: 'Fetch channel metrics, video performance, and audience demographics.',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: InstagramLogo,
      color: '#E4405F',
      connected: platforms?.instagram?.connected,
      date: platforms?.instagram?.connectedAt,
      description: 'Track post engagement, follower growth, and reel insights.',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: TiktokLogo,
      color: '#000000',
      connected: platforms?.tiktok?.connected,
      date: platforms?.tiktok?.connectedAt,
      description: 'Analyze video trends, profile views, and community interactions.',
    },
  ];

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-[#0B1C30] tracking-tight" style={{ fontFamily: "'Space Grotesk'" }}>
          Settings
        </h1>
        <p className="text-[#3C4A3D] mt-1">Manage your account, security, and external platform connections.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#EFF4FF] p-1 rounded-xl w-fit border border-[#D3E4FE]">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white text-[#006D32] shadow-sm' : 'text-[#6B7280] hover:text-[#0B1C30]'}`}
        >
          Account Profile
        </button>
        {user?.role === 'creator' && (
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'integrations' ? 'bg-white text-[#006D32] shadow-sm' : 'text-[#6B7280] hover:text-[#0B1C30]'}`}
          >
            Integrations
          </button>
        )}
      </div>

      {activeTab === 'profile' ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Profile Section */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-[#F3F4F6] space-y-8">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-[#EFF4FF] shadow-md bg-[#D3E4FE]">
                  <img 
                    src={profile?.profile?.avatarUrl || getAvatarSrc(user?.id || 'guest', user?.role || 'creator')} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button 
                  onClick={() => toast.info('Avatar upload functionality coming soon!')}
                  className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-[#F3F4F6] text-[#006D32] hover:bg-[#EFF4FF] transition-colors"
                >
                  <ImageIcon size={18} weight="bold" />
                </button>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B1C30] leading-tight" style={{ fontFamily: "'Space Grotesk'" }}>Personal Identity</h3>
                <p className="text-sm text-[#6B7280] mt-1">This is how you appear to others on the platform.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#3C4A3D] tracking-[1px] uppercase opacity-60 ml-1">DISPLAY NAME</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3C4A3D]/40" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 h-12 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006D32]/20 focus:border-[#006D32] transition-all text-sm font-medium"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
              <div className="space-y-2 opacity-50 cursor-not-allowed">
                <label className="text-[10px] font-bold text-[#3C4A3D] tracking-[1px] uppercase opacity-60 ml-1">EMAIL ADDRESS (LOCKED)</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3C4A3D]/40" />
                  <input 
                    type="email" 
                    value={user?.email || ''} 
                    disabled
                    className="w-full pl-12 pr-4 h-12 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F1F5F9] flex justify-end">
              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className={`
                  px-8 h-12 rounded-xl font-bold text-sm transition-all flex items-center gap-2
                  ${savedSuccess ? 'bg-[#00D166] text-white' : 'bg-[#006D32] text-white hover:bg-[#005227] shadow-lg shadow-green-900/10'}
                `}
              >
                {isSaving ? (
                  <ArrowsClockwise size={18} className="animate-spin" />
                ) : savedSuccess ? (
                  <Check size={18} weight="bold" />
                ) : null}
                {isSaving ? 'Saving Changes...' : savedSuccess ? 'Saved!' : 'Update Profile'}
              </button>
            </div>
          </section>

          {/* Password Section */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-[#F3F4F6] space-y-6">
            <h3 className="text-xl font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>Security & Access</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#3C4A3D] tracking-[1px] uppercase opacity-60 ml-1">CURRENT PASSWORD</label>
                  <input 
                    type="password" 
                    className="w-full px-4 h-12 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006D32]/20 focus:border-[#006D32] transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#3C4A3D] tracking-[1px] uppercase opacity-60 ml-1">NEW PASSWORD</label>
                  <input 
                    type="password" 
                    className="w-full px-4 h-12 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006D32]/20 focus:border-[#006D32] transition-all text-sm"
                    placeholder="Enter new password"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <Link href="/forgot-password" className="text-[12px] font-bold text-[#006D32] hover:underline">
                  Forgot password? Recover it here.
                </Link>
              </div>
            </div>
            <div className="pt-4 border-t border-[#F1F5F9] flex justify-end">
              <button className="px-8 h-12 bg-[#0B1C30] text-white rounded-xl font-bold text-sm hover:bg-[#1a2e45] transition-all shadow-md">
                Change Password
              </button>
            </div>
          </section>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Integrations Section */}
          <div className="grid grid-cols-1 gap-4">
            {platformCards.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.id} className="bg-white rounded-3xl p-6 shadow-sm border border-[#F3F4F6] flex items-center justify-between group hover:border-[#D3E4FE] transition-colors">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105" style={{ backgroundColor: p.color + '10' }}>
                      <Icon size={32} style={{ color: p.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0B1C30]">{p.name}</h3>
                      <p className="text-sm text-[#6B7280] mt-1 max-w-sm">{p.description}</p>
                      {p.connected && (
                        <p className="text-xs text-[#006D32] font-semibold mt-2 flex items-center gap-1">
                          <CheckCircle size={14} weight="fill" />
                          Connected on {new Date(p.date!).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {p.connected ? (
                      <button
                        onClick={() => handleDisconnect(p.id)}
                        disabled={disconnectYoutubeMutation.isPending}
                        className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition disabled:opacity-60"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        disabled={isConnecting === p.id || loadingOauth}
                        onClick={() => handleConnect(p.id)}
                        className="px-6 py-2.5 bg-[#006D32] text-white font-bold rounded-xl hover:bg-[#005227] transition text-sm flex items-center gap-2"
                      >
                        {isConnecting === p.id ? (
                          <>
                            <ArrowsClockwise size={16} className="animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <LinkSimple size={16} weight="bold" />
                            Connect {p.name}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <section className="bg-[#EFF4FF] rounded-2xl p-8 space-y-4 border border-[#D3E4FE]">
            <div className="flex items-center gap-3">
              <Warning size={24} className="text-[#0B1C30]" />
              <h2 className="text-lg font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>Data Privacy Note</h2>
            </div>
            <p className="text-sm text-[#3C4A3D] leading-relaxed">
              Omniview only requests <strong>read-only</strong> access to your analytics. We never post on your behalf or access private messages. 
              Your data is encrypted and used solely to generate the insights you see on this dashboard.
            </p>
          </section>
        </motion.div>
      )}
    </div>
  );
}
