'use client';

import { useAuthStore } from '@/lib/auth/store';
import { useDashboard } from '@/app/(protected)/layout';
import CreatorDashboard from './creator-dashboard';
import AudienceInsights from './audience-insights';
import ContentPerformance from './content-performance';
import SettingsScreen from './settings';
import SMEDashboard from './_sme/index';
import AdminDashboard from './_admin/index';
import LibraryScreen from './LibraryScreen';
import NotificationsScreen from './notifications';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { activeTab } = useDashboard();

  if (!user) return null;

  const role = user.role;

  // ── Admin ──────────────────────────────────────────────────────────────────
  if (role === 'admin') return <AdminDashboard />;

  // ── SME ────────────────────────────────────────────────────────────────────
  if (role === 'sme') return <SMEDashboard />;

  // ── Creator (default) ──────────────────────────────────────────────────────
  return (
    <div className="p-8 lg:p-10">
      {activeTab === 'Dashboard' && <CreatorDashboard />}
      {activeTab === 'Content'   && <ContentPerformance />}
      {activeTab === 'Audience'  && <AudienceInsights />}
      {activeTab === 'Analytics' && <CreatorDashboard />}
      {activeTab === 'Library'   && <LibraryScreen />}
      {activeTab === 'Settings'  && <SettingsScreen />}
      {activeTab === 'Notifications' && <NotificationsScreen />}
    </div>
  );
}