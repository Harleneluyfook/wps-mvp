import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { BarangayData } from '../types';
import { getUrgencyLevel } from '../utils';
import { AlertCircle, BarChart3, TrendingUp, PieChart as PieIcon } from 'lucide-react';

interface AnalyticsProps {
  data: BarangayData[];
}

export default function Analytics({ data }: AnalyticsProps) {
  const top10Casualties = [...data]
    .sort((a, b) => b.casualties - a.casualties)
    .slice(0, 10);

  const top10Families = [...data]
    .sort((a, b) => b.affectedFamilies - a.affectedFamilies)
    .slice(0, 10);

  const urgencyCounts = data.reduce((acc, curr) => {
    const level = getUrgencyLevel(curr.priorityScore).label;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(urgencyCounts).map(([name, value]) => ({ name, value }));
  
  const COLORS = {
    'Highest': '#dc2626',
    'Urgent': '#f97316',
    'Moderate': '#3b82f6',
    'Low': '#94a3b8'
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border border-gray-100 text-center">
         <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
            <BarChart3 size={40} />
         </div>
         <h3 className="text-xl font-bold text-slate-800">No Analytics Data</h3>
         <p className="text-gray-500 max-w-sm mt-2">
           Detailed analytics will be automatically generated once you start assessing barangays in the Assessment Input section.
         </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 p-6 rounded-3xl text-white col-span-1 md:col-span-2">
          <p className="label-caps !text-slate-500">Live Analytics Engine</p>
          <h3 className="text-2xl font-black mt-2">Baguio City Impact Visualization</h3>
          <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-bold">Weighted Sum Model Normalization v1.0</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
           <p className="label-caps">Assessed</p>
           <p className="text-2xl font-black text-slate-900">{data.filter(b => b.priorityScore > 0).length} / 128</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
           <p className="label-caps">Priority Areas</p>
           <p className="text-2xl font-black text-red-600">{data.filter(b => b.priorityScore > 0.6).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Highest Casualties Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <p className="label-caps mb-6">Top 10: Reported Casualties</p>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10Casualties} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={90} 
                    fontSize={9} 
                    fontWeight="black"
                    tick={{ fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Bar dataKey="casualties" fill="#dc2626" radius={[0, 8, 8, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Priority Distro */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <p className="label-caps mb-6">Urgency Distribution</p>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="flex flex-wrap justify-center gap-4 mt-2">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] }} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{entry.name}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Affected Families */}
        <div className="lg:col-span-12 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
           <p className="label-caps mb-10">Affected Families Exposure Map</p>
           <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={top10Families} margin={{ top: 0, right: 30, left: 0, bottom: 40 }}>
                  <defs>
                    <linearGradient id="colorFam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={9} 
                    fontWeight="black"
                    tick={{ fill: '#94a3b8' }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    stroke="#f1f5f9"
                  />
                  <YAxis fontSize={9} fontWeight="black" tick={{ fill: '#94a3b8' }} stroke="#f1f5f9" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="stepAfter" 
                    dataKey="affectedFamilies" 
                    stroke="#2563eb" 
                    fillOpacity={1} 
                    fill="url(#colorFam)" 
                    strokeWidth={4}
                  />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}
