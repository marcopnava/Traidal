import { Account, Trade } from '../types';
import { MOCK_ACCOUNTS } from '../constants';

const ACCOUNTS_KEY = 'traidal_accounts';
const TRADES_KEY = 'traidal_trades';

export const StorageService = {
  getAccounts: (): Account[] => {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    if (!data) {
      // Initialize with mock data for first run
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(MOCK_ACCOUNTS));
      return MOCK_ACCOUNTS as Account[];
    }
    return JSON.parse(data);
  },

  saveAccount: (account: Account) => {
    const accounts = StorageService.getAccounts();
    const existingIndex = accounts.findIndex(a => a.id === account.id);
    
    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
    } else {
      accounts.push(account);
    }
    
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  },

  deleteAccount: (id: string) => {
    const accounts = StorageService.getAccounts().filter(a => a.id !== id);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    // Also cascade delete trades
    const trades = StorageService.getTrades().filter(t => t.accountId !== id);
    localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
  },

  getTrades: (): Trade[] => {
    const data = localStorage.getItem(TRADES_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveTrade: (trade: Trade) => {
    const trades = StorageService.getTrades();
    const existingIndex = trades.findIndex(t => t.id === trade.id);
    
    if (existingIndex >= 0) {
      trades[existingIndex] = trade;
    } else {
      trades.push(trade);
    }
    
    localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
  },

  deleteTrade: (id: string) => {
    const trades = StorageService.getTrades().filter(t => t.id !== id);
    localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
  }
};
