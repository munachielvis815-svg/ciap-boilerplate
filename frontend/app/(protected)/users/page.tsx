'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth/store';
import { useAdminUsers, useMeProfile, useUserPlatformStatus } from '@/lib/api/hooks';
import { formatNumber } from '@/lib/utils';

export default function UsersPage() {
  const { user } = useAuthStore();
  const me = useMeProfile();
  const profile = me.data?.profile;
  const platformStatus = useUserPlatformStatus(profile?.id, Boolean(profile?.id));
  const adminUsers = useAdminUsers(user?.role === 'admin');
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#E5E5E5] p-4 md:p-6 pt-24 md:pt-32 flex flex-col md:flex-row gap-6 items-start font-sans w-full">
      <div className="bg-white w-full md:flex-1 min-h-200 rounded-[3rem] p-6 md:p-10 flex flex-col relative overflow-hidden border-2 border-black">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-[44px] md:text-[64px] leading-[0.9] font-bold tracking-tight text-[#111] w-2/3 font-(family-name:--font-bricolage)">
              User<br />Network
            </h1>
            <p className="text-[#666] font-bold text-sm md:text-base mt-4">Current user profile plus tenant-wide directory when admin access is available.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard" className="rounded-full border-2 border-black bg-black px-5 py-3 text-sm font-black text-white">Dashboard</Link>
            <Link href="/endpoints" className="rounded-full border-2 border-black bg-white px-5 py-3 text-sm font-black text-[#111]">API explorer</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="rounded-4xl border-2 border-black bg-pastel-blue p-5">
            <p className="text-xs uppercase tracking-[0.35em] font-black text-[#111]/70">Backend user</p>
            <p className="mt-3 text-2xl font-black text-[#111]">{profile?.displayName || profile?.name || user?.name || '—'}</p>
            <p className="text-sm font-bold text-[#111]/70">{profile?.email || user?.email || '—'}</p>
          </div>
          <div className="rounded-4xl border-2 border-black bg-pastel-pink p-5">
            <p className="text-xs uppercase tracking-[0.35em] font-black text-[#111]/70">Role</p>
            <p className="mt-3 text-2xl font-black capitalize text-[#111]">{profile?.role || user?.role || '—'}</p>
            <p className="text-sm font-bold text-[#111]/70">Tenant {profile?.tenantId || user?.tenantId || '—'}</p>
          </div>
          <div className="rounded-4xl border-2 border-black bg-[#FDE047] p-5">
            <p className="text-xs uppercase tracking-[0.35em] font-black text-[#111]/70">Audience</p>
            <p className="mt-3 text-2xl font-black text-[#111]">{formatNumber(profile?.audienceSize || 0)}</p>
            <p className="text-sm font-bold text-[#111]/70">Influence {profile?.influenceScore != null ? profile.influenceScore.toFixed(1) : '—'}</p>
          </div>
        </div>

        <div className="rounded-4xl border-2 border-black bg-white p-6 md:p-8 mb-10">
          <h2 className="text-2xl font-black text-[#111] font-(family-name:--font-bricolage)">Platform status</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-3xl border-2 border-black bg-[#F9F9F9] p-4">
              <p className="text-xs uppercase tracking-[0.35em] font-black text-[#666]">YouTube</p>
              <p className="mt-2 text-lg font-black text-[#111]">{platformStatus.data?.youtube.connected ? 'Connected' : 'Not connected'}</p>
            </div>
            <div className="rounded-3xl border-2 border-black bg-[#F9F9F9] p-4">
              <p className="text-xs uppercase tracking-[0.35em] font-black text-[#666]">TikTok</p>
              <p className="mt-2 text-lg font-black text-[#111]">{platformStatus.data?.tiktok.connected ? 'Connected' : 'Not connected'}</p>
            </div>
            <div className="rounded-3xl border-2 border-black bg-[#F9F9F9] p-4">
              <p className="text-xs uppercase tracking-[0.35em] font-black text-[#666]">Instagram</p>
              <p className="mt-2 text-lg font-black text-[#111]">{platformStatus.data?.instagram.connected ? 'Connected' : 'Not connected'}</p>
            </div>
          </div>
        </div>

        {isAdmin ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-[#111] font-(family-name:--font-bricolage)">Tenant directory</h2>
              <span className="rounded-full border-2 border-black bg-black px-4 py-1.5 text-xs font-black uppercase tracking-[0.35em] text-white">Admin view</span>
            </div>

            {adminUsers.isLoading ? (
              <div className="rounded-4xl border-2 border-black bg-[#F9F9F9] p-6 font-bold text-[#666]">Loading users from /users/admin/all...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {adminUsers.data?.users?.map((account) => (
                  <div key={account.id} className="rounded-4xl border-2 border-black bg-white p-5 hover:bg-[#F9F9F9] transition-all">
                    <p className="text-lg font-black text-[#111]">{account.name}</p>
                    <p className="text-sm font-bold text-[#666]">{account.email}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.35em] text-[#111]">
                      <span className="rounded-full border-2 border-black bg-pastel-blue px-3 py-1">{account.role}</span>
                      <span className="rounded-full border-2 border-black bg-[#FDE047] px-3 py-1">{account.isActive ? 'Active' : 'Inactive'}</span>
                      <span className="rounded-full border-2 border-black bg-pastel-pink px-3 py-1">{account.isEmailVerified ? 'Verified' : 'Unverified'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-4xl border-2 border-black bg-white p-6 md:p-8">
            <h2 className="text-2xl font-black text-[#111] font-(family-name:--font-bricolage)">My profile</h2>
            <p className="mt-3 text-sm font-bold text-[#666]">This view uses <span className="font-black text-[#111]">/users/me</span> and platform status from the backend.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-3xl border-2 border-black bg-[#F9F9F9] p-4">
                <p className="text-xs uppercase tracking-[0.35em] font-black text-[#666]">Bio</p>
                <p className="mt-2 text-sm font-bold text-[#111]">{profile?.bio || 'No bio supplied yet.'}</p>
              </div>
              <div className="rounded-3xl border-2 border-black bg-[#F9F9F9] p-4">
                <p className="text-xs uppercase tracking-[0.35em] font-black text-[#666]">Onboarded</p>
                <p className="mt-2 text-sm font-bold text-[#111]">{profile?.isOnboarded ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}