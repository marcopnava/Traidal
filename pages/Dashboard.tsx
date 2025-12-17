import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Account, Trade, TradeStatus } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { calculateAccountStats, getDrawdownStatus, calculateStreaks, calculateExpectancy, calculateDaysInDrawdown } from '../utils/calculations';
import { TrendingUp, TrendingDown, AlertTriangle, Wallet, Activity, Target, BarChart3, Trophy, Flame, Calendar, Zap, TrendingDownIcon, Sparkles, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { StatsComparison } from '../components/ui/StatsComparison';
import { AdvancedCharts } from '../components/charts/AdvancedCharts';
import { EmptyState } from '../components/ui/EmptyState';
import { AccountSelect } from '../components/ui/AccountSelect';
import { StatTooltip } from '../components/ui/StatTooltip';
import { subDays, differenceInDays } from 'date-fns';
import { useAccountModal } from '../contexts/AccountModalContext';
import { CreateAccountModal } from '../components/accounts/CreateAccountModal';

export const Dashboard = () => {
  const { openAccountModal } = useAccountModal();
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const loadedAccounts = await SupabaseService.getAccounts();
        const loadedTrades = await SupabaseService.getTrades();
        setAccounts(loadedAccounts);
        setTrades(loadedTrades);
        
        if (loadedAccounts.length > 0 && !selectedAccount) {
          setSelectedAccount(loadedAccounts[0].id);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      const account = accounts.find(a => a.id === selectedAccount);
      
      // Helper per verificare se closeDatetime è valido
      const hasValidCloseDate = (t: Trade): boolean => {
        return t.closeDatetime != null && 
               t.closeDatetime !== '' && 
               t.closeDatetime.trim() !== '' &&
               !isNaN(new Date(t.closeDatetime).getTime());
      };
      
      // TUTTI i trade dell'account (senza filtro dateRange) per calcolare current equity
      const allAccountTrades = trades.filter(t => t.accountId === selectedAccount);
      
      // Trade filtrati per dateRange (solo per statistiche di confronto e grafici)
      const accountTrades = allAccountTrades.filter(t => {
        // Per trade chiusi usa closeDatetime, per aperti usa openDatetime
        const tradeDate = hasValidCloseDate(t)
          ? new Date(t.closeDatetime!)
          : new Date(t.openDatetime);
        return tradeDate >= dateRange.start && tradeDate <= dateRange.end;
      });
      
      if (account) {
        // Calcola stats con TUTTI i trade per current equity corretta
        const baseStats = calculateAccountStats(account, allAccountTrades);
        
        // Calcola stats filtrate per dateRange (per confronto e grafici)
        const filteredStats = calculateAccountStats(account, accountTrades);
        
        const streaks = calculateStreaks(accountTrades);
        const expectancy = calculateExpectancy(accountTrades);
        const daysInDD = calculateDaysInDrawdown(account, accountTrades);
        const tradingDays = differenceInDays(new Date(), new Date(account.createdAt));
        const roi = account.initialBalance > 0 ? (baseStats.totalPnl / account.initialBalance) * 100 : 0;
        const dailyAvgPnl = tradingDays > 0 ? baseStats.totalPnl / tradingDays : 0;
        
        // Calculate average win and loss - usa hasValidCloseDate invece di status
        const closedTrades = accountTrades.filter(t => hasValidCloseDate(t));
        const winningTrades = closedTrades.filter(t => {
          const totalWithFees = (t.totalPnl || 0) + (t.commission || 0) + (t.swap || 0);
          return totalWithFees > 0;
        });
        const losingTrades = closedTrades.filter(t => {
          const totalWithFees = (t.totalPnl || 0) + (t.commission || 0) + (t.swap || 0);
          return totalWithFees < 0;
        });
        const avgWin = winningTrades.length > 0 
          ? winningTrades.reduce((sum, t) => sum + (t.totalPnl || 0) + (t.commission || 0) + (t.swap || 0), 0) / winningTrades.length 
          : 0;
        const avgLoss = losingTrades.length > 0 
          ? losingTrades.reduce((sum, t) => sum + (t.totalPnl || 0) + (t.commission || 0) + (t.swap || 0), 0) / losingTrades.length 
          : 0;
        
        setStats({
          ...baseStats, // Usa baseStats per current equity (tutti i trade chiusi)
          account,
          filteredTrades: accountTrades,
          streaks,
          expectancy,
          daysInDD,
          tradingDays,
          roi,
          dailyAvgPnl,
          avgWin,
          avgLoss,
          winningTrades: winningTrades.length,
          losingTrades: losingTrades.length,
          // Usa filteredStats per winRate, profitFactor, totalPnl nel dateRange
          winRate: filteredStats.winRate,
          profitFactor: filteredStats.profitFactor,
          totalPnl: filteredStats.totalPnl, // P&L nel dateRange
          totalPnlAll: baseStats.totalPnl, // P&L totale (tutti i trade)
        });
      }
    }
  }, [selectedAccount, accounts, trades, dateRange]);

  // Welcome Banner Component
  const WelcomeBanner = () => {
    return (
      <div className="mb-8">
        <Card className="bg-gradient-to-br from-accent/10 via-accent-soft/50 to-background dark:from-accent/20 dark:via-gray-800/50 dark:to-gray-900 border-2 border-accent/30 dark:border-accent/20 relative overflow-hidden shadow-2xl">
          {/* Background elements senza animazione */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 p-2">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-4 bg-accent/20 dark:bg-accent/30 rounded-2xl shadow-lg">
                <Sparkles size={32} className="text-accent" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  Welcome to Traidal! 🎉
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                  Get started by creating your first trading account to track your performance.
                </p>
              </div>
            </div>
            
            <button
              onClick={openAccountModal}
              className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap group cursor-pointer"
            >
              <span>Create Your First Account</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </Card>
      </div>
    );
  };

  const handleAccountCreated = async () => {
    const loadedAccounts = await SupabaseService.getAccounts();
    const loadedTrades = await SupabaseService.getTrades();
    setAccounts(loadedAccounts);
    setTrades(loadedTrades);
    
    if (loadedAccounts.length > 0 && !selectedAccount) {
      setSelectedAccount(loadedAccounts[0].id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <WelcomeBanner />
        <EmptyState
          icon={Wallet}
          title="No Accounts Yet"
          description="Create your first trading account to start tracking your performance and analyze your trading journey."
          actionLabel="Create Account"
          onAction={openAccountModal}
        />
        <CreateAccountModal onAccountCreated={handleAccountCreated} />
      </div>
    );
  }

  if (!stats) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse text-gray-400 dark:text-gray-500">Loading...</div>
    </div>
  );

  const ddStatus = getDrawdownStatus(stats.currentDrawdown, stats.account.maxDrawdownLimit);
  
  // Calculate previous period stats for comparison
  const previousPeriodStart = new Date(dateRange.start);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - (Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))));
  const previousPeriodTrades = trades.filter(t => {
    if (t.accountId !== selectedAccount) return false;
    const tradeDate = new Date(t.closeDatetime || t.openDatetime);
    return tradeDate >= previousPeriodStart && tradeDate < dateRange.start;
  });
  const previousStats = calculateAccountStats(stats.account, previousPeriodTrades);
  
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, Trader</h1>
          <p className="text-secondary dark:text-gray-400 mt-1">Here's what's happening with your portfolio today.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <AccountSelect
            accounts={accounts}
            selectedId={selectedAccount}
            onChange={setSelectedAccount}
          />
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Equity Card with Tooltip */}
        <StatTooltip
          title="Equity Breakdown"
          icon={<Wallet size={18} className="text-accent" />}
          items={[
            { label: 'Initial Balance', value: `${stats.account.currency} ${stats.account.initialBalance.toLocaleString()}` },
            { label: 'Current Equity', value: `${stats.account.currency} ${stats.currentEquity.toLocaleString()}`, color: 'default' },
            { label: 'Absolute Gain', value: `${(stats.totalPnlAll || stats.totalPnl) >= 0 ? '+' : ''}${stats.account.currency} ${(stats.totalPnlAll || stats.totalPnl).toLocaleString()}`, color: (stats.totalPnlAll || stats.totalPnl) >= 0 ? 'green' : 'red' },
            { label: 'ROI', value: `${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(2)}%`, color: stats.roi >= 0 ? 'green' : 'red' },
            { label: 'Trading Days', value: `${stats.tradingDays} days`, icon: <Calendar size={14} /> },
            { label: 'Daily Avg P&L', value: `${stats.dailyAvgPnl >= 0 ? '+' : ''}${stats.account.currency} ${stats.dailyAvgPnl.toFixed(2)}`, color: stats.dailyAvgPnl >= 0 ? 'green' : 'red' },
          ]}
        >
          <Card className="bg-[#1a1a1a] dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 text-white border dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-400 dark:text-gray-300 text-sm">Current Equity</p>
              <h2 className="text-3xl font-bold mt-2">
                {stats.account.currency} {stats.currentEquity.toLocaleString()}
              </h2>
            </div>
              <div className="p-3 bg-white/10 dark:bg-white/5 rounded-full">
              <Wallet size={20} className="text-accent" />
            </div>
          </div>
          <div className="mt-8 flex gap-2">
            <span className={`text-sm ${(stats.totalPnlAll || stats.totalPnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(stats.totalPnlAll || stats.totalPnl) >= 0 ? '+' : ''}{(stats.totalPnlAll || stats.totalPnl).toFixed(2)}
            </span>
               <span className="text-gray-400 dark:text-gray-500 text-sm">Total P&L</span>
          </div>
        </Card>
        </StatTooltip>

        {/* Win Rate Card with Tooltip */}
        <StatTooltip
          title="Win Rate Analysis"
          icon={<Target size={18} className="text-orange-400" />}
          items={[
            { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, color: 'default' },
            { label: 'Winning Trades', value: stats.winningTrades, color: 'green', icon: <Trophy size={14} /> },
            { label: 'Losing Trades', value: stats.losingTrades, color: 'red', icon: <TrendingDown size={14} /> },
            { label: 'Total Trades', value: stats.totalTrades },
            { 
              label: 'Current Streak', 
              value: stats.streaks.currentStreakType === 'win' 
                ? `🔥 ${stats.streaks.currentStreak}W` 
                : stats.streaks.currentStreakType === 'loss' 
                  ? `❄️ ${stats.streaks.currentStreak}L` 
                  : 'None',
              color: stats.streaks.currentStreakType === 'win' ? 'green' : stats.streaks.currentStreakType === 'loss' ? 'red' : 'default'
            },
            { label: 'Best Streak', value: `🏆 ${stats.streaks.bestWinStreak}W`, color: 'green' },
            { label: 'Worst Streak', value: `⚠️ ${stats.streaks.worstLossStreak}L`, color: 'red' },
          ]}
        >
          <Card className="bg-orange-50/50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30">
           <div className="flex justify-between items-start">
            <div>
                <p className="text-secondary dark:text-gray-400 text-sm">Win Rate</p>
                <h2 className="text-3xl font-bold mt-2 text-primary dark:text-white">{stats.winRate}%</h2>
              </div>
              <div className="p-3 bg-white dark:bg-orange-800/30 rounded-full shadow-sm">
                <Target size={20} className="text-orange-400 dark:text-orange-300" />
            </div>
          </div>
          <div className="mt-8">
               <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                    className="bg-orange-400 dark:bg-orange-500 h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.winRate}%` }}
                ></div>
             </div>
          </div>
        </Card>
        </StatTooltip>

        {/* Profit Factor Card with Tooltip */}
        <StatTooltip
          title="Profit Analysis"
          icon={<Activity size={18} className="text-blue-500" />}
          items={[
            { label: 'Profit Factor', value: stats.profitFactor.toFixed(2), color: stats.profitFactor >= 2 ? 'green' : stats.profitFactor >= 1 ? 'default' : 'red' },
            { label: 'Total Wins', value: `+${stats.account.currency} ${(stats.avgWin * stats.winningTrades).toFixed(2)}`, color: 'green' },
            { label: 'Total Losses', value: `${stats.account.currency} ${(stats.avgLoss * stats.losingTrades).toFixed(2)}`, color: 'red' },
            { label: 'Average Win', value: `+${stats.account.currency} ${stats.avgWin.toFixed(2)}`, color: 'green' },
            { label: 'Average Loss', value: `${stats.account.currency} ${stats.avgLoss.toFixed(2)}`, color: 'red' },
            { label: 'Expectancy', value: `${stats.expectancy >= 0 ? '+' : ''}${stats.account.currency} ${stats.expectancy}`, color: stats.expectancy >= 0 ? 'green' : 'red', icon: <Zap size={14} /> },
            { label: 'Avg R:R', value: `${stats.avgRR}R`, color: stats.avgRR >= 2 ? 'green' : stats.avgRR >= 1 ? 'default' : 'red' },
          ]}
        >
          <Card className="dark:border dark:border-gray-700">
           <div className="flex justify-between items-start">
            <div>
                <p className="text-secondary dark:text-gray-400 text-sm">Profit Factor</p>
                <h2 className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stats.profitFactor}</h2>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full">
                <Activity size={20} className="text-blue-500 dark:text-blue-400" />
              </div>
            </div>
             <div className="mt-8 flex gap-2 items-center">
              <span className="text-sm text-secondary dark:text-gray-400">Avg R:R</span>
              <span className="text-sm font-bold text-primary dark:text-white">{stats.avgRR}R</span>
          </div>
        </Card>
        </StatTooltip>

        {/* Drawdown Card with Tooltip */}
        <StatTooltip
          title="Risk Management"
          icon={<AlertTriangle size={18} className={ddStatus.color} />}
          items={[
            { label: 'Current DD', value: `${stats.account.currency} ${stats.currentDrawdown.toFixed(2)}`, color: 'red' },
            { label: 'Max DD Allowed', value: stats.account.maxDrawdownLimit ? `${stats.account.currency} ${stats.account.maxDrawdownLimit}` : 'N/A' },
            { label: 'DD Usage', value: stats.account.maxDrawdownLimit ? `${ddStatus.percent.toFixed(1)}%` : 'N/A', color: ddStatus.status === 'Safe' ? 'green' : ddStatus.status === 'Warning' ? 'yellow' : 'red' },
            { label: 'Safety Margin', value: stats.account.maxDrawdownLimit ? `${stats.account.currency} ${(stats.account.maxDrawdownLimit - stats.currentDrawdown).toFixed(2)}` : 'N/A', color: 'green' },
            { label: 'Peak Equity', value: `${stats.account.currency} ${(stats.account.initialBalance + (stats.totalPnlAll || stats.totalPnl) + stats.currentDrawdown).toFixed(2)}`, icon: <Trophy size={14} /> },
            { label: 'Days in DD', value: stats.daysInDD > 0 ? `${stats.daysInDD} days` : 'At Peak 🎯', icon: <Calendar size={14} />, color: stats.daysInDD > 0 ? 'yellow' : 'green' },
            { label: 'Status', value: ddStatus.status, color: ddStatus.status === 'Safe' ? 'green' : ddStatus.status === 'Warning' ? 'yellow' : 'red' },
          ]}
        >
          <Card className={`${ddStatus.status !== 'Safe' ? 'border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10' : 'dark:border dark:border-gray-700'}`}>
           <div className="flex justify-between items-start">
            <div>
                <p className="text-secondary dark:text-gray-400 text-sm">Drawdown</p>
              <h2 className={`text-3xl font-bold mt-2 ${ddStatus.color}`}>
                -{stats.currentDrawdown}
              </h2>
            </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-full">
              <AlertTriangle size={20} className={ddStatus.color} />
            </div>
          </div>
            <div className="mt-8 text-sm text-secondary dark:text-gray-400">
             Max Limit: {stats.account.maxDrawdownLimit || 'N/A'}
             {stats.account.maxDrawdownLimit && (
                 <span className={`ml-2 text-xs font-bold px-2 py-1 rounded-full ${ddStatus.color} bg-white dark:bg-gray-800 border border-current opacity-80`}>
                 {ddStatus.percent.toFixed(1)}% Used
               </span>
             )}
          </div>
        </Card>
        </StatTooltip>
      </div>

      {/* Stats Comparison */}
      {stats.totalTrades > 0 && previousStats.totalTrades > 0 && (
        <StatsComparison
          currentPeriod={{
            label: 'Current Period',
            winRate: stats.winRate,
            profitFactor: stats.profitFactor,
            totalPnl: stats.totalPnl,
            totalTrades: stats.totalTrades
          }}
          previousPeriod={{
            label: 'Previous Period',
            winRate: previousStats.winRate,
            profitFactor: previousStats.profitFactor,
            totalPnl: previousStats.totalPnl,
            totalTrades: previousStats.totalTrades
          }}
        />
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve */}
        <div className="lg:col-span-2">
          <Card title="Equity Curve" className="h-full min-h-[400px] dark:border dark:border-gray-700">
             {stats.totalTrades === 0 ? (
               <EmptyState
                 icon={TrendingUp}
                 title="No Trades Yet"
                 description="Start adding trades to see your equity curve."
                 actionLabel="Add Trade"
                 onAction={() => window.location.hash = '/journal'}
               />
             ) : (
             <div className="h-[350px] w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={stats.equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f3b43f" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f3b43f" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                      stroke="#9ca3af"
                        className="dark:stroke-gray-500"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                        className="dark:stroke-gray-500"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                      allowDataOverflow={false}
                      tickFormatter={(value) => {
                        // Formatta i valori per mostrare correttamente l'equity
                        if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                        return value.toFixed(0);
                      }}
                    />
                    <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: '1px solid #e5e7eb', 
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                          backgroundColor: 'white',
                          padding: '12px 16px',
                        }}
                        labelStyle={{
                          color: '#6b7280',
                          fontSize: '12px',
                          fontWeight: '600',
                          marginBottom: '4px',
                        }}
                        itemStyle={{
                          color: '#1f2937',
                          fontSize: '14px',
                          fontWeight: '700',
                        }}
                        formatter={(value: number) => [`${stats.account.currency} ${value.toLocaleString()}`, 'Equity']}
                        labelFormatter={(label: string) => {
                          const date = new Date(label);
                          return date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          });
                        }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#f3b43f" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorEquity)" 
                    />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
             )}
          </Card>
        </div>

        {/* Challenge Progress / Info */}
        <div className="space-y-6">
           <Card title="Account Info" className="dark:border dark:border-gray-700">
              <div className="space-y-4 mt-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-700">
                  <span className="text-secondary dark:text-gray-400 text-sm">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold 
                    ${stats.account.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'}`}>
                    {stats.account.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-700">
                  <span className="text-secondary dark:text-gray-400 text-sm">Phase</span>
                  <span className="font-medium text-sm text-gray-900 dark:text-white">{stats.account.phase || 'N/A'}</span>
                </div>
                {stats.account.challengeCost && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-700">
                    <span className="text-secondary dark:text-gray-400 text-sm">Break Even Target</span>
                    <div className="text-right">
                       <p className="font-medium text-sm text-gray-900 dark:text-white">{stats.account.challengeCost} {stats.account.currency}</p>
                       <p className="text-xs text-secondary dark:text-gray-400">
                         {(stats.totalPnlAll || stats.totalPnl) >= (stats.account.challengeCost || 0) 
                          ? <span className="text-green-500 dark:text-green-400">Achieved</span> 
                          : `${(((stats.totalPnlAll || stats.totalPnl) / (stats.account.challengeCost || 1)) * 100).toFixed(1)}%`
                         }
                       </p>
                    </div>
                  </div>
                )}
              </div>
           </Card>

           <Card title="Quick Stats" className="dark:border dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                 {/* Best Trade with Tooltip */}
                 <StatTooltip
                   title="Best Trade"
                   icon={<Trophy size={18} className="text-green-500" />}
                   items={(() => {
                     const bestTrade = stats.filteredTrades?.filter(t => t.status === TradeStatus.CLOSED).reduce((max, t) => t.totalPnl > max.totalPnl ? t : max, { totalPnl: -Infinity });
                     if (!bestTrade || bestTrade.totalPnl === -Infinity) {
                       return [{ label: 'No trades yet', value: '-' }];
                     }
                    return [
                      { label: 'Pair', value: bestTrade.pair },
                      { label: 'P&L', value: `+${stats.account.currency} ${bestTrade.totalPnl.toFixed(2)}`, color: 'green' },
                      { label: 'R:R', value: `${bestTrade.riskReward}R`, color: 'green' },
                      { label: 'Direction', value: bestTrade.direction, color: bestTrade.direction === 'LONG' ? 'green' : 'red' },
                      { label: 'Lots', value: bestTrade.lots?.toString() || '0' },
                    ];
                   })()}
                   side="bottom"
                 >
                   <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 cursor-help">
                      <div className="flex items-center gap-2 mb-2 text-green-500 dark:text-green-400">
                       <TrendingUp size={16} />
                       <span className="text-xs font-bold uppercase">Best</span>
                    </div>
                      <p className="font-bold text-lg text-gray-900 dark:text-white">+{stats.bestTrade}</p>
                 </div>
                 </StatTooltip>

                 {/* Worst Trade with Tooltip */}
                 <StatTooltip
                   title="Worst Trade"
                   icon={<TrendingDownIcon size={18} className="text-red-500" />}
                   items={(() => {
                     const worstTrade = stats.filteredTrades?.filter(t => t.status === TradeStatus.CLOSED).reduce((min, t) => t.totalPnl < min.totalPnl ? t : min, { totalPnl: Infinity });
                     if (!worstTrade || worstTrade.totalPnl === Infinity) {
                       return [{ label: 'No trades yet', value: '-' }];
                     }
                    return [
                      { label: 'Pair', value: worstTrade.pair },
                      { label: 'P&L', value: `${stats.account.currency} ${worstTrade.totalPnl.toFixed(2)}`, color: 'red' },
                      { label: 'R:R', value: `${worstTrade.riskReward}R`, color: 'red' },
                      { label: 'Direction', value: worstTrade.direction, color: worstTrade.direction === 'LONG' ? 'green' : 'red' },
                      { label: 'Lots', value: worstTrade.lots?.toString() || '0' },
                    ];
                   })()}
                   side="bottom"
                 >
                   <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 cursor-help">
                      <div className="flex items-center gap-2 mb-2 text-red-500 dark:text-red-400">
                       <TrendingDown size={16} />
                       <span className="text-xs font-bold uppercase">Worst</span>
                    </div>
                      <p className="font-bold text-lg text-gray-900 dark:text-white">{stats.worstTrade}</p>
                 </div>
                 </StatTooltip>
              </div>
           </Card>

           {stats.totalTrades > 0 && (
             <button
               onClick={() => setShowAdvancedCharts(!showAdvancedCharts)}
               className="w-full bg-accent hover:bg-accent/90 dark:bg-accent/90 dark:hover:bg-accent text-white px-4 py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
             >
               <BarChart3 size={20} />
               {showAdvancedCharts ? 'Hide' : 'Show'} Advanced Charts
             </button>
           )}
        </div>
      </div>

      {/* Advanced Charts */}
      {showAdvancedCharts && stats.filteredTrades?.length > 0 && (
        <AdvancedCharts trades={stats.filteredTrades} />
      )}

      {/* Create Account Modal */}
      <CreateAccountModal onAccountCreated={handleAccountCreated} />
    </div>
  );
};
