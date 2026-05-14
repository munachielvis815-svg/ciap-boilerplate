'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Download, Bell } from '@phosphor-icons/react';

const followerTrendData = [
  { name: 'Week 1', value: 8200 },
  { name: 'Week 2', value: 9100 },
  { name: 'Week 3', value: 10500 },
  { name: 'Week 4', value: 12300 }
];

const demographicData = [
  { name: 'Male', value: 62 },
  { name: 'Female', value: 35 },
  { name: 'Other', value: 3 }
];

const globalRegions = [
  { rank: '01', name: 'United States', count: '45k' },
  { rank: '02', name: 'Germany', count: '22k' },
  { rank: '03', name: 'United Kingdom', count: '18k' },
  { rank: '04', name: 'Canada', count: '12k' }
];

const ageGroups = [
  { age: 'AGE 18-24', percent: '42%' },
  { age: 'AGE 25-34', percent: '38%' }
];

const CircularGauge = ({ percentage, label }: { percentage: number; label: string }) => {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#00D166"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          className="transition-all duration-1000"
        />
        <text
          x="60"
          y="70"
          textAnchor="middle"
          fontSize="32"
          fontWeight="bold"
          fill="#0B1C30"
        >
          {percentage}%
        </text>
      </svg>
      <p className="text-sm font-bold text-[#6B7280] mt-4 uppercase">{label}</p>
    </div>
  );
};

export default function AudienceInsights() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
            Audience Insights
          </h1>
          <p className="text-sm text-[#6B7280] mt-2" style={{ fontFamily: "'Inter'" }}>
            Real-time demographic intelligence and sentiment analysis.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="p-3 rounded-lg bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] transition">
            <Bell size={20} className="text-[#6B7280]" />
          </button>
          <button className="px-4 py-2 bg-[#006D32] text-white font-bold rounded-lg hover:bg-[#005227] transition flex items-center gap-2" style={{ fontFamily: "'Space Grotesk'" }}>
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Top Section - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Follower Growth Trend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-sm"
        >
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
                Follower Growth Trend
              </h2>
              <p className="text-xs text-[#6B7280] mt-2">Last 30 days performance</p>
            </div>

            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={followerTrendData}>
                  <defs>
                    <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D166" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00D166" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    fill="url(#followerGrad)"
                    stroke="#00D166"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2">
              <p className="text-sm font-bold text-[#006D32]">↑ +62.4k last 30 days</p>
            </div>
          </div>
        </motion.div>

        {/* Sentiment Pulse */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-blue-50 rounded-xl border border-[#E5E7EB] p-8 shadow-sm flex flex-col items-center justify-center"
        >
          <div className="text-center space-y-8">
            <div>
              <h2 className="text-lg font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
                Sentiment Pulse
              </h2>
              <p className="text-xs text-[#6B7280] mt-2">Global brand perception</p>
            </div>

            <CircularGauge percentage={74} label="Positive" />

            <div className="grid grid-cols-3 gap-4 w-full">
              <div className="text-center">
                <p className="text-2xl font-black text-[#00D166]">74%</p>
                <p className="text-xs text-[#6B7280] mt-1 font-bold">Pos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-[#FCD34D]">21%</p>
                <p className="text-xs text-[#6B7280] mt-1 font-bold">Neu</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-[#EF4444]">5%</p>
                <p className="text-xs text-[#6B7280] mt-1 font-bold">Neg</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Section - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Demographic Split */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-sm"
        >
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
                Demographic Split
              </h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={demographicData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="#00D166" />
                      <Cell fill="#E5E7EB" />
                      <Cell fill="#E5E7EB" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#006D32]"></div>
                  <div>
                    <p className="text-sm font-bold text-[#0B1C30]">Male</p>
                    <p className="text-xs text-[#6B7280]">62%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#00D166]"></div>
                  <div>
                    <p className="text-sm font-bold text-[#0B1C30]">Female</p>
                    <p className="text-xs text-[#6B7280]">35%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#E5E7EB]"></div>
                  <div>
                    <p className="text-sm font-bold text-[#0B1C30]">Other</p>
                    <p className="text-xs text-[#6B7280]">3%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Age Groups */}
            <div className="space-y-4 border-t border-[#E5E7EB] pt-6">
              {ageGroups.map((group, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-[#6B7280]">{group.age}</span>
                    <span className="text-[#0B1C30]">{group.percent}</span>
                  </div>
                  <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: group.percent }}
                      transition={{ duration: 1.5 }}
                      className="h-full bg-[#006D32]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Global Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-sm"
        >
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
                Global Distribution
              </h2>
              <p className="text-xs text-[#6B7280] mt-2">Top engaging regions</p>
            </div>

            {/* Simple Map Representation */}
            <div className="bg-gray-400 rounded-lg h-48 flex items-center justify-center text-white text-sm font-bold">
              <span className="text-center">📍 Live Traffic Tracking</span>
            </div>

            {/* Regions List */}
            <div className="space-y-3">
              {globalRegions.map((region, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-[#6B7280]">{region.rank}</span>
                    <span className="text-sm font-bold text-[#0B1C30]">{region.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-20 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${100 - idx * 20}%` }}
                        transition={{ duration: 1, delay: idx * 0.1 }}
                        className="h-full bg-[#006D32]"
                      />
                    </div>
                    <span className="text-sm font-bold text-[#0B1C30] w-12 text-right">{region.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Elite Plan Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-gradient-to-r from-[#F0F9FF] to-[#F0FDF4] rounded-xl border border-[#E5E7EB] p-6"
      >
        <p className="text-xs font-bold text-[#6B7280] uppercase">Elite Plan</p>
        <p className="text-sm text-[#6B7280] mt-2">85% of monthly Intelligence engagement</p>
        <div className="mt-4 h-1 bg-[#E5E7EB] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '85%' }}
            transition={{ duration: 1.5 }}
            className="h-full bg-[#006D32]"
          />
        </div>
      </motion.div>
    </div>
  );
}
