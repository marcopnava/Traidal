import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

export type Card = {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'unknown';
  last4: string;
  holder: string;
  expMonth: number;
  expYear: number;
  addedAt: string;
};

export type Transaction = {
  id: string;
  type: 'deposit' | 'withdraw' | 'send' | 'receive';
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP';
  counterparty?: string;
  note?: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  meta?: Record<string, string>;
};

type WalletData = {
  balance: number;
  currency: 'USD' | 'EUR' | 'GBP';
  cards: Card[];
  transactions: Transaction[];
};

type WalletCtx = WalletData & {
  addCard: (c: Omit<Card, 'id' | 'addedAt'>) => Card;
  removeCard: (id: string) => void;
  deposit: (amount: number, cardId: string) => Transaction;
  send: (amount: number, toEmail: string, note?: string) => Transaction;
  setCurrency: (c: WalletData['currency']) => void;
};

const WalletContext = createContext<WalletCtx | null>(null);

function keyFor(userId: string) { return `traidal:wallet:${userId}`; }
const empty: WalletData = { balance: 0, currency: 'USD', cards: [], transactions: [] };

function seedWallet(): WalletData {
  const now = new Date().toISOString();
  const welcomeTx: Transaction = {
    id: crypto.randomUUID(),
    type: 'receive',
    amount: 150,
    currency: 'USD',
    counterparty: 'Welcome bonus',
    note: 'Demo funds to explore the platform',
    status: 'completed',
    createdAt: now,
  };
  return { balance: 150, currency: 'USD', cards: [], transactions: [welcomeTx] };
}

function detectBrand(num: string): Card['brand'] {
  const n = num.replace(/\s+/g, '');
  if (/^4\d{12,18}$/.test(n)) return 'visa';
  if (/^(5[1-5]\d{14}|2(2[2-9]\d|[3-6]\d{2}|7[01]\d|720)\d{12})$/.test(n)) return 'mastercard';
  if (/^3[47]\d{13}$/.test(n)) return 'amex';
  return 'unknown';
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<WalletData>(empty);

  useEffect(() => {
    if (!user) { setData(empty); return; }
    try {
      const raw = localStorage.getItem(keyFor(user.id));
      if (raw) {
        setData(JSON.parse(raw));
      } else {
        const seeded = seedWallet();
        localStorage.setItem(keyFor(user.id), JSON.stringify(seeded));
        setData(seeded);
      }
    } catch { setData(empty); }
  }, [user?.id]);

  const persist = (next: WalletData) => {
    setData(next);
    if (user) localStorage.setItem(keyFor(user.id), JSON.stringify(next));
  };

  const api = useMemo<WalletCtx>(() => ({
    ...data,
    addCard: (c) => {
      const card: Card = { ...c, id: crypto.randomUUID(), addedAt: new Date().toISOString() };
      const next = { ...data, cards: [card, ...data.cards] };
      persist(next); return card;
    },
    removeCard: (id) => persist({ ...data, cards: data.cards.filter(c => c.id !== id) }),
    deposit: (amount, cardId) => {
      const card = data.cards.find(c => c.id === cardId);
      const tx: Transaction = {
        id: crypto.randomUUID(),
        type: 'deposit',
        amount, currency: data.currency,
        counterparty: card ? `${card.brand.toUpperCase()} •••• ${card.last4}` : 'Card',
        status: 'completed',
        createdAt: new Date().toISOString(),
        meta: cardId ? { cardId } : undefined,
      };
      persist({ ...data, balance: data.balance + amount, transactions: [tx, ...data.transactions] });
      return tx;
    },
    send: (amount, toEmail, note) => {
      const tx: Transaction = {
        id: crypto.randomUUID(),
        type: 'send',
        amount, currency: data.currency,
        counterparty: toEmail, note,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };
      persist({ ...data, balance: data.balance - amount, transactions: [tx, ...data.transactions] });
      return tx;
    },
    setCurrency: (c) => persist({ ...data, currency: c }),
  }), [data, user?.id]);

  return <WalletContext.Provider value={api}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}

export { detectBrand };
