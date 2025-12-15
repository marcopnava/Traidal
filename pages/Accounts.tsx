import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Account, AccountType, Broker, Currency, PropPhase, AccountStatus } from '../types';
import { StorageService } from '../services/storageService';
import { BROKERS, ACCOUNT_TYPES, CURRENCIES, PROP_PHASES } from '../constants';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Account>>({
    name: '',
    type: AccountType.PROP,
    broker: Broker.FTMO,
    currency: Currency.USD,
    initialBalance: 0,
    status: AccountStatus.ACTIVE,
    phase: PropPhase.PHASE_1
  });

  useEffect(() => {
    setAccounts(StorageService.getAccounts());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAccount: Account = {
      ...formData as Account,
      id: editingId || uuidv4(),
      createdAt: editingId ? (accounts.find(a => a.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      status: formData.status || AccountStatus.ACTIVE
    };

    StorageService.saveAccount(newAccount);
    setAccounts(StorageService.getAccounts());
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      type: AccountType.PROP,
      broker: Broker.FTMO,
      currency: Currency.USD,
      initialBalance: 0,
      status: AccountStatus.ACTIVE,
      phase: PropPhase.PHASE_1
    });
  };

  const handleEdit = (acc: Account) => {
    setFormData(acc);
    setEditingId(acc.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure? This will delete all associated trades.')) {
      StorageService.deleteAccount(id);
      setAccounts(StorageService.getAccounts());
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Accounts</h1>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-black transition-colors shadow-lg shadow-primary/20"
        >
          <Plus size={20} /> New Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <Card key={acc.id} className="relative group overflow-hidden border border-transparent hover:border-gray-200">
            <div className={`absolute top-0 left-0 w-2 h-full ${acc.type === AccountType.REAL ? 'bg-blue-500' : 'bg-accent'}`} />
            
            <div className="pl-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{acc.name}</h3>
                  <p className="text-sm text-secondary">{acc.broker}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${acc.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {acc.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-secondary">
                <div className="flex justify-between">
                  <span>Balance:</span>
                  <span className="font-semibold text-primary">{acc.currency} {acc.initialBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-semibold text-primary">{acc.type}</span>
                </div>
                {acc.type === AccountType.PROP && (
                  <div className="flex justify-between">
                     <span>Phase:</span>
                     <span className="font-semibold text-primary">{acc.phase}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(acc)}
                  className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-primary"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(acc.id)}
                  className="p-2 bg-red-50 rounded-lg hover:bg-red-100 text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editingId ? 'Edit Account' : 'Create Account'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Account Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. FTMO 100k Challenge"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Type</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as AccountType})}
                  >
                    {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Broker</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                    value={formData.broker}
                    onChange={e => setFormData({...formData, broker: e.target.value as Broker})}
                  >
                    {BROKERS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Currency</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                    value={formData.currency}
                    onChange={e => setFormData({...formData, currency: e.target.value as Currency})}
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Initial Balance</label>
                  <input 
                    type="number"
                    required
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                    value={formData.initialBalance}
                    onChange={e => setFormData({...formData, initialBalance: Number(e.target.value)})}
                  />
                </div>
              </div>

              {formData.type === AccountType.PROP && (
                <>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Phase</label>
                        <select 
                          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                          value={formData.phase}
                          onChange={e => setFormData({...formData, phase: e.target.value as PropPhase})}
                        >
                          {PROP_PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Challenge Cost</label>
                         <input 
                          type="number"
                          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                          value={formData.challengeCost || ''}
                          onChange={e => setFormData({...formData, challengeCost: Number(e.target.value)})}
                        />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Max DD Limit</label>
                        <input 
                          type="number"
                          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/50 outline-none"
                          value={formData.maxDrawdownLimit || ''}
                          onChange={e => setFormData({...formData, maxDrawdownLimit: Number(e.target.value)})}
                          placeholder="Amount (e.g. 5000)"
                        />
                      </div>
                   </div>
                </>
              )}

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
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
