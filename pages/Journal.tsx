import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Trade, TradeDirection, TradeStatus, Account } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { TRADING_PAIRS } from '../constants';
import { calculateRiskReward } from '../utils/calculations';
import { Plus, Trash2, Edit2, ArrowUpRight, ArrowDownRight, BookOpen, TrendingUp, TrendingDown, Lock, Unlock, Copy, X, Download, Move } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { BackButton } from '../components/ui/BackButton';
import { showSuccess, showError } from '../components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomSelect, SelectOption } from '../components/ui/CustomSelect';
import { handleNumberInputFocus } from '../utils/inputHelpers';
import { CustomDateTimePicker } from '../components/ui/CustomDateTimePicker';

// Prepare select options
const getPairOptions = (): SelectOption[] => {
  return TRADING_PAIRS.map(pair => ({
    value: pair,
    label: pair,
    icon: <TrendingUp size={18} className="text-accent" />
  }));
};

const statusOptions: SelectOption[] = [
  { value: TradeStatus.OPEN, label: 'OPEN', description: 'Active trade', icon: <Unlock size={18} className="text-blue-500" /> },
  { value: TradeStatus.CLOSED, label: 'CLOSED', description: 'Completed trade', icon: <Lock size={18} className="text-gray-500" /> }
];

export const Journal = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; tradeId: string | null }>({
    isOpen: false,
    tradeId: null
  });
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  
  // Bulk Selection States
  const [selectedTradeIds, setSelectedTradeIds] = useState<string[]>([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [moveToAccountModal, setMoveToAccountModal] = useState(false);
  const [moveToAccountId, setMoveToAccountId] = useState('');
  
  // Filter States
  const [filterAccount, setFilterAccount] = useState('ALL');

  // Form State
  const [formData, setFormData] = useState<Partial<Trade>>({
    accountId: '',
    pair: 'EURUSD',
    direction: TradeDirection.LONG,
    openDatetime: new Date().toISOString().slice(0, 16),
    status: TradeStatus.CLOSED,
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    totalLots: 0.1,
    totalPnl: 0,
    commission: undefined,
    swap: undefined,
    notes: '',
    riskReward: 0,
    partials: []
  });

  // Date state for DateTimePicker
  const [tradeDate, setTradeDate] = useState<Date>(new Date());

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const loadedTrades = await SupabaseService.getTrades();
        const loadedAccounts = await SupabaseService.getAccounts();
        setTrades(loadedTrades);
        setAccounts(loadedAccounts);
        if (loadedAccounts.length > 0 && !formData.accountId) {
          setFormData(prev => ({ ...prev, accountId: loadedAccounts[0].id }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Update R:R when form numbers change
  useEffect(() => {
    if (formData.entryPrice && formData.stopLoss && formData.takeProfit && formData.direction) {
      const rr = calculateRiskReward(
        Number(formData.entryPrice), 
        Number(formData.stopLoss), 
        Number(formData.takeProfit), 
        formData.direction
      );
      setFormData(prev => ({ ...prev, riskReward: rr }));
    }
  }, [formData.entryPrice, formData.stopLoss, formData.takeProfit, formData.direction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountId) {
      showError("Please select an account");
      return;
    }

    try {
    const newTrade: Trade = {
      ...formData as Trade,
      id: editingId || uuidv4(),
      partials: formData.partials || []
    };

      await SupabaseService.saveTrade(newTrade);
      const loadedTrades = await SupabaseService.getTrades();
      setTrades(loadedTrades);
    setIsModalOpen(false);
    resetForm();
      showSuccess(editingId ? 'Trade updated successfully!' : 'Trade added successfully!');
    } catch (error) {
      console.error('Error saving trade:', error);
      showError('Failed to save trade');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTradeDate(new Date());
    setFormData({
      accountId: accounts.length > 0 ? accounts[0].id : '',
      pair: 'EURUSD',
      direction: TradeDirection.LONG,
      openDatetime: new Date().toISOString().slice(0, 16),
      status: TradeStatus.CLOSED,
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      totalLots: 0.1,
      totalPnl: 0,
      commission: undefined,
      swap: undefined,
      notes: '',
      riskReward: 0,
      partials: []
    });
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, tradeId: id });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.tradeId) {
      try {
        await SupabaseService.deleteTrade(deleteConfirm.tradeId);
        const loadedTrades = await SupabaseService.getTrades();
        setTrades(loadedTrades);
        showSuccess('Trade deleted successfully');
      } catch (error) {
        console.error('Error deleting trade:', error);
        showError('Failed to delete trade');
      }
    }
  };

  const handleEdit = (trade: Trade) => {
    setFormData(trade);
    setEditingId(trade.id);
    setTradeDate(new Date(trade.openDatetime));
    setIsModalOpen(true);
  };

  const handleDuplicate = (trade: Trade) => {
    // Clone all trade data except ID and datetime
    const now = new Date();
    const duplicatedData = {
      ...trade,
      openDatetime: now.toISOString().slice(0, 16), // Set current datetime
      // Keep all other fields including entry, SL, TP
    };
    setFormData(duplicatedData);
    setTradeDate(now);
    setEditingId(null); // Important: null so it creates a new trade
    setIsModalOpen(true);
    showSuccess('Trade duplicated! You can now modify and save.');
  };

  const filteredTrades = trades.filter(t => {
    if (filterAccount !== 'ALL' && t.accountId !== filterAccount) return false;
    return true;
  }).sort((a,b) => new Date(b.openDatetime).getTime() - new Date(a.openDatetime).getTime());

  const toggleTradeExpansion = (tradeId: string) => {
    setExpandedTradeId(expandedTradeId === tradeId ? null : tradeId);
  };

  // Bulk Actions
  const toggleSelectTrade = (tradeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTradeIds(prev => 
      prev.includes(tradeId) 
        ? prev.filter(id => id !== tradeId)
        : [...prev, tradeId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTradeIds.length === filteredTrades.length) {
      setSelectedTradeIds([]);
    } else {
      setSelectedTradeIds(filteredTrades.map(t => t.id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedTradeIds.map(id => SupabaseService.deleteTrade(id)));
      const loadedTrades = await SupabaseService.getTrades();
      setTrades(loadedTrades);
      setSelectedTradeIds([]);
      setBulkDeleteConfirm(false);
      showSuccess(`${selectedTradeIds.length} trade(s) deleted successfully`);
    } catch (error) {
      console.error('Error deleting trades:', error);
      showError('Failed to delete trades');
    }
  };

  const handleBulkExport = () => {
    const selectedTrades = trades.filter(t => selectedTradeIds.includes(t.id));
    
    // Create CSV header
    const csvHeaders = [
      'Trade ID',
      'Account',
      'Pair',
      'Direction',
      'Open Date',
      'Close Date',
      'Entry Price',
      'Exit Price',
      'Lots',
      'Stop Loss',
      'Take Profit',
      'P&L',
      'Risk/Reward',
      'Status',
      'Notes'
    ].join(',');
    
    // Create CSV rows
    const csvRows = selectedTrades.map(trade => {
      const account = accounts.find(a => a.id === trade.accountId);
      return [
        trade.id,
        account?.name || 'Unknown',
        trade.pair,
        trade.direction,
        trade.openDatetime,
        trade.closeDatetime || '',
        trade.entryPrice,
        trade.exitPrice || '',
        trade.totalLots,
        trade.stopLoss,
        trade.takeProfit,
        trade.totalPnl,
        trade.riskReward,
        trade.status,
        (trade.notes || '').replace(/,/g, ';')
      ].join(',');
    });
    
    const csv = [csvHeaders, ...csvRows].join('\n');
    const csvBlob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(csvBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `traidal-selected-trades-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showSuccess(`${selectedTrades.length} trade(s) exported to CSV`);
    setSelectedTradeIds([]);
  };

  const handleBulkMove = async () => {
    if (!moveToAccountId) {
      showError('Please select an account');
      return;
    }

    try {
      // Update each trade individually
      await Promise.all(
        selectedTradeIds.map(async (tradeId) => {
          const trade = trades.find(t => t.id === tradeId);
          if (trade) {
            await SupabaseService.saveTrade({ ...trade, accountId: moveToAccountId });
          }
        })
      );
      
      const loadedTrades = await SupabaseService.getTrades();
      setTrades(loadedTrades);
      setSelectedTradeIds([]);
      setMoveToAccountModal(false);
      setMoveToAccountId('');
      showSuccess(`${selectedTradeIds.length} trade(s) moved successfully`);
    } catch (error) {
      console.error('Error moving trades:', error);
      showError('Failed to move trades');
    }
  };

  const calculateTimeInTrade = (openDatetime: string, closeDatetime?: string) => {
    const start = new Date(openDatetime);
    const end = closeDatetime ? new Date(closeDatetime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
    return `${diffMins}m`;
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
      <div className="max-w-7xl mx-auto">
        <EmptyState
          icon={BookOpen}
          title="No Accounts Available"
          description="You need to create an account before you can start adding trades to your journal."
          actionLabel="Create Account"
          onAction={() => window.location.hash = '/accounts'}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <BackButton to="/" label="Back to Dashboard" />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trading Journal</h1>
        
        <div className="flex gap-4">
           <CustomSelect
             options={[
               { value: 'ALL', label: 'All Accounts', description: 'Show all trades', icon: <BookOpen size={18} className="text-accent" /> },
               ...accounts.map(a => ({
                 value: a.id,
                 label: a.name,
                 description: `${a.type} - ${a.broker}`,
                 icon: <TrendingUp size={18} className="text-success" />
               }))
             ]}
             value={filterAccount}
             onChange={setFilterAccount}
             className="min-w-[250px]"
           />

           <button 
             onClick={() => { resetForm(); setIsModalOpen(true); }}
             className="bg-primary dark:bg-accent text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-black dark:hover:bg-accent/90 transition-colors shadow-lg shadow-primary/20 dark:shadow-accent/20"
           >
             <Plus size={20} /> Add Trade
           </button>
        </div>
      </div>

      {filteredTrades.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No Trades Yet"
            description="Start documenting your trades to analyze your performance and improve your strategy."
            actionLabel="Add Your First Trade"
            onAction={() => { resetForm(); setIsModalOpen(true); }}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden dark:border dark:border-gray-700">
        {/* Bulk Actions Bar */}
        {selectedTradeIds.length > 0 && (
          <div className="p-4 bg-accent-soft dark:bg-accent/10 border-b border-accent/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedTradeIds.length} trade{selectedTradeIds.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedTradeIds([])}
                className="text-sm text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkExport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all shadow-soft hover:shadow-md"
              >
                <Download size={18} />
                Export CSV
              </button>
              <button
                onClick={() => setMoveToAccountModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-all shadow-soft hover:shadow-md"
              >
                <Move size={18} />
                Move
              </button>
              <button
                onClick={() => setBulkDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-danger hover:bg-red-600 text-white rounded-xl font-medium transition-all shadow-soft hover:shadow-md"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-sm text-secondary dark:text-gray-400 uppercase tracking-wider">
                  <th className="p-4 font-semibold text-center w-12">
                    <div className="flex items-center justify-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTradeIds.length === filteredTrades.length && filteredTrades.length > 0}
                          onChange={toggleSelectAll}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg peer-checked:bg-accent peer-checked:border-accent peer-focus:ring-2 peer-focus:ring-accent/50 transition-all duration-200 flex items-center justify-center">
                          {selectedTradeIds.length === filteredTrades.length && filteredTrades.length > 0 && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </label>
                    </div>
                  </th>
                  <th className="p-4 font-semibold">Account</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Pair</th>
                <th className="p-4 font-semibold">Direction</th>
                <th className="p-4 font-semibold">Lots</th>
                <th className="p-4 font-semibold">Price Info</th>
                <th className="p-4 font-semibold">R:R</th>
                <th className="p-4 font-semibold">P&L</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
                {filteredTrades.map((trade, index) => (
                  <React.Fragment key={trade.id}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => toggleTradeExpansion(trade.id)}
                      className={`border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer ${
                        expandedTradeId === trade.id ? 'bg-accent-soft dark:bg-accent/10' : ''
                      } ${selectedTradeIds.includes(trade.id) ? 'bg-accent/10 dark:bg-accent/20' : ''}`}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTradeIds.includes(trade.id)}
                              onChange={(e) => toggleSelectTrade(trade.id, e as any)}
                              onClick={(e) => e.stopPropagation()}
                              className="sr-only peer"
                            />
                            <div className="w-5 h-5 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg peer-checked:bg-accent peer-checked:border-accent peer-focus:ring-2 peer-focus:ring-accent/50 transition-all duration-200 flex items-center justify-center">
                              {selectedTradeIds.includes(trade.id) && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </label>
                        </div>
                      </td>
                  <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">
                          {accounts.find(a => a.id === trade.accountId)?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-secondary dark:text-gray-400">
                          {accounts.find(a => a.id === trade.accountId)?.broker || ''}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-900 dark:text-gray-200">
                    {new Date(trade.openDatetime).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">{trade.pair}</td>
                  <td className="p-4">
                      <span className={`flex items-center gap-1 font-semibold ${trade.direction === TradeDirection.LONG ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                      {trade.direction === TradeDirection.LONG ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14} />}
                      {trade.direction}
                    </span>
                  </td>
                    <td className="p-4 text-gray-900 dark:text-gray-200">{trade.totalLots}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-xs">
                         <span className="text-secondary dark:text-gray-400">En: <span className="text-primary dark:text-white">{trade.entryPrice}</span></span>
                         <span className="text-secondary dark:text-gray-400">SL: <span className="text-primary dark:text-white">{trade.stopLoss}</span></span>
                         <span className="text-secondary dark:text-gray-400">TP: <span className="text-primary dark:text-white">{trade.takeProfit}</span></span>
                    </div>
                  </td>
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{trade.riskReward}R</td>
                  <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={`font-bold px-2 py-1 rounded ${
                          ((trade.totalPnl || 0) + (trade.commission || 0) + (trade.swap || 0)) >= 0 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        }`}>
                          {((trade.totalPnl || 0) + (trade.commission || 0) + (trade.swap || 0)) >= 0 ? '+' : ''}
                          {((trade.totalPnl || 0) + (trade.commission || 0) + (trade.swap || 0)).toFixed(2)}
                        </span>
                        {(trade.commission || trade.swap) && (
                          <span className="text-xs text-secondary dark:text-gray-400">
                            Base: {trade.totalPnl >= 0 ? '+' : ''}{trade.totalPnl.toFixed(2)}
                            {trade.commission && ` | Comm: ${trade.commission >= 0 ? '+' : ''}${trade.commission.toFixed(2)}`}
                            {trade.swap && ` | Swap: ${trade.swap >= 0 ? '+' : ''}${trade.swap.toFixed(2)}`}
                          </span>
                        )}
                      </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleDuplicate(trade); }} 
                           className="text-secondary dark:text-gray-400 hover:text-accent dark:hover:text-accent transition-colors"
                           title="Duplicate Trade"
                         >
                           <Copy size={16}/>
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleEdit(trade); }} 
                           className="text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors"
                           title="Edit Trade"
                         >
                           <Edit2 size={16}/>
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleDeleteClick(trade.id); }} 
                           className="text-secondary dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                           title="Delete Trade"
                         >
                           <Trash2 size={16}/>
                         </button>
                    </div>
                  </td>
                  </motion.tr>

                  {/* Expanded Trade Details */}
                  <AnimatePresence mode="wait">
                    {expandedTradeId === trade.id && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td colSpan={9} className="bg-gray-50 dark:bg-gray-800/50 p-0">
                          <motion.div
                            initial={{ y: -20 }}
                            animate={{ y: 0 }}
                            exit={{ y: -20 }}
                            className="p-6"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {/* Trade Info */}
                              <div className="space-y-3">
                                <h4 className="font-bold text-primary dark:text-white flex items-center gap-2">
                                  <BookOpen size={16} className="text-accent" />
                                  Trade Information
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-secondary dark:text-gray-400">Entry Price:</span>
                                    <span className="font-semibold text-primary dark:text-white">{trade.entryPrice}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-secondary dark:text-gray-400">Stop Loss:</span>
                                    <span className="font-semibold text-primary dark:text-white">{trade.stopLoss}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-secondary dark:text-gray-400">Take Profit:</span>
                                    <span className="font-semibold text-primary dark:text-white">{trade.takeProfit}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-secondary dark:text-gray-400">Lot Size:</span>
                                    <span className="font-semibold text-primary dark:text-white">{trade.totalLots}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-secondary dark:text-gray-400">Status:</span>
                                    <span className={`font-semibold px-2 py-0.5 rounded text-xs ${
                                      trade.status === TradeStatus.OPEN 
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}>
                                      {trade.status}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Performance Metrics */}
                              <div className="space-y-3">
                                <h4 className="font-bold text-primary dark:text-white flex items-center gap-2">
                                  <TrendingUp size={16} className="text-accent" />
                                  Performance
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-secondary dark:text-gray-400">Base P&L:</span>
                                    <span className={`font-semibold ${
                                      trade.totalPnl >= 0 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : 'text-red-600 dark:text-red-400'
                                    }`}>
                                      {trade.totalPnl >= 0 ? '+' : ''}{trade.totalPnl.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-secondary dark:text-gray-400">Commission:</span>
                                    <span className="font-semibold text-primary dark:text-white">
                                      {trade.commission !== undefined ? (trade.commission >= 0 ? '+' : '') + trade.commission.toFixed(2) : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-secondary dark:text-gray-400">Swap:</span>
                                    <span className="font-semibold text-primary dark:text-white">
                                      {trade.swap !== undefined ? (trade.swap >= 0 ? '+' : '') + trade.swap.toFixed(2) : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                                    <span className="text-secondary dark:text-gray-400 font-bold">Total P&L (with fees):</span>
                                    <span className={`font-bold text-lg ${
                                      ((trade.totalPnl || 0) + (trade.commission || 0) + (trade.swap || 0)) >= 0
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                    }`}>
                                      {((trade.totalPnl || 0) + (trade.commission || 0) + (trade.swap || 0)) >= 0 ? '+' : ''}
                                      {((trade.totalPnl || 0) + (trade.commission || 0) + (trade.swap || 0)).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-secondary dark:text-gray-400">Risk:Reward:</span>
                                    <span className="font-semibold text-primary dark:text-white">{trade.riskReward}R</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-secondary dark:text-gray-400">Time in Trade:</span>
                                    <span className="font-semibold text-primary dark:text-white">
                                      {calculateTimeInTrade(trade.openDatetime, trade.closeDatetime)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-secondary dark:text-gray-400">Direction:</span>
                                    <span className={`font-semibold flex items-center gap-1 ${
                                      trade.direction === TradeDirection.LONG 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : 'text-red-600 dark:text-red-400'
                                    }`}>
                                      {trade.direction === TradeDirection.LONG ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14} />}
                                      {trade.direction}
                                    </span>
                                  </div>
                                  {trade.partials && trade.partials.length > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-secondary dark:text-gray-400">Partials:</span>
                                      <span className="font-semibold text-primary dark:text-white">{trade.partials.length}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Timeline */}
                              <div className="space-y-3">
                                <h4 className="font-bold text-primary dark:text-white flex items-center gap-2">
                                  <BookOpen size={16} className="text-accent" />
                                  Timeline
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-secondary dark:text-gray-400 block">Opened:</span>
                                    <span className="font-semibold text-primary dark:text-white">
                                      {new Date(trade.openDatetime).toLocaleString(undefined, {
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric',
                                        hour: '2-digit', 
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  {trade.closeDatetime && (
                                    <div>
                                      <span className="text-secondary dark:text-gray-400 block">Closed:</span>
                                      <span className="font-semibold text-primary dark:text-white">
                                        {new Date(trade.closeDatetime).toLocaleString(undefined, {
                                          month: 'short', 
                                          day: 'numeric', 
                                          year: 'numeric',
                                          hour: '2-digit', 
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-secondary dark:text-gray-400 block">Account:</span>
                                    <span className="font-semibold text-primary dark:text-white">
                                      {accounts.find(a => a.id === trade.accountId)?.name || 'Unknown'}
                                    </span>
                                    <span className="text-xs text-secondary dark:text-gray-400 block">
                                      {accounts.find(a => a.id === trade.accountId)?.broker || ''}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Notes Section */}
                            {trade.notes && (
                              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="font-bold text-primary dark:text-white flex items-center gap-2 mb-3">
                                  <BookOpen size={16} className="text-accent" />
                                  Trade Notes
                                </h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-gray-800 p-4 rounded-xl">
                                  {trade.notes}
                                </p>
                              </div>
                            )}
                          </motion.div>
                  </td>
                      </motion.tr>
              )}
                  </AnimatePresence>
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, tradeId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Trade?"
        message="Are you sure you want to delete this trade? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Trades?"
        message={`Are you sure you want to delete ${selectedTradeIds.length} trade(s)? This action cannot be undone.`}
        confirmText={`Delete ${selectedTradeIds.length} Trade(s)`}
        cancelText="Cancel"
        variant="danger"
      />

      {/* Move to Account Modal */}
      <AnimatePresence mode="wait">
        {moveToAccountModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoveToAccountModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-[101] p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Move size={24} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Move Trades
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Move {selectedTradeIds.length} trade(s) to a different account
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMoveToAccountModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="mb-6">
                <CustomSelect
                  label="Destination Account"
                  required
                  options={accounts.map(acc => ({
                    value: acc.id,
                    label: acc.name,
                    description: `${acc.type} - ${acc.broker}`,
                    icon: <TrendingUp size={18} className="text-accent" />
                  }))}
                  value={moveToAccountId}
                  onChange={setMoveToAccountId}
                  placeholder="Select account..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMoveToAccountModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkMove}
                  disabled={!moveToAccountId}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                    moveToAccountId
                      ? 'bg-purple-500 hover:bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Move {selectedTradeIds.length} Trade(s)
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence mode="wait">
      {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto relative"
              >
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
                
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white pr-8">
                  {editingId ? 'Edit Trade' : 'New Trade'}
                </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Selection */}
                  <CustomSelect
                    label="Account"
                    required
                    options={accounts.map(a => ({
                      value: a.id,
                      label: a.name,
                      description: `${a.type} - ${a.broker}`,
                      icon: <TrendingUp size={18} className="text-success" />
                    }))}
                  value={formData.accountId}
                    onChange={value => setFormData({...formData, accountId: value})}
                    placeholder="Select Account"
                  />

              {/* Pair & Direction */}
              <div className="grid grid-cols-2 gap-4">
                    <CustomSelect
                      label="Pair"
                      required
                      options={getPairOptions()}
                    value={formData.pair}
                      onChange={value => setFormData({...formData, pair: value})}
                    />
                <div>
                      <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">Direction</label>
                  <div className="flex gap-2">
                     <button
                       type="button"
                       onClick={() => setFormData({...formData, direction: TradeDirection.LONG})}
                           className={`flex-1 p-3 rounded-xl border font-bold transition-colors ${
                             formData.direction === TradeDirection.LONG 
                               ? 'bg-green-500 text-white border-green-500' 
                               : 'border-gray-200 dark:border-gray-600 text-secondary dark:text-gray-400 hover:border-green-500'
                           }`}
                     >
                       LONG
                     </button>
                     <button
                       type="button"
                       onClick={() => setFormData({...formData, direction: TradeDirection.SHORT})}
                           className={`flex-1 p-3 rounded-xl border font-bold transition-colors ${
                             formData.direction === TradeDirection.SHORT 
                               ? 'bg-red-500 text-white border-red-500' 
                               : 'border-gray-200 dark:border-gray-600 text-secondary dark:text-gray-400 hover:border-red-500'
                           }`}
                     >
                       SHORT
                     </button>
                  </div>
                </div>
              </div>

              {/* Date & Lots */}
              <div className="grid grid-cols-2 gap-4">
                    <CustomDateTimePicker
                      label="Date"
                      value={tradeDate}
                      onChange={(date) => {
                        if (date) {
                          setTradeDate(date);
                          setFormData({...formData, openDatetime: date.toISOString().slice(0, 16)});
                        }
                      }}
                    required
                  />
                <div>
                       <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">Lots</label>
                   <input 
                    type="number"
                    step="0.01"
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                    value={formData.totalLots}
                    onChange={e => setFormData({...formData, totalLots: Number(e.target.value)})}
                        onFocus={handleNumberInputFocus}
                    required
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-3 gap-4">
                 <div>
                        <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">Entry</label>
                    <input 
                      type="number"
                      step="0.00001"
                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                      value={formData.entryPrice}
                      onChange={e => setFormData({...formData, entryPrice: Number(e.target.value)})}
                          onFocus={handleNumberInputFocus}
                      required
                    />
                 </div>
                 <div>
                        <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">Stop Loss</label>
                    <input 
                      type="number"
                      step="0.00001"
                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                      value={formData.stopLoss}
                      onChange={e => setFormData({...formData, stopLoss: Number(e.target.value)})}
                          onFocus={handleNumberInputFocus}
                      required
                    />
                 </div>
                 <div>
                        <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">Take Profit</label>
                    <input 
                      type="number"
                      step="0.00001"
                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                      value={formData.takeProfit}
                      onChange={e => setFormData({...formData, takeProfit: Number(e.target.value)})}
                          onFocus={handleNumberInputFocus}
                      required
                    />
                 </div>
              </div>

              {/* Outcome */}
              <div className="grid grid-cols-2 gap-4">
                     <CustomSelect
                        label="Status"
                        required
                        options={statusOptions}
                      value={formData.status}
                        onChange={value => setFormData({...formData, status: value as TradeStatus})}
                     />
                 <div>
                        <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">Total P&L</label>
                    <input 
                      type="number"
                      step="0.01"
                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                      value={formData.totalPnl}
                      onChange={e => setFormData({...formData, totalPnl: Number(e.target.value)})}
                          onFocus={handleNumberInputFocus}
                    />
                 </div>
              </div>

              {/* Commission & Swap */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">
                    Commission
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                    value={formData.commission ?? ''}
                    onChange={e => setFormData({...formData, commission: e.target.value === '' ? undefined : Number(e.target.value)})}
                    onFocus={handleNumberInputFocus}
                    placeholder="e.g. -5.50"
                  />
                  <p className="text-xs text-secondary dark:text-gray-400 mt-1">
                    Positive or negative
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">
                    Swap
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                    value={formData.swap ?? ''}
                    onChange={e => setFormData({...formData, swap: e.target.value === '' ? undefined : Number(e.target.value)})}
                    onFocus={handleNumberInputFocus}
                    placeholder="e.g. 2.30"
                  />
                  <p className="text-xs text-secondary dark:text-gray-400 mt-1">
                    Positive or negative
                  </p>
                </div>
              </div>

              {/* Total P&L with Fees */}
              <div className="bg-accent-soft dark:bg-accent/10 p-4 rounded-xl flex justify-between items-center">
                <span className="text-secondary dark:text-gray-300 font-medium">Total P&L (with fees)</span>
                <span className={`text-xl font-bold ${
                  ((formData.totalPnl || 0) + (formData.commission || 0) + (formData.swap || 0)) >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {((formData.totalPnl || 0) + (formData.commission || 0) + (formData.swap || 0)) >= 0 ? '+' : ''}
                  {((formData.totalPnl || 0) + (formData.commission || 0) + (formData.swap || 0)).toFixed(2)}
                </span>
              </div>
              
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl flex justify-between items-center">
                     <span className="text-secondary dark:text-gray-300 font-medium">Projected R:R</span>
                     <span className="text-xl font-bold text-gray-900 dark:text-white">{formData.riskReward} R</span>
              </div>

              <div>
                    <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">Notes</label>
                <textarea 
                       className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none h-24"
                   value={formData.notes}
                   onChange={e => setFormData({...formData, notes: e.target.value})}
                   placeholder="Setup details, emotions, execution notes..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                      className="px-6 py-3 rounded-xl text-secondary dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                      className="bg-primary dark:bg-accent text-white px-8 py-3 rounded-xl hover:bg-black dark:hover:bg-accent/90 transition-colors"
                >
                  Save Trade
                </button>
              </div>
            </form>
              </motion.div>
          </div>
          </>
      )}
      </AnimatePresence>
    </div>
  );
};
