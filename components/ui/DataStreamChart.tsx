'use client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const data = [
  { time: '10:00', views: 2400 },
  { time: '11:00', views: 4398 },
  { time: '12:00', views: 9800 },
  { time: '13:00', views: 3908 },
  { time: '14:00', views: 4800 },
  { time: '15:00', views: 3800 },
  { time: '16:00', views: 4300 },
];

export default function DataStreamChart() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="w-full h-[200px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3}/> {/* Pastel Blue */}
              <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="time" stroke="#D4D4D8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#D4D4D8" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #F4F4F5', borderRadius: '16px', boxShadow: '0px 10px 30px rgba(0,0,0,0.05)' }}
            itemStyle={{ color: '#0A0A0A', fontWeight: 'bold' }}
            cursor={{ stroke: '#F472B6', strokeWidth: 2, strokeDasharray: '3 3' }}
          />
          <Area 
            type="monotone" 
            dataKey="views" 
            stroke="#60A5FA" 
            strokeWidth={4}
            fillOpacity={1} 
            fill="url(#colorViews)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
