'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { MagnifyingGlass, Star, Users, TrendingUp } from '@phosphor-icons/react';

interface Creator {
  id: string;
  name: string;
  platform: string;
  followers: string;
  engagement: string;
  influenceScore: number;
  growth: string;
  verified: boolean;
  thumbnail?: string;
}

interface CreatorMetrics {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
}

const scoutedCreators: Creator[] = [
  {
    id: '1',
    name: 'TechVision Studio',
    platform: 'YouTube',
    followers: '245K',
    engagement: '8.2%',
    influenceScore: 84,
    growth: '+12.4%',
    verified: true
  },
  {
    id: '2',
    name: 'Creative Minds Hub',
    platform: 'TikTok',
    followers: '892K',
    engagement: '15.4%',
    influenceScore: 91,
    growth: '+28.1%',
    verified: true
  },
  {
    id: '3',
    name: 'Digital Art Academy',
    platform: 'Instagram',
    followers: '128K',
    engagement: '12.1%',
    influenceScore: 76,
    growth: '+5.3%',
    verified: false
  },
  {
    id: '4',
    name: 'Future Labs',
    platform: 'YouTube',
    followers: '567K',
    engagement: '6.8%',
    influenceScore: 79,
    growth: '+8.9%',
    verified: true
  }
];

const creatorMetrics: CreatorMetrics[] = [
  {
    label: 'Active Creators Scouted',
    value: '4',
    trend: '+2 this week',
    trendUp: true
  },
  {
    label: 'Avg Influence Score',
    value: '82.5',
    trend: '+3.2 pts',
    trendUp: true
  },
  {
    label: 'Total Followers Reach',
    value: '1.8M',
    trend: '+156K',
    trendUp: true
  },
  {
    label: 'Avg Engagement Rate',
    value: '10.6%',
    trend: '+1.1%',
    trendUp: true
  }
];

const growthTrendData = [
  { name: 'Week 1', avgFollowers: 1200000 },
  { name: 'Week 2', avgFollowers: 1350000 },
  { name: 'Week 3', avgFollowers: 1520000 },
  { name: 'Week 4', avgFollowers: 1800000 }
];

const MetricCard = ({ label, value, trend, trendUp }: CreatorMetrics) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition"
  >
    <div className="space-y-3 flex-1">
      <p className="text-sm font-medium text-[#6B7280]">{label}</p>
      <h3 className="text-2xl font-black text-[#0B1C30]">{value}</h3>
      <p className={`text-sm font-bold ${trendUp ? 'text-[#006D32]' : 'text-[#DC2626]'}`}>
        {trendUp ? '↑' : '↓'} {trend}
      </p>
    </div>
  </motion.div>
);

export default function SMEDashboard() {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCreators = scoutedCreators.filter(creator =>
    creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
            Creator Scouting Dashboard
          </h1>
          <p className="text-sm text-[#6B7280] mt-2" style={{ fontFamily: "'Inter'" }}>
            Discovery and evaluation of high-potential creators across platforms.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search creators by name or platform..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#006D32]"
            style={{ fontFamily: "'Inter'" }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {creatorMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {/* Growth Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-sm"
      >
        <div className="space-y-6">
          <h2 className="text-lg font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
            Scouted Creators - Average Growth Trend
          </h2>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthTrendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontWeight: 'bold'
                  }}
                  formatter={(value: any) => `${(value / 1000000).toFixed(2)}M followers`}
                />
                <Line
                  type="monotone"
                  dataKey="avgFollowers"
                  stroke="#006D32"
                  strokeWidth={3}
                  dot={{ fill: '#006D32', r: 5 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Creators Grid and Detail Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-4 gap-8"
      >
        {/* Creators List */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-lg font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
            Scouted Creators ({filteredCreators.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCreators.map((creator) => (
              <motion.div
                key={creator.id}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedCreator(creator)}
                className={`bg-white rounded-xl border-2 p-6 shadow-sm cursor-pointer transition ${
                  selectedCreator?.id === creator.id
                    ? 'border-[#006D32] shadow-md'
                    : 'border-[#E5E7EB] hover:border-[#006D32]'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
                        {creator.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-[#6B7280] bg-[#F3F4F6] px-2 py-1 rounded">
                          {creator.platform}
                        </span>
                        {creator.verified && (
                          <span className="text-xs font-bold text-[#006D32] bg-[#F0FDF4] px-2 py-1 rounded">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#E5E7EB]">
                    <div>
                      <p className="text-xs text-[#6B7280] font-bold">FOLLOWERS</p>
                      <p className="text-lg font-black text-[#0B1C30]">{creator.followers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280] font-bold">ENGAGEMENT</p>
                      <p className="text-lg font-black text-[#0B1C30]">{creator.engagement}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280] font-bold">GROWTH</p>
                      <p className="text-lg font-black text-[#006D32]">{creator.growth}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#6B7280]">Influence Score</span>
                      <span className="text-sm font-black text-[#006D32]">{creator.influenceScore}/100</span>
                    </div>
                    <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${creator.influenceScore}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-[#006D32]"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Creator Detail Panel */}
        <div className="lg:col-span-1">
          {selectedCreator ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#F0FDF4] rounded-xl border border-[#E5E7EB] p-6 shadow-sm h-fit sticky top-20 space-y-6"
            >
              <h3 className="text-sm font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
                CREATOR DETAILS
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#6B7280] font-bold">Name</p>
                  <p className="text-sm font-bold text-[#0B1C30]">{selectedCreator.name}</p>
                </div>

                <div>
                  <p className="text-xs text-[#6B7280] font-bold">Platform</p>
                  <p className="text-sm font-bold text-[#0B1C30]">{selectedCreator.platform}</p>
                </div>

                <div>
                  <p className="text-xs text-[#6B7280] font-bold">Followers</p>
                  <p className="text-sm font-bold text-[#0B1C30]">{selectedCreator.followers}</p>
                </div>

                <div>
                  <p className="text-xs text-[#6B7280] font-bold">Engagement Rate</p>
                  <p className="text-sm font-bold text-[#0B1C30]">{selectedCreator.engagement}</p>
                </div>

                <div>
                  <p className="text-xs text-[#6B7280] font-bold">Influence Score</p>
                  <p className="text-2xl font-black text-[#006D32]">{selectedCreator.influenceScore}</p>
                </div>

                <button className="w-full py-3 bg-[#006D32] text-white font-bold rounded-lg hover:bg-[#005227] transition" style={{ fontFamily: "'Space Grotesk'" }}>
                  View Full Profile
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="bg-[#F0FDF4] rounded-xl border border-[#E5E7EB] p-6 shadow-sm h-fit sticky top-20 text-center py-12">
              <p className="text-xs text-[#6B7280] font-bold">Select a creator to view details</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
