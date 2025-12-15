import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Trade, TradeDirection, TradeStatus, Account } from '../types';
import { StorageService } from '../services/storageService';
import { TRADING_PAIRS } from '../constants';
import { calculateRiskReward } from '../utils/calculations';
import { Plus, Search, Trash2, Edit2, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const Journal = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
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
    notes: '',
    riskReward: 0,
    partials: []
  });

  useEffect(() => {
    setTrades(StorageService.getTrades());
    setAccounts(StorageService.getAccounts());
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountId) {
      alert("Please select an account");
      return;
    }

    const newTrade: Trade = {
      ...formData as Trade,
      id: editingId || uuidv4(),
      partials: formData.partials || []
    };

    StorageService.saveTrade(newTrade);
    setTrades(StorageService.getTrades());
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
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
      notes: '',
      riskReward: 0,
      partials: []
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this trade?')) {
      StorageService.deleteTrade(id);
      setTrades(StorageService.getTrades());
    }
  };

  const handleEdit = (trade: Trade) => {
    setFormData(trade);
    setEditingId(trade.id);
    setIsModalOpen(true);
  };

  const filteredTrades = trades.filter(t => {
    if (filterAccount !== 'ALL' && t.accountId !== filterAccount) return false;
    return true;
  }).sort((a,b) => new Date(b.openDatetime).getTime() - new Date(a.openDatetime).getTime());

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Trading Journal</h1>
        
        <div className="flex gap-4">
           <select 
             className="p-3 bg-white border border-gray-200 rounded-xl focus:outline-none"
             value={filterAccount}
             onChange={e => setFilterAccount(e.target.value)}
           >
             <option value="ALL">All Accounts</option>
             {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
           </select>

           <button 
             onClick={() => { resetForm(); setIsModalOpen(true); }}
             className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-black transition-colors shadow-lg shadow-primary/20"
           >
             <Plus size={20} /> Add Trade
           </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-sm text-secondary uppercase tracking-wider">
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
              {filteredTrades.map(trade => (
                <tr key={trade.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    {new Date(trade.openDatetime).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="p-4 font-bold">{trade.pair}</td>
                  <td className="p-4">
                    <span className={`flex items-center gap-1 font-semibold ${trade.direction === TradeDirection.LONG ? 'text-green-600' : 'text-red-500'}`}>
                      {trade.direction === TradeDirection.LONG ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14} />}
                      {trade.direction}
                    </span>
                  </td>
                  <td className="p-4">{trade.totalLots}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-xs">
                       <span className="text-secondary">En: <span className="text-primary">{trade.entryPrice}</span></span>
                       <span className="text-secondary">SL: <span className="text-primary">{trade.stopLoss}</span></span>
                       <span className="text-secondary">TP: <span className="text-primary">{trade.takeProfit}</span></span>
                    </div>
                  </td>
                  <td className="p-4 font-medium">{trade.riskReward}R</td>
                  <td className="p-4">
                    <span className={`font-bold px-2 py-1 rounded ${trade.totalPnl >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {trade.totalPnl >= 0 ? '+' : ''}{trade.totalPnl}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleEdit(trade)} className="text-secondary hover:text-primary"><Edit2 size={16}/></button>
                       <button onClick={() => handleDelete(trade.id)} className="text-secondary hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-secondary">
                    No trades found. Start by adding one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editingId ? 'Edit Trade' : 'New Trade'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Selection */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Account</label>
                <select 
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                  value={formData.accountId}
                  onChange={e => setFormData({...formData, accountId: e.target.value})}
                  required
                >
                  <option value="" disabled>Select Account</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {/* Pair & Direction */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Pair</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                    value={formData.pair}
                    onChange={e => setFormData({...formData, pair: e.target.value})}
                  >
                    {TRADING_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Direction</label>
                  <div className="flex gap-2">
                     <button
                       type="button"
                       onClick={() => setFormData({...formData, direction: TradeDirection.LONG})}
                       className={`flex-1 p-3 rounded-xl border font-bold ${formData.direction === TradeDirection.LONG ? 'bg-green-500 text-white border-green-500' : 'border-gray-200 text-secondary'}`}
                     >
                       LONG
                     </button>
                     <button
                       type="button"
                       onClick={() => setFormData({...formData, direction: TradeDirection.SHORT})}
                       className={`flex-1 p-3 rounded-xl border font-bold ${formData.direction === TradeDirection.SHORT ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-secondary'}`}
                     >
                       SHORT
                     </button>
                  </div>
                </div>
              </div>

              {/* Date & Lots */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Date</label>
                  <input 
                    type="datetime-local"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                    value={formData.openDatetime}
                    onChange={e => setFormData({...formData, openDatetime: e.target.value})}
                    required
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-secondary mb-1">Lots</label>
                   <input 
                    type="number"
                    step="0.01"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                    value={formData.totalLots}
                    onChange={e => setFormData({...formData, totalLots: Number(e.target.value)})}
                    required
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-3 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Entry</label>
                    <input 
                      type="number"
                      step="0.00001"
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                      value={formData.entryPrice}
                      onChange={e => setFormData({...formData, entryPrice: Number(e.target.value)})}
                      required
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Stop Loss</label>
                    <input 
                      type="number"
                      step="0.00001"
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                      value={formData.stopLoss}
                      onChange={e => setFormData({...formData, stopLoss: Number(e.target.value)})}
                      required
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Take Profit</label>
                    <input 
                      type="number"
                      step="0.00001"
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                      value={formData.takeProfit}
                      onChange={e => setFormData({...formData, takeProfit: Number(e.target.value)})}
                      required
                    />
                 </div>
              </div>

              {/* Outcome */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Status</label>
                    <select
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as TradeStatus})}
                    >
                      <option value={TradeStatus.OPEN}>OPEN</option>
                      <option value={TradeStatus.CLOSED}>CLOSED</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Total P&L</label>
                    <input 
                      type="number"
                      step="0.01"
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                      value={formData.totalPnl}
                      onChange={e => setFormData({...formData, totalPnl: Number(e.target.value)})}
                    />
                 </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                 <span className="text-secondary font-medium">Projected R:R</span>
                 <span className="text-xl font-bold">{formData.riskReward} R</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Notes</label>
                <textarea 
                   className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none h-24"
                   value={formData.notes}
                   onChange={e => setFormData({...formData, notes: e.target.value})}
                   placeholder="Setup details, emotions, execution notes..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl text-secondary hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-primary text-white px-8 py-3 rounded-xl hover:bg-black transition-colors"
                >
                  Save Trade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
