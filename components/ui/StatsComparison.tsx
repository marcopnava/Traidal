import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './Card';

interface ComparisonPeriod {
  label: string;
  winRate: number;
  profitFactor: number;
  totalPnl: number;
  totalTrades: number;
}

interface StatsComparisonProps {
  currentPeriod: ComparisonPeriod;
  previousPeriod: ComparisonPeriod;
}

const StatItem = ({ 
  label, 
  current, 
  previous, 
  format = (v: number) => v.toString(),
  isInverted = false 
}: { 
  label: string; 
  current: number; 
  previous: number; 
  format?: (v: number) => string;
  isInverted?: boolean;
}) => {
  const change = current - previous;
  const percentChange = previous !== 0 ? (change / previous) * 100 : 0;
  const isPositive = isInverted ? change < 0 : change > 0;

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{format(current)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs {format(previous)}</p>
        </div>
        <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span className="text-sm font-bold">{Math.abs(percentChange).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export const StatsComparison: React.FC<StatsComparisonProps> = ({ currentPeriod, previousPeriod }) => {
  return (
    <Card title="Period Comparison" className="col-span-full">
      <div className="mb-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-accent rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-300 font-medium">{currentPeriod.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-300 font-medium">{previousPeriod.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatItem
          label="Total Trades"
          current={currentPeriod.totalTrades}
          previous={previousPeriod.totalTrades}
        />
        <StatItem
          label="Win Rate"
          current={currentPeriod.winRate}
          previous={previousPeriod.winRate}
          format={(v) => `${v.toFixed(1)}%`}
        />
        <StatItem
          label="Profit Factor"
          current={currentPeriod.profitFactor}
          previous={previousPeriod.profitFactor}
          format={(v) => v.toFixed(2)}
        />
        <StatItem
          label="Total P&L"
          current={currentPeriod.totalPnl}
          previous={previousPeriod.totalPnl}
          format={(v) => `$${v.toFixed(0)}`}
        />
      </div>

      <div className="mt-6 p-4 bg-accent/10 dark:bg-accent/20 rounded-xl border border-accent/20 dark:border-accent/30">
        <p className="text-sm text-gray-700 dark:text-gray-200">
          <span className="font-bold">Performance Insight:</span>{' '}
          {currentPeriod.winRate > previousPeriod.winRate 
            ? 'Your win rate has improved! Keep up the good work.' 
            : 'Focus on your trading strategy to improve your win rate.'}
        </p>
      </div>
    </Card>
  );
};

