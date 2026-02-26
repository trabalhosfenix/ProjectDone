"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

interface CurvaSProps {
  data: any[];
}

export function CurvaSChart({ data }: CurvaSProps) {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorPlanejado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#094160" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#094160" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend iconType="circle" />
          <Area
            type="monotone"
            dataKey="planejado"
            stroke="#094160"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorPlanejado)"
            name="Planejado %"
          />
          <Area
            type="monotone"
            dataKey="realizado"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorRealizado)"
            name="Realizado %"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
