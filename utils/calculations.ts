import { Trade, Account, TradeStatus, TradeDirection } from '../types';

export const calculateRiskReward = (
  entry: number,
  sl: number,
  tp: number,
  direction: TradeDirection
): number => {
  if (!entry || !sl || !tp) return 0;
  
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  
  if (risk === 0) return 0;
  return Number((reward / risk).toFixed(2));
};

export const calculateAccountStats = (account: Account, trades: Trade[]) => {
  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.closeDatetime || a.openDatetime).getTime() - new Date(b.closeDatetime || b.openDatetime).getTime()
  );

  const closedTrades = sortedTrades.filter(t => t.status === TradeStatus.CLOSED);
  
  // Win Rate
  const winningTrades = closedTrades.filter(t => t.totalPnl > 0);
  const winRate = closedTrades.length > 0 
    ? (winningTrades.length / closedTrades.length) * 100 
    : 0;

  // Profit Factor
  const grossProfit = closedTrades.reduce((acc, t) => acc + (t.totalPnl > 0 ? t.totalPnl : 0), 0);
  const grossLoss = Math.abs(closedTrades.reduce((acc, t) => acc + (t.totalPnl < 0 ? t.totalPnl : 0), 0));
  const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;

  // Total P&L
  const totalPnl = closedTrades.reduce((acc, t) => acc + t.totalPnl, 0);

  // Equity Curve Data & Drawdown
  let currentEquity = account.initialBalance;
  let maxEquity = currentEquity;
  let maxDrawdown = 0;
  let currentDrawdown = 0;

  const equityCurve = [{ date: account.createdAt, value: account.initialBalance }];

  sortedTrades.forEach(trade => {
    if (trade.status === TradeStatus.CLOSED) {
      currentEquity += trade.totalPnl;
      
      // Update Peak
      if (currentEquity > maxEquity) {
        maxEquity = currentEquity;
      }

      // Calculate DD
      const dd = maxEquity - currentEquity;
      if (dd > maxDrawdown) {
        maxDrawdown = dd;
      }
      currentDrawdown = dd;

      equityCurve.push({
        date: trade.closeDatetime || trade.openDatetime,
        value: currentEquity
      });
    }
  });

  // Avg RR
  const totalRR = closedTrades.reduce((acc, t) => acc + t.riskReward, 0);
  const avgRR = closedTrades.length > 0 ? totalRR / closedTrades.length : 0;

  return {
    totalTrades: closedTrades.length,
    winRate: Number(winRate.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    totalPnl: Number(totalPnl.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    currentDrawdown: Number(currentDrawdown.toFixed(2)),
    currentEquity: Number(currentEquity.toFixed(2)),
    equityCurve,
    avgRR: Number(avgRR.toFixed(2)),
    bestTrade: Math.max(...closedTrades.map(t => t.totalPnl), 0),
    worstTrade: Math.min(...closedTrades.map(t => t.totalPnl), 0),
  };
};

export const getDrawdownStatus = (currentDD: number, limit: number) => {
  if (!limit || limit === 0) return { color: 'text-gray-500', status: 'Safe', percent: 0 };
  
  const percent = (currentDD / limit) * 100;
  let color = 'text-green-500';
  let status = 'Safe';
  let bgColor = 'bg-green-500';

  if (percent >= 95) {
    color = 'text-red-600';
    bgColor = 'bg-red-600';
    status = 'Critical';
  } else if (percent >= 85) {
    color = 'text-orange-500';
    bgColor = 'bg-orange-500';
    status = 'Danger';
  } else if (percent >= 70) {
    color = 'text-yellow-500';
    bgColor = 'bg-yellow-500';
    status = 'Warning';
  }

  return { color, status, percent, bgColor };
};
