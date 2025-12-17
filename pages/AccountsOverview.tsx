import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { BackButton } from '../components/ui/BackButton';
import { Account, Trade } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { calculateAccountStats } from '../utils/calculations';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, BookOpen, Target, Shield, Activity, Calendar, ExternalLink, Edit, Download, Trophy, XCircle, CheckCircle, AlertCircle, GitCompare, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion'; // Temporarily disabled to fix build issue
import { format, differenceInDays } from 'date-fns';

export const AccountsOverview = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accountsStats, setAccountsStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const loadedAccounts = await SupabaseService.getAccounts();
        const loadedTrades = await SupabaseService.getTrades();
        setAccounts(loadedAccounts);
        setTrades(loadedTrades);

        // Calculate stats for each account
        const stats = loadedAccounts.map(account => {
          const accountTrades = loadedTrades.filter(t => t.accountId === account.id);
          return {
            account,
            ...calculateAccountStats(account, accountTrades)
          };
        });
        setAccountsStats(stats);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'REAL': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'DEMO': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'PROP': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      case 'FUNDED': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  const getTotalStats = () => {
    const totalEquity = accountsStats.reduce((sum, s) => sum + s.currentEquity, 0);
    const totalPnl = accountsStats.reduce((sum, s) => sum + s.totalPnl, 0);
    const avgWinRate = accountsStats.length > 0 
      ? accountsStats.reduce((sum, s) => sum + s.winRate, 0) / accountsStats.length 
      : 0;
    const totalTrades = accountsStats.reduce((sum, s) => sum + s.totalTrades, 0);

    return { totalEquity, totalPnl, avgWinRate, totalTrades };
  };

  const toggleExpand = (accountId: string) => {
    setExpandedAccountId(prevId => (prevId === accountId ? null : accountId));
  };

  const toggleSelectAccount = (accountId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row expand
    setSelectedAccountIds(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleCompare = () => {
    if (selectedAccountIds.length < 2) {
      return; // Need at least 2 accounts
    }
    setShowCompare(true);
  };

  const getCompareStats = () => {
    return accountsStats.filter(stat => selectedAccountIds.includes(stat.account.id));
  };

  const getAccountTrades = (accountId: string) => {
    return trades.filter(t => t.accountId === accountId);
  };

  const getPhaseProgress = (account: Account, stat: any) => {
    if (account.type !== 'PROP' || !account.phase) return null;

    let target = 0;
    let current = account.currentPhasePnL || 0;

    if (account.phase === 'PHASE_1') {
      target = account.phase1ProfitTarget || 0;
    } else if (account.phase === 'PHASE_2') {
      target = account.phase2ProfitTarget || 0;
    } else if (account.phase === 'FUNDED') {
      target = account.fundedProfitTarget || 0;
    }

    const progress = target > 0 ? (current / target) * 100 : 0;
    return { target, current, progress: Math.min(progress, 100) };
  };

  const getPhaseStatus = (account: Account, stat: any) => {
    const progress = getPhaseProgress(account, stat);
    if (!progress) return { status: 'N/A', color: 'gray' };

    if (progress.progress >= 100) {
      return { status: 'Completed', color: 'green', icon: CheckCircle };
    } else if (progress.progress >= 70) {
      return { status: 'On Track', color: 'green', icon: CheckCircle };
    } else if (progress.progress >= 40) {
      return { status: 'In Progress', color: 'yellow', icon: AlertCircle };
    } else {
      return { status: 'Early Stage', color: 'gray', icon: Activity };
    }
  };

  const getDaysActive = (account: Account) => {
    const createdDate = new Date(account.createdAt);
    const today = new Date();
    return differenceInDays(today, createdDate);
  };

  const getDrawdownPercentage = (stat: any) => {
    if (!stat.maxDrawdown || stat.account.initialBalance === 0) return 0;
    return (Math.abs(stat.maxDrawdown) / stat.account.initialBalance) * 100;
  };

  const totals = getTotalStats();

  return (
    <div className="max-w-7xl mx-auto">
      <BackButton to="/" label="Back to Dashboard" />
      
      <div className="mt-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Accounts Overview</h1>
        <p className="text-gray-600 dark:text-gray-400">Complete performance overview of all your trading accounts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card animate={false} className="dark:border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Equity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${totals.totalEquity.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <DollarSign size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card animate={false} className="dark:border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total P&L</p>
              <p className={`text-2xl font-bold mt-1 ${totals.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {totals.totalPnl >= 0 ? '+' : ''}${totals.totalPnl.toFixed(2)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${totals.totalPnl >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {totals.totalPnl >= 0 ? (
                <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown size={24} className="text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
        </Card>

        <Card animate={false} className="dark:border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Win Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {totals.avgWinRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <BarChart3 size={24} className="text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>

        <Card animate={false} className="dark:border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {accounts.length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <span className="text-2xl">💼</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Accounts Table */}
      <Card className="mt-8 dark:border dark:border-gray-700">
        {/* Compare Bar */}
        {selectedAccountIds.length > 0 && (
          <div className="p-4 bg-accent-soft dark:bg-accent/10 border-b border-accent/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedAccountIds.length} account{selectedAccountIds.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedAccountIds([])}
                className="text-sm text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors"
              >
                Clear selection
              </button>
            </div>
            <button
              onClick={handleCompare}
              disabled={selectedAccountIds.length < 2}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                selectedAccountIds.length >= 2
                  ? 'bg-accent hover:bg-accent/90 text-white shadow-soft hover:shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <GitCompare size={18} />
              Compare Selected
            </button>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-center py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm w-12">
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAccountIds.length === accountsStats.length && accountsStats.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAccountIds(accountsStats.map(s => s.account.id));
                          } else {
                            setSelectedAccountIds([]);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg peer-checked:bg-accent peer-checked:border-accent peer-focus:ring-2 peer-focus:ring-accent/50 transition-all duration-200 flex items-center justify-center">
                        {selectedAccountIds.length === accountsStats.length && accountsStats.length > 0 && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </label>
                  </div>
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Account</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Type</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Broker</th>
                <th className="text-right py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Balance</th>
                <th className="text-right py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Equity</th>
                <th className="text-right py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">P&L</th>
                <th className="text-right py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Win Rate</th>
                <th className="text-right py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Profit Factor</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Trades</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {accountsStats.map((stat, index) => (
                <React.Fragment key={stat.account.id}>
                  <tr
                    onClick={() => toggleExpand(stat.account.id)}
                    className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors ${
                      expandedAccountId === stat.account.id ? 'bg-accent/5 dark:bg-accent/10' : ''
                    } ${selectedAccountIds.includes(stat.account.id) ? 'bg-accent/10 dark:bg-accent/20' : ''}`}
                  >
                    <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedAccountIds.includes(stat.account.id)}
                            onChange={(e) => toggleSelectAccount(stat.account.id, e as any)}
                            onClick={(e) => e.stopPropagation()}
                            className="sr-only peer"
                          />
                          <div className="w-5 h-5 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg peer-checked:bg-accent peer-checked:border-accent peer-focus:ring-2 peer-focus:ring-accent/50 transition-all duration-200 flex items-center justify-center">
                            {selectedAccountIds.includes(stat.account.id) && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </label>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{stat.account.name}</p>
                        {stat.account.phase && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.account.phase}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(stat.account.type)}`}>
                        {stat.account.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{stat.account.broker}</td>
                    <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
                      {stat.account.currency} {stat.account.initialBalance.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-gray-900 dark:text-white">
                      {stat.account.currency} {stat.currentEquity.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`font-bold ${stat.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stat.totalPnl >= 0 ? '+' : ''}{stat.totalPnl.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
                      {stat.winRate.toFixed(1)}%
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
                      {stat.profitFactor.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium text-gray-900 dark:text-white">
                        {stat.totalTrades}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        stat.account.status === 'ACTIVE' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                      }`}>
                        {stat.account.status}
                      </span>
                    </td>
                  </tr>

                  {/* Expandable Row */}
                  {expandedAccountId === stat.account.id && (
                      <tr>
                        <td colSpan={10} className="p-0">
                          <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                            {/* Main Grid - 3 Columns */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                              {/* Column 1: Account Details */}
                              <div className="space-y-4">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                  <BookOpen size={20} className="text-accent" />
                                  Account Information
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Account Name:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{stat.account.name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Broker:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{stat.account.broker}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Currency:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{stat.account.currency}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Account Type:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getTypeColor(stat.account.type)}`}>
                                      {stat.account.type}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Created:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {format(new Date(stat.account.createdAt), 'dd MMM yyyy')}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                      stat.account.status === 'ACTIVE' 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                    }`}>
                                      {stat.account.status}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Days Active:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {getDaysActive(stat.account)} days
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Column 2: Performance Metrics */}
                              <div className="space-y-4">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                  <TrendingUp size={20} className="text-accent" />
                                  Performance
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Current Equity:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                      {stat.account.currency} {stat.currentEquity.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Initial Balance:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {stat.account.currency} {stat.account.initialBalance.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Total P&L:</span>
                                    <span className={`font-bold ${stat.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      {stat.totalPnl >= 0 ? '+' : ''}{stat.account.currency} {stat.totalPnl.toFixed(2)}
                                      {' '}({stat.totalPnl >= 0 ? '+' : ''}{((stat.totalPnl / stat.account.initialBalance) * 100).toFixed(2)}%)
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Best Trade:</span>
                                    <span className="font-semibold text-green-600 dark:text-green-400">
                                      +{stat.account.currency} {stat.bestTrade?.toFixed(2) || '0.00'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Worst Trade:</span>
                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                      {stat.account.currency} {stat.worstTrade?.toFixed(2) || '0.00'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Average Win:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {stat.account.currency} {stat.avgWin?.toFixed(2) || '0.00'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Average Loss:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {stat.account.currency} {stat.avgLoss?.toFixed(2) || '0.00'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Column 3: Risk Management */}
                              <div className="space-y-4">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                  <Shield size={20} className="text-accent" />
                                  Risk & Goals
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Max Drawdown:</span>
                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                      {stat.account.currency} {stat.maxDrawdown?.toFixed(2) || '0.00'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Drawdown %:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {getDrawdownPercentage(stat).toFixed(2)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Daily Loss Limit:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {stat.account.currency} {stat.account.dailyLossLimit || 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Break-Even Target:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {stat.account.currency} {(stat.account.initialBalance * 0.005).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Win Rate:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                      {stat.winRate.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Profit Factor:</span>
                                    <span className={`font-bold ${stat.profitFactor >= 2 ? 'text-green-600 dark:text-green-400' : stat.profitFactor >= 1 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                                      {stat.profitFactor.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Risk of Ruin:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {stat.winRate >= 60 ? 'Low' : stat.winRate >= 50 ? 'Medium' : 'High'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* PROP Challenge Section */}
                            {stat.account.type === 'PROP' && stat.account.phase && (
                              <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                  <Target size={20} className="text-accent" />
                                  Challenge Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Challenge Type:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                          {stat.account.challengeType === 'ONE_PHASE' ? '1-Phase Challenge' : 
                                           stat.account.challengeType === 'TWO_PHASE' ? '2-Phase Challenge' : 
                                           'Instant Funding'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Current Phase:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                          {stat.account.phase === 'PHASE_1' ? 'Phase 1' : 
                                           stat.account.phase === 'PHASE_2' ? 'Phase 2' : 
                                           stat.account.phase === 'FUNDED' ? 'Funded' : 'Instant'}
                                          {stat.account.challengeType === 'TWO_PHASE' && stat.account.phase !== 'FUNDED' && ' of 2'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Profit Split:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                          {stat.account.profitSplitPercent || 80}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    {getPhaseProgress(stat.account, stat) && (
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-500 dark:text-gray-400">Phase Progress:</span>
                                          <span className="font-bold text-accent">
                                            {stat.account.currency} {(stat.account.currentPhasePnL || 0).toFixed(2)} / {stat.account.currency} {getPhaseProgress(stat.account, stat)!.target.toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                                          <div
                                            style={{ width: `${getPhaseProgress(stat.account, stat)!.progress}%` }}
                                            className="h-full bg-gradient-to-r from-accent to-orange-500 rounded-full"
                                          />
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                          <span className="font-bold text-gray-900 dark:text-white">
                                            {getPhaseProgress(stat.account, stat)!.progress.toFixed(1)}%
                                          </span>
                                          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                                            getPhaseStatus(stat.account, stat).color === 'green' 
                                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                              : getPhaseStatus(stat.account, stat).color === 'yellow'
                                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                          }`}>
                                            {React.createElement(getPhaseStatus(stat.account, stat).icon, { size: 14 })}
                                            {getPhaseStatus(stat.account, stat).status}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Trading Activity Section */}
                            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 mb-4">
                              <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                                <Activity size={20} className="text-accent" />
                                Trading Activity
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400 block mb-1">Total Trades</span>
                                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.totalTrades}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400 block mb-1">Win Rate</span>
                                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stat.winRate.toFixed(1)}%</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                    {stat.winningTrades}W / {stat.losingTrades}L
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400 block mb-1">Best Day</span>
                                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                    +{stat.account.currency} {(stat.bestTrade || 0).toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400 block mb-1">Worst Day</span>
                                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                    {stat.account.currency} {(stat.worstTrade || 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/journal?account=${stat.account.id}`);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold transition-colors"
                              >
                                <ExternalLink size={16} />
                                View All Trades
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/accounts`);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
                              >
                                <Edit size={16} />
                                Edit Account
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Export functionality here
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors"
                              >
                                <Download size={16} />
                                Export Data
                              </button>
                            </div>
                          </div>
                        </td>
                        </tr>
                      )}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

        {/* Compare Modal */}
        {showCompare && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setShowCompare(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            
            {/* Modal */}
            <div
              className="fixed inset-4 md:inset-10 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-accent/10 to-accent/5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent rounded-xl">
                    <GitCompare size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Compare Accounts
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Side-by-side comparison of {selectedAccountIds.length} accounts
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompare(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  aria-label="Close"
                >
                  <X size={24} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                      <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                        <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Metric
                        </th>
                        {getCompareStats().map(stat => (
                          <th key={stat.account.id} className="text-center py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 min-w-[150px]">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-base">{stat.account.name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getTypeColor(stat.account.type)}`}>
                                {stat.account.type}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Initial Balance */}
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Initial Balance
                        </td>
                        {getCompareStats().map(stat => (
                          <td key={stat.account.id} className="py-3 px-4 text-center text-gray-900 dark:text-white">
                            {stat.account.currency} {stat.account.initialBalance.toLocaleString()}
                          </td>
                        ))}
                      </tr>

                      {/* Current Equity */}
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Current Equity
                        </td>
                        {getCompareStats().map(stat => (
                          <td key={stat.account.id} className="py-3 px-4 text-center font-bold text-gray-900 dark:text-white">
                            {stat.account.currency} {stat.currentEquity.toLocaleString()}
                          </td>
                        ))}
                      </tr>

                      {/* Total P&L */}
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Total P&L
                        </td>
                        {getCompareStats().map(stat => (
                          <td key={stat.account.id} className="py-3 px-4 text-center">
                            <span className={`font-bold ${stat.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {stat.totalPnl >= 0 ? '+' : ''}{stat.totalPnl.toFixed(2)}
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* ROI */}
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          ROI %
                        </td>
                        {getCompareStats().map(stat => {
                          const roi = ((stat.totalPnl / stat.account.initialBalance) * 100);
                          return (
                            <td key={stat.account.id} className="py-3 px-4 text-center">
                              <span className={`font-bold ${roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                              </span>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Win Rate */}
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Win Rate
                        </td>
                        {getCompareStats().map(stat => (
                          <td key={stat.account.id} className="py-3 px-4 text-center font-medium text-gray-900 dark:text-white">
                            {stat.winRate.toFixed(1)}%
                          </td>
                        ))}
                      </tr>

                      {/* Profit Factor */}
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Profit Factor
                        </td>
                        {getCompareStats().map(stat => (
                          <td key={stat.account.id} className="py-3 px-4 text-center font-bold text-gray-900 dark:text-white">
                            {stat.profitFactor.toFixed(2)}
                          </td>
                        ))}
                      </tr>

                      {/* Total Trades */}
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Total Trades
                        </td>
                        {getCompareStats().map(stat => (
                          <td key={stat.account.id} className="py-3 px-4 text-center text-gray-900 dark:text-white">
                            {stat.totalTrades}
                          </td>
                        ))}
                      </tr>

                      {/* Max Drawdown */}
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Max Drawdown
                        </td>
                        {getCompareStats().map(stat => (
                          <td key={stat.account.id} className="py-3 px-4 text-center text-red-600 dark:text-red-400 font-medium">
                            {(stat.maxDrawdown || 0).toFixed(2)}
                          </td>
                        ))}
                      </tr>

                      {/* Best Trade */}
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Best Trade
                        </td>
                        {getCompareStats().map(stat => (
                          <td key={stat.account.id} className="py-3 px-4 text-center text-green-600 dark:text-green-400 font-medium">
                            +{(stat.bestTrade || 0).toFixed(2)}
                          </td>
                        ))}
                      </tr>

                      {/* Worst Trade */}
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Worst Trade
                        </td>
                        {getCompareStats().map(stat => (
                          <td key={stat.account.id} className="py-3 px-4 text-center text-red-600 dark:text-red-400 font-medium">
                            {(stat.worstTrade || 0).toFixed(2)}
                          </td>
                        ))}
                      </tr>

                      {/* Avg Win */}
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Average Win
                        </td>
                        {getCompareStats().map(stat => (
                          <td key={stat.account.id} className="py-3 px-4 text-center text-green-600 dark:text-green-400">
                            +{(stat.avgWin || 0).toFixed(2)}
                          </td>
                        ))}
                      </tr>

                      {/* Avg Loss */}
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Average Loss
                        </td>
                        {getCompareStats().map(stat => (
                          <td key={stat.account.id} className="py-3 px-4 text-center text-red-600 dark:text-red-400">
                            {(stat.avgLoss || 0).toFixed(2)}
                          </td>
                        ))}
                      </tr>

                      {/* Avg R:R */}
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Avg Risk:Reward
                        </td>
                        {getCompareStats().map(stat => (
                          <td key={stat.account.id} className="py-3 px-4 text-center font-medium text-gray-900 dark:text-white">
                            {stat.avgRR}R
                          </td>
                        ))}
                      </tr>

                      {/* Expectancy */}
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Expectancy
                        </td>
                        {getCompareStats().map(stat => (
                          <td key={stat.account.id} className="py-3 px-4 text-center">
                            <span className={`font-medium ${stat.expectancy >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {stat.expectancy >= 0 ? '+' : ''}{stat.expectancy}
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* Days Active */}
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Days Active
                        </td>
                        {getCompareStats().map(stat => (
                          <td key={stat.account.id} className="py-3 px-4 text-center text-gray-900 dark:text-white">
                            {getDaysActive(stat.account)} days
                          </td>
                        ))}
                      </tr>

                      {/* Broker */}
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Broker
                        </td>
                        {getCompareStats().map(stat => (
                          <td key={stat.account.id} className="py-3 px-4 text-center text-gray-900 dark:text-white">
                            {stat.account.broker}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            </>
          )}
      </div>
    );
};

