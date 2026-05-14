'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CaretDown, Eye, CheckCircle } from '@phosphor-icons/react';
import { ChevronDown } from 'lucide-react';

interface ContentPerformanceItem {
  id: string;
  title: string;
  type: string;
  thumbnail?: string;
  date: string;
  views: string;
  watchTime: string;
  likes: string;
  engagement: string;
  status: 'trending' | 'stable' | 'viral';
}

const contentPerformanceData: ContentPerformanceItem[] = [
  {
    id: '1',
    title: 'Sustainable Tech 2024',
    type: 'Video • YouTube',
    date: 'Oct 12, 2023',
    views: '42.5k',
    watchTime: '824 hrs',
    likes: '3.1k',
    engagement: '8.4%',
    status: 'viral'
  },
  {
    id: '2',
    title: 'Efficiency Paradigms',
    type: 'Short • TikTok',
    date: 'Oct 10, 2023',
    views: '128.1k',
    watchTime: '412 hrs',
    likes: '12.4k',
    engagement: '5.2%',
    status: 'stable'
  },
  {
    id: '3',
    title: 'Resource Mapping Pro',
    type: 'Carousel • Instagram',
    date: 'Oct 08, 2023',
    views: '15.9k',
    watchTime: 'N/A',
    likes: '892',
    engagement: '0.8%',
    status: 'stable'
  }
];

const StatusBadge = ({ status }: { status: 'trending' | 'stable' | 'viral' }) => {
  const colors = {
    trending: 'bg-[#FEF3C7] text-[#92400E]',
    stable: 'bg-[#DBEAFE] text-[#1E40AF]',
    viral: 'bg-[#DCFCE7] text-[#166534]'
  };

  const labels = {
    trending: 'TRENDING',
    stable: 'STABLE',
    viral: 'VIRAL'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status]}`}>
      {labels[status]}
    </span>
  );
};

const MetricCard = ({ label, value, subtitle, color }: { label: string; value: string; subtitle?: string; color: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
    className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm"
  >
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4`} style={{ backgroundColor: color }}>
      📊
    </div>
    <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">{label}</h3>
    <p className="text-3xl font-black text-[#0B1C30]">{value}</p>
    {subtitle && <p className="text-xs text-[#6B7280] mt-2">{subtitle}</p>}
  </motion.div>
);

export default function ContentPerformance() {
  const [selectedFilter, setSelectedFilter] = useState('all-platforms');
  const [selectedContent, setSelectedContent] = useState<ContentPerformanceItem | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
          Content Performance
        </h1>
        <p className="text-sm text-[#6B7280] mt-2" style={{ fontFamily: "'Inter'" }}>
          Real-time engagement intelligence across all active streams.
        </p>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      >
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Platform Filter */}
          <div className="relative">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-[#E5E7EB] rounded-lg appearance-none bg-white text-sm font-bold cursor-pointer"
              style={{ fontFamily: "'Space Grotesk'" }}
            >
              <option value="all-platforms">All Platforms</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7280]" />
          </div>

          {/* Date Range Filter */}
          <div className="relative">
            <select
              className="px-4 py-2 border border-[#E5E7EB] rounded-lg appearance-none bg-white text-sm font-bold cursor-pointer"
              style={{ fontFamily: "'Space Grotesk'" }}
            >
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>Last 90 Days</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7280]" />
          </div>

          {/* Content Type Filter */}
          <div className="relative">
            <select
              className="px-4 py-2 border border-[#E5E7EB] rounded-lg appearance-none bg-white text-sm font-bold cursor-pointer"
              style={{ fontFamily: "'Space Grotesk'" }}
            >
              <option>All Content</option>
              <option>Videos</option>
              <option>Shorts</option>
              <option>Carousels</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7280]" />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          className="px-6 py-2 bg-[#006D32] text-white font-bold rounded-lg hover:bg-[#005227] transition whitespace-nowrap"
          style={{ fontFamily: "'Space Grotesk'" }}
        >
          + Apply Filters
        </motion.button>
      </motion.div>

      {/* Aggregated Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <MetricCard
          label="Aggregated Reach"
          value="1.2M"
          subtitle="↑ 12% vs last month"
          color="#E0F2FE"
        />
        <MetricCard
          label="Total Engagement"
          value="84.2K"
          subtitle="Highest performing month ever"
          color="#EFF6FF"
        />
      </div>

      {/* Content Table with Side Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-4 gap-8"
      >
        {/* Table */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-sm">
          <div className="space-y-6">
            <h2 className="text-lg font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
              Content
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left py-4 px-4 text-xs font-black text-[#6B7280] uppercase" style={{ fontFamily: "'Space Grotesk'" }}>
                      Content
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-black text-[#6B7280] uppercase" style={{ fontFamily: "'Space Grotesk'" }}>
                      Date
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-black text-[#6B7280] uppercase" style={{ fontFamily: "'Space Grotesk'" }}>
                      Views
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-black text-[#6B7280] uppercase" style={{ fontFamily: "'Space Grotesk'" }}>
                      Watch Time
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-black text-[#6B7280] uppercase" style={{ fontFamily: "'Space Grotesk'" }}>
                      Likes
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-black text-[#6B7280] uppercase" style={{ fontFamily: "'Space Grotesk'" }}>
                      Eng %
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-black text-[#6B7280] uppercase" style={{ fontFamily: "'Space Grotesk'" }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contentPerformanceData.map((item) => (
                    <motion.tr
                      key={item.id}
                      whileHover={{ backgroundColor: '#F9FAFB' }}
                      onClick={() => setSelectedContent(item)}
                      className="border-b border-[#F3F4F6] cursor-pointer transition"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#E5E7EB] rounded-lg flex-shrink-0"></div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#0B1C30] truncate">{item.title}</p>
                            <p className="text-xs text-[#6B7280]">{item.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-[#6B7280]">{item.date}</td>
                      <td className="py-4 px-4 text-sm font-bold text-[#0B1C30]">{item.views}</td>
                      <td className="py-4 px-4 text-sm font-bold text-[#0B1C30]">{item.watchTime}</td>
                      <td className="py-4 px-4 text-sm font-bold text-[#0B1C30]">{item.likes}</td>
                      <td className="py-4 px-4 text-sm font-bold text-[#0B1C30]">{item.engagement}</td>
                      <td className="py-4 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="text-sm font-bold text-[#006D32] hover:underline" style={{ fontFamily: "'Space Grotesk'" }}>
              Load More Streams ↓
            </button>
          </div>
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-1 bg-[#F0FDF4] rounded-xl border border-[#E5E7EB] p-6 shadow-sm h-fit sticky top-20">
          {selectedContent ? (
            <div className="space-y-6">
              <h3 className="text-sm font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
                LIVE ANALYSIS
              </h3>

              <div className="bg-white rounded-lg p-4 space-y-4">
                <div className="h-24 bg-[#E5E7EB] rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-[#6B7280]">Content Preview</span>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] font-bold">Title</p>
                  <p className="text-sm font-bold text-[#0B1C30]">{selectedContent.title}</p>
                </div>
              </div>

              <button className="w-full px-4 py-3 bg-[#006D32] text-white font-bold rounded-lg hover:bg-[#005227] transition flex items-center justify-center gap-2" style={{ fontFamily: "'Space Grotesk'" }}>
                <Eye size={18} />
                Select a content row to view deep metrics and engagement heatmaps.
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-center py-8">
              <h3 className="text-sm font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
                LIVE ANALYSIS
              </h3>
              <p className="text-xs text-[#6B7280]">Select a content row to view deep metrics and engagement heatmaps.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Export Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        className="w-full py-3 bg-[#006D32] text-white font-bold rounded-lg hover:bg-[#005227] transition flex items-center justify-center gap-2"
        style={{ fontFamily: "'Space Grotesk'" }}
      >
        <CheckCircle size={20} />
        Export Report
      </motion.button>
    </div>
  );
}
