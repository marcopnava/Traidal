import React, { useState, useEffect } from 'react';
import { Account, AccountType, Broker, Currency, PropPhase, PropChallengeType, AccountStatus } from '../../types';
import { SupabaseService } from '../../services/supabaseService';
import { BROKERS, CURRENCIES } from '../../constants';
import { Target, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { showSuccess, showError } from '../ui/Toast';
// import { motion, AnimatePresence } from 'framer-motion'; // Temporarily disabled to fix build issue
import { handleNumberInputFocus, formatNumberInputValue } from '../../utils/inputHelpers';
import { CustomSelect, SelectOption } from '../ui/CustomSelect';
import { Briefcase, DollarSign, Zap, TrendingUp } from 'lucide-react';
import { useAccountModal } from '../../contexts/AccountModalContext';

// Select Options
const accountTypeOptions: SelectOption[] = [
  { value: AccountType.REAL, label: 'Real Account', description: 'Live trading account', icon: <Briefcase size={18} className="text-green-500" /> },
  { value: AccountType.DEMO, label: 'Demo Account', description: 'Practice account', icon: <Briefcase size={18} className="text-blue-500" /> },
  { value: AccountType.PROP, label: 'Prop Firm', description: 'Challenge/Evaluation', icon: <TrendingUp size={18} className="text-accent" /> },
  { value: AccountType.FUNDED, label: 'Funded Account', description: 'Passed challenge', icon: <Zap size={18} className="text-success" /> }
];

const brokerOptions: SelectOption[] = BROKERS.map(broker => ({
  value: broker,
  label: broker,
  icon: <Briefcase size={18} className="text-accent" />
}));

const currencyOptions: SelectOption[] = CURRENCIES.map(currency => ({
  value: currency,
  label: currency,
  description: currency === Currency.USD ? 'US Dollar' : currency === Currency.EUR ? 'Euro' : 'British Pound',
  icon: <DollarSign size={18} className="text-success" />
}));

const challengeTypeOptions: SelectOption[] = [
  { value: PropChallengeType.ONE_PHASE, label: '1-Phase Challenge', description: 'Single evaluation phase', icon: <Target size={18} className="text-blue-500" /> },
  { value: PropChallengeType.TWO_PHASE, label: '2-Phase Challenge', description: 'Two evaluation phases', icon: <Target size={18} className="text-accent" /> },
  { value: PropChallengeType.INSTANT, label: 'Instant Funding', description: 'No evaluation needed', icon: <Zap size={18} className="text-success" /> }
];

const getPhaseOptions = (challengeType?: PropChallengeType): SelectOption[] => {
  if (challengeType === PropChallengeType.INSTANT) {
    return [{ value: PropPhase.FUNDED, label: 'Funded', icon: <Zap size={18} className="text-success" /> }];
  } else if (challengeType === PropChallengeType.ONE_PHASE) {
    return [
      { value: PropPhase.PHASE_1, label: 'Phase 1', description: 'Evaluation phase', icon: <Target size={18} className="text-blue-500" /> },
      { value: PropPhase.FUNDED, label: 'Funded', description: 'Passed challenge', icon: <Zap size={18} className="text-success" /> }
    ];
  } else {
    return [
      { value: PropPhase.PHASE_1, label: 'Phase 1', description: 'First evaluation', icon: <Target size={18} className="text-blue-500" /> },
      { value: PropPhase.PHASE_2, label: 'Phase 2', description: 'Second evaluation', icon: <Target size={18} className="text-accent" /> },
      { value: PropPhase.FUNDED, label: 'Funded', description: 'Passed all phases', icon: <Zap size={18} className="text-success" /> }
    ];
  }
};

export const CreateAccountModal: React.FC<{ onAccountCreated?: () => void }> = ({ onAccountCreated }) => {
  const { isModalOpen, editingId, formData, closeAccountModal, setFormData: updateFormData, setEditingId, resetForm } = useAccountModal();
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Helper function to update form data
  const setFormData = (updates: Partial<Account>) => {
    updateFormData({ ...formData, ...updates });
  };

  // Recalculate percentages when initialBalance changes
  useEffect(() => {
    if (formData.initialBalance && formData.initialBalance > 0) {
      const balance = formData.initialBalance;
      const updates: Partial<Account> = {};
      
      if (formData.phase1ProfitTarget && !formData.phase1ProfitTargetPercent) {
        updates.phase1ProfitTargetPercent = (formData.phase1ProfitTarget / balance) * 100;
      }
      if (formData.phase2ProfitTarget && !formData.phase2ProfitTargetPercent) {
        updates.phase2ProfitTargetPercent = (formData.phase2ProfitTarget / balance) * 100;
      }
      if (formData.fundedProfitTarget && !formData.fundedProfitTargetPercent) {
        updates.fundedProfitTargetPercent = (formData.fundedProfitTarget / balance) * 100;
      }
      
      if (Object.keys(updates).length > 0) {
        updateFormData({ ...formData, ...updates });
      }
    }
  }, [formData.initialBalance]);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const loadedAccounts = await SupabaseService.getAccounts();
        setAccounts(loadedAccounts);
      } catch (error) {
        console.error('Error loading accounts:', error);
      }
    };
    if (isModalOpen) {
      loadAccounts();
    }
  }, [isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        showError('Account name is required');
        return;
      }
      if (!formData.type) {
        showError('Account type is required');
        return;
      }
      if (!formData.broker) {
        showError('Broker is required');
        return;
      }
      if (!formData.currency) {
        showError('Currency is required');
        return;
      }
      if (!formData.initialBalance || formData.initialBalance <= 0) {
        showError('Initial balance must be greater than 0');
        return;
      }
      
      // For PROP accounts, validate challenge type and phase
      if (formData.type === AccountType.PROP) {
        if (!formData.challengeType) {
          showError('Challenge type is required for PROP accounts');
          return;
        }
        if (!formData.phase) {
          showError('Current phase is required for PROP accounts');
          return;
        }
      }

      const newAccount: Account = {
        ...formData as Account,
        id: editingId || uuidv4(),
        createdAt: editingId ? (accounts.find(a => a.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        status: formData.status || AccountStatus.ACTIVE,
        name: formData.name.trim()
      };

      await SupabaseService.saveAccount(newAccount);
      closeAccountModal();
      showSuccess(editingId ? 'Account updated successfully!' : 'Account created successfully!');
      
      if (onAccountCreated) {
        onAccountCreated();
      }
    } catch (error: any) {
      console.error('Error saving account:', error);
      console.error('Full error object:', error);
      // Show more specific error message
      const errorMessage = error?.message || error?.error?.message || error?.details || 'Failed to save account. Please check the console for details.';
      showError(errorMessage);
    }
  };

  if (!isModalOpen) return null;

  return (
    <>
      <div
        onClick={closeAccountModal}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
      />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto relative"
        >
              <button
                onClick={closeAccountModal}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white pr-8">
                {editingId ? 'Edit Account' : 'Create Account'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">Account Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. FTMO 100k Challenge"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <CustomSelect
                    label="Type"
                    required
                    options={accountTypeOptions}
                    value={formData.type || AccountType.PROP}
                    onChange={value => setFormData({...formData, type: value as AccountType})}
                  />
                  <CustomSelect
                    label="Broker"
                    required
                    options={brokerOptions}
                    value={formData.broker || Broker.FTMO}
                    onChange={value => setFormData({...formData, broker: value as Broker})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <CustomSelect
                    label="Currency"
                    required
                    options={currencyOptions}
                    value={formData.currency || Currency.USD}
                    onChange={value => setFormData({...formData, currency: value as Currency})}
                  />
                  <div>
                    <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">Initial Balance</label>
                    <input 
                      type="number"
                      required
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                      value={formatNumberInputValue(formData.initialBalance)}
                      onChange={e => setFormData({...formData, initialBalance: Number(e.target.value)})}
                      onFocus={handleNumberInputFocus}
                      placeholder="e.g. 100000"
                    />
                  </div>
                </div>

                {formData.type === AccountType.PROP && (
                  <>
                     <CustomSelect
                        label="Challenge Type"
                        required
                        options={challengeTypeOptions}
                        value={formData.challengeType || PropChallengeType.TWO_PHASE}
                        onChange={value => setFormData({...formData, challengeType: value as PropChallengeType})}
                     />
                     
                     <div className="grid grid-cols-2 gap-4">
                        <CustomSelect
                          label="Current Phase"
                          required
                          options={getPhaseOptions(formData.challengeType)}
                          value={formData.phase || PropPhase.PHASE_1}
                          onChange={value => setFormData({...formData, phase: value as PropPhase})}
                        />
                        <div>
                          <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">Challenge Cost</label>
                           <input 
                            type="number"
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                            value={formatNumberInputValue(formData.challengeCost)}
                            onChange={e => setFormData({...formData, challengeCost: Number(e.target.value)})}
                            onFocus={handleNumberInputFocus}
                            placeholder="e.g. 540"
                          />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">Max DD Limit</label>
                          <input 
                            type="number"
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                            value={formatNumberInputValue(formData.maxDrawdownLimit)}
                            onChange={e => setFormData({...formData, maxDrawdownLimit: Number(e.target.value)})}
                            onFocus={handleNumberInputFocus}
                            placeholder="Amount (e.g. 5000)"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">Profit Split %</label>
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                            value={formatNumberInputValue(formData.profitSplitPercent)}
                            onChange={e => setFormData({...formData, profitSplitPercent: Number(e.target.value)})}
                            onFocus={handleNumberInputFocus}
                            placeholder="e.g. 80"
                          />
                        </div>
                     </div>

                     {/* Phase Targets */}
                     <div className="space-y-4 p-4 bg-accent-soft dark:bg-accent/10 rounded-xl">
                       <h4 className="font-semibold text-primary dark:text-white flex items-center gap-2">
                         <Target size={18} className="text-accent" />
                         Profit Targets
                       </h4>
                       
                       {formData.challengeType === 'TWO_PHASE' ? (
                         <>
                           {/* Phase 1 */}
                           <div className="space-y-3 p-3 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                             <h5 className="font-semibold text-primary dark:text-white text-sm">Phase 1</h5>
                             <div className="grid grid-cols-2 gap-4">
                               <div>
                                 <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">
                                   Target Amount
                                 </label>
                                 <input 
                                   type="number"
                                   className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                                   value={formatNumberInputValue(formData.phase1ProfitTarget)}
                                   onChange={e => {
                                     const target = Number(e.target.value);
                                     const balance = formData.initialBalance || 0;
                                     const percent = balance > 0 ? (target / balance) * 100 : 0;
                                     setFormData({
                                       ...formData, 
                                       phase1ProfitTarget: target,
                                       phase1ProfitTargetPercent: percent
                                     });
                                   }}
                                   onFocus={handleNumberInputFocus}
                                   placeholder="e.g. 8000"
                                 />
                               </div>
                               <div>
                                 <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">
                                   Target % of Account
                                 </label>
                                 <input 
                                   type="number"
                                   step="0.01"
                                   className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                                   value={formatNumberInputValue(formData.phase1ProfitTargetPercent)}
                                   onChange={e => {
                                     const percent = Number(e.target.value);
                                     const balance = formData.initialBalance || 0;
                                     const target = (percent / 100) * balance;
                                     setFormData({
                                       ...formData, 
                                       phase1ProfitTargetPercent: percent,
                                       phase1ProfitTarget: target
                                     });
                                   }}
                                   onFocus={handleNumberInputFocus}
                                   placeholder="e.g. 8"
                                 />
                                 {formData.phase1ProfitTargetPercent && (
                                   <p className="text-xs text-accent dark:text-accent-soft mt-1">
                                     = {formData.currency} {((formData.phase1ProfitTargetPercent / 100) * (formData.initialBalance || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                   </p>
                                 )}
                               </div>
                             </div>
                             <p className="text-xs text-secondary dark:text-gray-400">
                               Profit needed to pass Phase 1
                             </p>
                           </div>
                           
                           {/* Phase 2 */}
                           <div className="space-y-3 p-3 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                             <h5 className="font-semibold text-primary dark:text-white text-sm">Phase 2</h5>
                             <div className="grid grid-cols-2 gap-4">
                               <div>
                                 <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">
                                   Target Amount
                                 </label>
                                 <input 
                                   type="number"
                                   className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                                   value={formatNumberInputValue(formData.phase2ProfitTarget)}
                                   onChange={e => {
                                     const target = Number(e.target.value);
                                     const balance = formData.initialBalance || 0;
                                     const percent = balance > 0 ? (target / balance) * 100 : 0;
                                     setFormData({
                                       ...formData, 
                                       phase2ProfitTarget: target,
                                       phase2ProfitTargetPercent: percent
                                     });
                                   }}
                                   onFocus={handleNumberInputFocus}
                                   placeholder="e.g. 5000"
                                 />
                               </div>
                               <div>
                                 <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">
                                   Target % of Account
                                 </label>
                                 <input 
                                   type="number"
                                   step="0.01"
                                   className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                                   value={formatNumberInputValue(formData.phase2ProfitTargetPercent)}
                                   onChange={e => {
                                     const percent = Number(e.target.value);
                                     const balance = formData.initialBalance || 0;
                                     const target = (percent / 100) * balance;
                                     setFormData({
                                       ...formData, 
                                       phase2ProfitTargetPercent: percent,
                                       phase2ProfitTarget: target
                                     });
                                   }}
                                   onFocus={handleNumberInputFocus}
                                   placeholder="e.g. 5"
                                 />
                                 {formData.phase2ProfitTargetPercent && (
                                   <p className="text-xs text-accent dark:text-accent-soft mt-1">
                                     = {formData.currency} {((formData.phase2ProfitTargetPercent / 100) * (formData.initialBalance || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                   </p>
                                 )}
                               </div>
                             </div>
                             <p className="text-xs text-secondary dark:text-gray-400">
                               Profit needed to pass Phase 2
                             </p>
                           </div>
                         </>
                       ) : formData.challengeType === 'ONE_PHASE' ? (
                         <div className="space-y-3 p-3 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                           <h5 className="font-semibold text-primary dark:text-white text-sm">Phase 1</h5>
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                               <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">
                                 Target Amount
                               </label>
                               <input 
                                 type="number"
                                 className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                                 value={formatNumberInputValue(formData.phase1ProfitTarget)}
                                 onChange={e => {
                                   const target = Number(e.target.value);
                                   const balance = formData.initialBalance || 0;
                                   const percent = balance > 0 ? (target / balance) * 100 : 0;
                                   setFormData({
                                     ...formData, 
                                     phase1ProfitTarget: target,
                                     phase1ProfitTargetPercent: percent
                                   });
                                 }}
                                 onFocus={handleNumberInputFocus}
                                 placeholder="e.g. 10000"
                               />
                             </div>
                             <div>
                               <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">
                                 Target % of Account
                               </label>
                               <input 
                                 type="number"
                                 step="0.01"
                                 className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                                 value={formatNumberInputValue(formData.phase1ProfitTargetPercent)}
                                 onChange={e => {
                                   const percent = Number(e.target.value);
                                   const balance = formData.initialBalance || 0;
                                   const target = (percent / 100) * balance;
                                   setFormData({
                                     ...formData, 
                                     phase1ProfitTargetPercent: percent,
                                     phase1ProfitTarget: target
                                   });
                                 }}
                                 onFocus={handleNumberInputFocus}
                                 placeholder="e.g. 10"
                               />
                               {formData.phase1ProfitTargetPercent && (
                                 <p className="text-xs text-accent dark:text-accent-soft mt-1">
                                   = {formData.currency} {((formData.phase1ProfitTargetPercent / 100) * (formData.initialBalance || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                 </p>
                               )}
                             </div>
                           </div>
                           <p className="text-xs text-secondary dark:text-gray-400">
                             Profit needed to get funded
                           </p>
                         </div>
                       ) : (
                         <div className="space-y-3 p-3 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                           <h5 className="font-semibold text-primary dark:text-white text-sm">Funded Target</h5>
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                               <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">
                                 Target Amount
                               </label>
                               <input 
                                 type="number"
                                 className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                                 value={formatNumberInputValue(formData.fundedProfitTarget)}
                                 onChange={e => {
                                   const target = Number(e.target.value);
                                   const balance = formData.initialBalance || 0;
                                   const percent = balance > 0 ? (target / balance) * 100 : 0;
                                   setFormData({
                                     ...formData, 
                                     fundedProfitTarget: target,
                                     fundedProfitTargetPercent: percent
                                   });
                                 }}
                                 onFocus={handleNumberInputFocus}
                                 placeholder="e.g. Monthly target"
                               />
                             </div>
                             <div>
                               <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">
                                 Target % of Account
                               </label>
                               <input 
                                 type="number"
                                 step="0.01"
                                 className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                                 value={formatNumberInputValue(formData.fundedProfitTargetPercent)}
                                 onChange={e => {
                                   const percent = Number(e.target.value);
                                   const balance = formData.initialBalance || 0;
                                   const target = (percent / 100) * balance;
                                   setFormData({
                                     ...formData, 
                                     fundedProfitTargetPercent: percent,
                                     fundedProfitTarget: target
                                   });
                                 }}
                                 onFocus={handleNumberInputFocus}
                                 placeholder="e.g. Monthly %"
                               />
                               {formData.fundedProfitTargetPercent && (
                                 <p className="text-xs text-accent dark:text-accent-soft mt-1">
                                   = {formData.currency} {((formData.fundedProfitTargetPercent / 100) * (formData.initialBalance || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                 </p>
                               )}
                             </div>
                           </div>
                           <p className="text-xs text-secondary dark:text-gray-400">
                             Monthly profit target (optional)
                           </p>
                         </div>
                       )}
                     </div>
                  </>
                )}

                <div className="flex justify-end gap-3 mt-8">
                  <button 
                    type="button" 
                    onClick={closeAccountModal}
                    className="px-6 py-3 rounded-xl text-secondary dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="bg-primary dark:bg-accent text-white px-8 py-3 rounded-xl hover:bg-black dark:hover:bg-accent/90 transition-colors"
                  >
                    Save Account
                  </button>
                </div>
              </form>
        </div>
      </div>
    </>
  );
};

