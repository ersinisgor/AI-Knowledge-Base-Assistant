'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { day: 'Mon', latency: 420 },
  { day: 'Tue', latency: 380 },
  { day: 'Wed', latency: 450 },
  { day: 'Thu', latency: 340 },
  { day: 'Fri', latency: 370 },
  { day: 'Sat', latency: 310 },
  { day: 'Sun', latency: 290 },
];

export function LatencyChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-3.5">
      <div className="flex justify-between items-center mb-3">
        <span className="text-muted-foreground text-base uppercase tracking-wider">
          Retrieval Latency (7 days)
        </span>
        <div className="flex gap-2">
          <span className="flex items-center gap-1 text-base text-primary">
            <span className="w-2 h-0.5 bg-primary rounded inline-block" />
            Latency
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 14, fill: '#475569' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 14, fill: '#475569' }} axisLine={false} tickLine={false} unit="ms" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', fontSize: '16px' }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#22d3ee' }}
          />
          <Area type="monotone" dataKey="latency" stroke="#22d3ee" strokeWidth={2} fill="url(#latencyGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
