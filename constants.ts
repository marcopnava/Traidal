import { Broker, AccountType, Currency, PropPhase } from './types';

export const BROKERS = Object.values(Broker);
export const ACCOUNT_TYPES = Object.values(AccountType);
export const CURRENCIES = Object.values(Currency);
export const PROP_PHASES = Object.values(PropPhase);

export const TRADING_PAIRS = [
  // Forex Major
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD',
  // Forex Cross EUR
  'EURAUD', 'EURCAD', 'EURCHF', 'EURGBP', 'EURJPY', 'EURNZD',
  // Forex Cross GBP
  'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPJPY', 'GBPNZD',
  // Indices
  'US100', 'US500', 'US30', 'GER40',
  // Commodities
  'XAUUSD', 'XAGUSD', 'USOIL',
  // Crypto
  'BTCUSD', 'ETHUSD', 'XRPUSD'
];

export const MOCK_ACCOUNTS = [
  {
    id: 'acc-1',
    name: 'FTMO 100k Challenge',
    type: AccountType.PROP,
    broker: Broker.FTMO,
    phase: PropPhase.PHASE_1,
    currency: Currency.USD,
    initialBalance: 100000,
    challengeCost: 540,
    maxDrawdownLimit: 10000,
    dailyDrawdownLimit: 5000,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc-2',
    name: 'Darwinex Real',
    type: AccountType.REAL,
    broker: Broker.DARWINEX,
    currency: Currency.EUR,
    initialBalance: 5000,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  }
];
