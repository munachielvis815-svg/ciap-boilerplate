'use client';

import axios from 'axios';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import api from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';

interface Endpoint {
  category: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
  protected: boolean;
  requiresAdmin?: boolean;
}

const endpoints: Endpoint[] = [
  { category: 'Health', method: 'GET', path: '/health', description: 'Check API health status', protected: false },
  { category: 'Health', method: 'GET', path: '/health/db', description: 'Check database connection', protected: false },
  { category: 'Health', method: 'GET', path: '/health/cache', description: 'Check Redis cache connection', protected: false },
  { category: 'Health', method: 'GET', path: '/health/ready', description: 'Check if service is ready', protected: false },
  { category: 'Auth', method: 'POST', path: '/auth/signup', description: 'Create a new user account', protected: false },
  { category: 'Auth', method: 'POST', path: '/auth/login', description: 'Login with email and password', protected: false },
  { category: 'Auth', method: 'POST', path: '/auth/admin/signup', description: 'Create admin account (requires ADMIN_SIGNUP_KEY)', protected: false, requiresAdmin: true },
  { category: 'Auth', method: 'POST', path: '/auth/admin/login', description: 'Admin login', protected: false },
  { category: 'Auth', method: 'POST', path: '/auth/refresh', description: 'Refresh access token', protected: false },
  { category: 'Auth', method: 'GET', path: '/auth/verify', description: 'Verify current access token and session', protected: true },
  { category: 'Auth', method: 'POST', path: '/auth/logout', description: 'Logout and revoke session', protected: true },
  { category: 'Social / OAuth', method: 'GET', path: '/auth/socials/oauth2/google/login', description: 'Prepare Google OAuth2 login flow', protected: false },
  { category: 'Social / OAuth', method: 'GET', path: '/auth/socials/google/login/callback', description: 'Google OAuth2 callback for login', protected: false },
  { category: 'Social / OAuth', method: 'POST', path: '/auth/socials/google/token/refresh', description: 'Refresh stored Google OAuth token', protected: true },
  { category: 'Social / OAuth', method: 'GET', path: '/auth/socials/google/youtube/metrics', description: 'Pull YouTube channel and latest videos metrics', protected: true },
  { category: 'Users', method: 'GET', path: '/users/me', description: 'Get current user profile and dashboard data', protected: true },
  { category: 'Users', method: 'POST', path: '/users/me/onboard', description: 'Onboard creator profile', protected: true },
  { category: 'Users', method: 'GET', path: '/users/:id', description: 'Get user by ID', protected: true },
  { category: 'Users', method: 'GET', path: '/users/:id/platform-status', description: 'Get platform connection status (YouTube, TikTok, Instagram)', protected: true },
  { category: 'Users', method: 'GET', path: '/users', description: 'Get all users in tenant (SME only)', protected: true },
  { category: 'Users', method: 'GET', path: '/users/admin/all', description: 'Get all users across tenants (Admin only)', protected: true, requiresAdmin: true },
  { category: 'Creator Insights', method: 'GET', path: '/creators/insights/audience', description: 'Get audience insights for creator', protected: true },
  { category: 'Creator Insights', method: 'GET', path: '/creators/insights/content', description: 'Get content performance insights', protected: true },
  { category: 'Creator Insights', method: 'GET', path: '/creators/insights/performance', description: 'Get performance metrics and trends', protected: true },
  { category: 'YouTube Ingestion', method: 'GET', path: '/ingestion/youtube/metrics', description: 'Pull YouTube channel metrics for current user', protected: true },
  { category: 'YouTube Ingestion', method: 'GET', path: '/ingestion/youtube/oauth2', description: 'Prepare YouTube OAuth2 flow', protected: true },
  { category: 'YouTube Ingestion', method: 'GET', path: '/ingestion/youtube/oauth2/callback', description: 'YouTube OAuth callback and sync', protected: false },
  { category: 'YouTube Ingestion', method: 'POST', path: '/ingestion/youtube/permissions/approve', description: 'Approve YouTube permissions', protected: true },
  { category: 'YouTube Ingestion', method: 'POST', path: '/ingestion/youtube/approve', description: 'Approve YouTube channel for tracking', protected: true },
  { category: 'SME Creator Discovery', method: 'GET', path: '/sme/creators/discovery', description: 'Discover creators for campaigns', protected: true },
  { category: 'SME Creator Discovery', method: 'GET', path: '/sme/creators/compare', description: 'Compare creators by IDs', protected: true },
  { category: 'SME Creator Discovery', method: 'GET', path: '/sme/creators/search', description: 'Search creators', protected: true },
  { category: 'SME Creator Discovery', method: 'GET', path: '/sme/creators/:id/profile', description: 'Get creator profile for SME', protected: true },
];

const pretty = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export default function EndpointsPage() {
  const { user } = useAuthStore();
  const categories = useMemo(() => [...new Set(endpoints.map((endpoint) => endpoint.category))], []);
  const [selectedCategory, setSelectedCategory] = useState<string>('Auth');
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(endpoints[9]);
  const [pathOverride, setPathOverride] = useState(endpoints[9].path);
  const [requestBody, setRequestBody] = useState('');
  const [responseText, setResponseText] = useState('{\n  "status": "idle"\n}');
  const [responseStatus, setResponseStatus] = useState<string>('Idle');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const visibleEndpoints = endpoints.filter((endpoint) => endpoint.category === selectedCategory);

  const selectEndpoint = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint);
    setPathOverride(endpoint.path);
    setRequestBody(endpoint.method === 'POST' ? '{\n  "example": true\n}' : '');
    setErrorText('');
    setResponseStatus('Ready');
  };

  const runRequest = async () => {
    setLoading(true);
    setErrorText('');

    try {
      const data = requestBody.trim() ? JSON.parse(requestBody) : undefined;
      const response = await api.request({
        url: pathOverride.trim(),
        method: selectedEndpoint.method.toLowerCase(),
        data,
      });

      setResponseStatus(`${response.status} ${response.statusText}`);
      setResponseText(pretty(response.data));
    } catch (requestError: unknown) {
      setResponseStatus('Request failed');
      if (axios.isAxiosError(requestError) && requestError.response) {
        setResponseText(pretty(requestError.response.data));
        setErrorText(`${requestError.response.status} ${requestError.response.statusText || 'Error'}`);
      } else if (requestError instanceof Error) {
        setResponseText(pretty({ message: requestError.message }));
        setErrorText(requestError.message);
      } else {
        setResponseText(pretty({ message: 'Unknown request failure' }));
        setErrorText('Unknown request failure');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E5E5E5] p-4 md:p-6 pt-24 md:pt-32">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[48px] md:text-[64px] leading-[0.9] font-bold tracking-tight text-[#111] font-(family-name:--font-bricolage)">
              API<br />Console
            </h1>
            <p className="text-[#666] font-bold text-sm md:text-base mt-4 max-w-2xl">Run backend requests from inside the app and inspect the real JSON response without switching to Swagger.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-full border-2 border-black bg-black px-5 py-3 text-sm font-black text-white">Dashboard</Link>
            <Link href="/sessions" className="rounded-full border-2 border-black bg-white px-5 py-3 text-sm font-black text-[#111]">Session center</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-3 rounded-[1.25rem] border-2 border-black text-sm font-black transition-all ${selectedCategory === category ? 'bg-black text-white' : 'bg-white text-[#111] hover:bg-[#F9F9F9]'}`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {visibleEndpoints.map((endpoint) => (
                <button
                  key={`${endpoint.category}-${endpoint.method}-${endpoint.path}`}
                  onClick={() => selectEndpoint(endpoint)}
                  className={`w-full text-left rounded-4xl border-2 border-black p-5 md:p-6 transition-all hover:scale-[1.01] ${selectedEndpoint.path === endpoint.path ? 'bg-[#FDE047]' : 'bg-white'}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="px-3 py-1 rounded-full font-black text-sm text-white border-2 border-black" style={{ backgroundColor: endpoint.method === 'GET' ? '#60A5FA' : '#F472B6' }}>
                          {endpoint.method}
                        </span>
                        <span className="text-sm font-mono bg-[#F9F9F9] border-2 border-black px-3 py-1 rounded-lg text-[#111] font-bold">{endpoint.path}</span>
                        {endpoint.protected && <span className="px-2 py-1 text-xs font-black bg-[#FDE047] border-2 border-black text-[#111] rounded-full">Protected</span>}
                        {endpoint.requiresAdmin && <span className="px-2 py-1 text-xs font-black bg-[#FF6B6B] border-2 border-black text-white rounded-full">Admin</span>}
                      </div>
                      <p className="text-[#666] font-bold">{endpoint.description}</p>
                    </div>
                    <div className="text-xs font-black uppercase tracking-[0.35em] text-[#666]">Select to run</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="sticky top-24 space-y-6">
            <div className="rounded-4xl border-2 border-black bg-white p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] font-black text-[#666]">Request builder</p>
                  <h2 className="mt-2 text-2xl font-black text-[#111] font-(family-name:--font-bricolage)">{selectedEndpoint.method} {selectedEndpoint.path}</h2>
                </div>
                <span className="rounded-full border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-[0.35em] text-[#111]">{user?.role || 'guest'}</span>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="block text-xs uppercase tracking-[0.35em] font-black text-[#666] mb-2">Path</span>
                  <input
                    value={pathOverride}
                    onChange={(event) => setPathOverride(event.target.value)}
                    className="w-full rounded-[1.25rem] border-2 border-black bg-[#F9F9F9] px-4 py-3 text-sm font-bold text-[#111] outline-none focus:bg-white"
                  />
                </label>

                {selectedEndpoint.method === 'POST' && (
                  <label className="block">
                    <span className="block text-xs uppercase tracking-[0.35em] font-black text-[#666] mb-2">JSON body</span>
                    <textarea
                      value={requestBody}
                      onChange={(event) => setRequestBody(event.target.value)}
                      rows={8}
                      className="w-full rounded-[1.25rem] border-2 border-black bg-[#111] px-4 py-3 text-sm font-mono text-white outline-none focus:bg-zinc-900"
                    />
                  </label>
                )}

                <button
                  onClick={runRequest}
                  disabled={loading}
                  className="w-full rounded-full border-2 border-black bg-black px-5 py-4 text-sm font-black text-white transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Running request…' : 'Run request'}
                </button>
              </div>
            </div>

            <div className="rounded-4xl border-2 border-black bg-[#111] p-6 md:p-8 text-white">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-2xl font-black font-(family-name:--font-bricolage)">Response</h2>
                <span className="rounded-full border-2 border-white/40 px-3 py-1 text-xs font-black uppercase tracking-[0.35em] text-white/80">{responseStatus}</span>
              </div>

              {errorText && (
                <div className="mb-4 rounded-[1.25rem] border-2 border-[#FF6B6B] bg-[#FF6B6B]/10 px-4 py-3 text-sm font-bold text-[#FFB4B4]">
                  {errorText}
                </div>
              )}

              <pre className="max-h-130 overflow-auto whitespace-pre-wrap wrap-break-word rounded-[1.25rem] border-2 border-white/10 bg-black p-4 text-xs leading-6 text-[#C7F9CC]">
{responseText}
              </pre>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-4xl border-2 border-black bg-pastel-blue p-6 md:p-8">
          <h3 className="font-black text-[#111] text-lg mb-3 font-(family-name:--font-bricolage)">Backend access</h3>
          <p className="text-sm text-[#111] font-bold">Requests go through the frontend Axios client, so auth tokens and tenant headers are injected automatically when present.</p>
        </div>
      </div>
    </div>
  );
}
