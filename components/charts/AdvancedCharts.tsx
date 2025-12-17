import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card } from '../ui/Card';
import { Trade } from '../../types';

interface AdvancedChartsProps {
  trades: Trade[];
}

// Pair Distribution Chart
export const PairDistributionChart: React.FC<{ trades: Trade[] }> = ({ trades }) => {
  const pairData = trades.reduce((acc, trade) => {
    acc[trade.pair] = (acc[trade.pair] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(pairData)
    .map(([pair, count]) => ({ pair, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const COLORS = ['#f3b43f', '#4ade80', '#60a5fa', '#f87171', '#a78bfa', '#fb923c'];

  return (
    <Card title="Most Traded Pairs">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ pair, percent }) => `${pair} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              backgroundColor: 'white',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

// Win/Loss Analysis by Day of Week
export const DayOfWeekChart: React.FC<{ trades: Trade[] }> = ({ trades }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayData = days.map((day, index) => {
    const dayTrades = trades.filter(t => new Date(t.openDatetime).getDay() === index);
    const wins = dayTrades.filter(t => t.totalPnl > 0).length;
    const losses = dayTrades.filter(t => t.totalPnl < 0).length;
    return { day, wins, losses };
  });

  return (
    <Card title="Performance by Day">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={dayData}>
          <XAxis 
            dataKey="day" 
            stroke="#9ca3af"
            fontSize={12}
          />
          <YAxis 
            stroke="#9ca3af"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              backgroundColor: 'white',
            }}
          />
          <Legend />
          <Bar dataKey="wins" fill="#4ade80" radius={[8, 8, 0, 0]} />
          <Bar dataKey="losses" fill="#f87171" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// Monthly Performance Heatmap (simplified as bars)
export const MonthlyPerformanceChart: React.FC<{ trades: Trade[] }> = ({ trades }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  
  const monthData = months.map((month, index) => {
    const monthTrades = trades.filter(t => {
      const date = new Date(t.closeDatetime || t.openDatetime);
      return date.getMonth() === index && date.getFullYear() === currentYear;
    });
    const pnl = monthTrades.reduce((sum, t) => sum + t.totalPnl, 0);
    return { month, pnl };
  });

  return (
    <Card title="Monthly Performance">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={monthData}>
          <XAxis 
            dataKey="month" 
            stroke="#9ca3af"
            fontSize={12}
          />
          <YAxis 
            stroke="#9ca3af"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              backgroundColor: 'white',
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
          />
          <Bar 
            dataKey="pnl" 
            fill="#f3b43f" 
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// Main component that includes all charts
export const AdvancedCharts: React.FC<AdvancedChartsProps> = ({ trades }) => {
  if (trades.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <PairDistributionChart trades={trades} />
      <DayOfWeekChart trades={trades} />
      <div className="lg:col-span-2">
        <MonthlyPerformanceChart trades={trades} />
      </div>
    </div>
  );
};

