import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Account, AccountType, Broker, Currency, PropPhase, PropChallengeType, AccountStatus } from '../types';

interface AccountModalContextType {
  isModalOpen: boolean;
  editingId: string | null;
  formData: Partial<Account>;
  openAccountModal: () => void;
  closeAccountModal: () => void;
  setEditingId: (id: string | null) => void;
  setFormData: (data: Partial<Account>) => void;
  resetForm: () => void;
}

const AccountModalContext = createContext<AccountModalContextType | undefined>(undefined);

export const AccountModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Account>>({
    name: '',
    type: AccountType.PROP,
    broker: Broker.FTMO,
    currency: Currency.USD,
    initialBalance: 0,
    status: AccountStatus.ACTIVE,
    phase: PropPhase.PHASE_1
  });

  const openAccountModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeAccountModal = () => {
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

  return (
    <AccountModalContext.Provider
      value={{
        isModalOpen,
        editingId,
        formData,
        openAccountModal,
        closeAccountModal,
        setEditingId,
        setFormData,
        resetForm
      }}
    >
      {children}
    </AccountModalContext.Provider>
  );
};

export const useAccountModal = () => {
  const context = useContext(AccountModalContext);
  if (context === undefined) {
    throw new Error('useAccountModal must be used within an AccountModalProvider');
  }
  return context;
};

