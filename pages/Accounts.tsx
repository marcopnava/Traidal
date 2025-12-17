import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Account, AccountType } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Plus, Trash2, Edit2, Users as UsersIcon } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { BackButton } from '../components/ui/BackButton';
import { showSuccess, showError } from '../components/ui/Toast';
// import { motion } from 'framer-motion'; // Temporarily disabled to fix build issue
import { useAccountModal } from '../contexts/AccountModalContext';
import { CreateAccountModal } from '../components/accounts/CreateAccountModal';

export const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const { openAccountModal, setEditingId, setFormData } = useAccountModal();
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; accountId: string | null }>({
    isOpen: false,
    accountId: null
  });

  useEffect(() => {
    const loadAccounts = async () => {
      setLoading(true);
      try {
        const loadedAccounts = await SupabaseService.getAccounts();
        setAccounts(loadedAccounts);
      } catch (error) {
        console.error('Error loading accounts:', error);
        showError('Failed to load accounts');
      } finally {
        setLoading(false);
      }
    };
    loadAccounts();
  }, []);

  const handleAccountCreated = async () => {
    const loadedAccounts = await SupabaseService.getAccounts();
    setAccounts(loadedAccounts);
  };

  const handleEdit = (acc: Account) => {
    setFormData(acc);
    setEditingId(acc.id);
    openAccountModal();
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, accountId: id });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.accountId) {
      try {
        await SupabaseService.deleteAccount(deleteConfirm.accountId);
        const loadedAccounts = await SupabaseService.getAccounts();
        setAccounts(loadedAccounts);
        showSuccess('Account deleted successfully');
      } catch (error) {
        console.error('Error deleting account:', error);
        showError('Failed to delete account');
      }
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
      <div className="max-w-6xl mx-auto">
        <EmptyState
          icon={UsersIcon}
          title="No Accounts Yet"
          description="Create your first trading account to start tracking your trades and performance metrics."
          actionLabel="Create Account"
          onAction={openAccountModal}
        />
        <CreateAccountModal onAccountCreated={handleAccountCreated} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <BackButton to="/" label="Back to Dashboard" />
      <div className="flex justify-between items-center mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Accounts</h1>
        <button 
          onClick={openAccountModal}
          className="bg-primary dark:bg-accent text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-black dark:hover:bg-accent/90 transition-colors shadow-lg shadow-primary/20 dark:shadow-accent/20"
        >
          <Plus size={20} /> New Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc, index) => (
          <div key={acc.id}>
            <Card className="relative group overflow-hidden border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
              <div className={`absolute top-0 left-0 w-2 h-full ${acc.type === AccountType.REAL ? 'bg-blue-500' : 'bg-accent'}`} />
              
              <div className="pl-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{acc.name}</h3>
                    <p className="text-sm text-secondary dark:text-gray-400">{acc.broker}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    acc.status === 'ACTIVE' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {acc.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-secondary dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Balance:</span>
                    <span className="font-semibold text-primary dark:text-white">{acc.currency} {acc.initialBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-semibold text-primary dark:text-white">{acc.type}</span>
                  </div>
                  {acc.type === AccountType.PROP && acc.challengeType && (
                    <>
                      <div className="flex justify-between">
                         <span>Challenge:</span>
                         <span className="font-semibold text-primary dark:text-white">
                           {acc.challengeType === 'ONE_PHASE' ? '1-Phase' : acc.challengeType === 'TWO_PHASE' ? '2-Phase' : 'Instant'}
                         </span>
                      </div>
                      <div className="flex justify-between">
                         <span>Phase:</span>
                         <span className="font-semibold text-primary dark:text-white">{acc.phase}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(acc)}
                    className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-primary dark:text-white transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(acc.id)}
                    className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 dark:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, accountId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Account?"
        message="This will permanently delete this account and all associated trades. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <CreateAccountModal onAccountCreated={handleAccountCreated} />
    </div>
  );
};
