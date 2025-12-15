import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Account, Trade } from '../types';
import { StorageService } from '../services/storageService';
import { calculateAccountStats, getDrawdownStatus } from '../utils/calculations';
import { TrendingUp, TrendingDown, AlertTriangle, Wallet, Activity, Target } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

export const Dashboard = () => {
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const loadedAccounts = StorageService.getAccounts();
    const loadedTrades = StorageService.getTrades();
    setAccounts(loadedAccounts);
    setTrades(loadedTrades);
    
    if (loadedAccounts.length > 0 && !selectedAccount) {
      setSelectedAccount(loadedAccounts[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      const account = accounts.find(a => a.id === selectedAccount);
      const accountTrades = trades.filter(t => t.accountId === selectedAccount);
      
      if (account) {
        setStats({
          ...calculateAccountStats(account, accountTrades),
          account
        });
      }
    }
  }, [selectedAccount, accounts, trades]);

  if (!stats) return <div className="p-8">Loading...</div>;

  const ddStatus = getDrawdownStatus(stats.currentDrawdown, stats.account.maxDrawdownLimit);
  
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, Trader</h1>
          <p className="text-secondary mt-1">Here's what's happening with your portfolio today.</p>
        </div>
        <div className="w-full md:w-64">
          <select 
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent/50 cursor-pointer"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[#1a1a1a] text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Current Equity</p>
              <h2 className="text-3xl font-bold mt-2">
                {stats.account.currency} {stats.currentEquity.toLocaleString()}
              </h2>
            </div>
            <div className="p-3 bg-white/10 rounded-full">
              <Wallet size={20} className="text-accent" />
            </div>
          </div>
          <div className="mt-8 flex gap-2">
            <span className={`text-sm ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl}
            </span>
             <span className="text-gray-500 text-sm">Total P&L</span>
          </div>
        </Card>

        <Card className="bg-orange-50/50 border border-orange-100">
           <div className="flex justify-between items-start">
            <div>
              <p className="text-secondary text-sm">Win Rate</p>
              <h2 className="text-3xl font-bold mt-2 text-primary">{stats.winRate}%</h2>
            </div>
            <div className="p-3 bg-white rounded-full shadow-sm">
              <Target size={20} className="text-orange-400" />
            </div>
          </div>
          <div className="mt-8">
             <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-400 h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.winRate}%` }}
                ></div>
             </div>
          </div>
        </Card>

        <Card>
           <div className="flex justify-between items-start">
            <div>
              <p className="text-secondary text-sm">Profit Factor</p>
              <h2 className="text-3xl font-bold mt-2">{stats.profitFactor}</h2>
            </div>
            <div className="p-3 bg-gray-50 rounded-full">
              <Activity size={20} className="text-blue-500" />
            </div>
          </div>
           <div className="mt-8 flex gap-2 items-center">
            <span className="text-sm text-secondary">Avg R:R</span>
            <span className="text-sm font-bold text-primary">{stats.avgRR}R</span>
          </div>
        </Card>

        <Card className={`${ddStatus.status !== 'Safe' ? 'border-red-100 bg-red-50/30' : ''}`}>
           <div className="flex justify-between items-start">
            <div>
              <p className="text-secondary text-sm">Drawdown</p>
              <h2 className={`text-3xl font-bold mt-2 ${ddStatus.color}`}>
                -{stats.currentDrawdown}
              </h2>
            </div>
            <div className="p-3 bg-gray-50 rounded-full">
              <AlertTriangle size={20} className={ddStatus.color} />
            </div>
          </div>
          <div className="mt-8 text-sm text-secondary">
             Max Limit: {stats.account.maxDrawdownLimit || 'N/A'}
             {stats.account.maxDrawdownLimit && (
               <span className={`ml-2 text-xs font-bold px-2 py-1 rounded-full ${ddStatus.color} bg-white border border-current opacity-80`}>
                 {ddStatus.percent.toFixed(1)}% Used
               </span>
             )}
          </div>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve */}
        <div className="lg:col-span-2">
          <Card title="Equity Curve" className="h-full min-h-[400px]">
             <div className="h-[350px] w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={stats.equityCurve}>
                    <defs>
                      <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f3b43f" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f3b43f" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
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
          </Card>
        </div>

        {/* Challenge Progress / Info */}
        <div className="space-y-6">
           <Card title="Account Info">
              <div className="space-y-4 mt-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-secondary text-sm">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold 
                    ${stats.account.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {stats.account.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-secondary text-sm">Phase</span>
                  <span className="font-medium text-sm">{stats.account.phase || 'N/A'}</span>
                </div>
                {stats.account.challengeCost && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-secondary text-sm">Break Even Target</span>
                    <div className="text-right">
                       <p className="font-medium text-sm">{stats.account.challengeCost} {stats.account.currency}</p>
                       <p className="text-xs text-secondary">
                         {stats.totalPnl >= (stats.account.challengeCost || 0) 
                          ? <span className="text-green-500">Achieved</span> 
                          : `${((stats.totalPnl / (stats.account.challengeCost || 1)) * 100).toFixed(1)}%`
                         }
                       </p>
                    </div>
                  </div>
                )}
              </div>
           </Card>

           <Card title="Quick Stats">
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2 text-green-500">
                       <TrendingUp size={16} />
                       <span className="text-xs font-bold uppercase">Best</span>
                    </div>
                    <p className="font-bold text-lg">+{stats.bestTrade}</p>
                 </div>
                 <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2 text-red-500">
                       <TrendingDown size={16} />
                       <span className="text-xs font-bold uppercase">Worst</span>
                    </div>
                    <p className="font-bold text-lg">{stats.worstTrade}</p>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};
