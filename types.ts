export enum AccountType {
  REAL = 'REAL',
  PROP = 'PROP'
}

export enum Broker {
  DARWINEX = 'Darwinex',
  KEY_TO_MARKETS = 'Key to Markets',
  FTMO = 'FTMO',
  SOAR_FUNDING = 'Soar Funding',
  DARWINEX_ZERO = 'DarwinexZero'
}

export enum PropPhase {
  PHASE_1 = 'PHASE_1',
  PHASE_2 = 'PHASE_2',
  INSTANT = 'INSTANT',
  FUNDED = 'FUNDED'
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FAILED = 'FAILED',
  PASSED = 'PASSED'
}

export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP'
}

export enum TradeDirection {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export enum TradeStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  broker: Broker;
  phase?: PropPhase;
  currency: Currency;
  initialBalance: number;
  challengeCost?: number;
  maxDrawdownLimit?: number; // Absolute value or calculated amount
  dailyDrawdownLimit?: number;
  profitSplitPercent?: number;
  status: AccountStatus;
  createdAt: string;
}

export interface PartialClose {
  id: string;
  tradeId: string;
  closeNumber: number;
  closeDatetime: string;
  exitPrice: number;
  lotsClosed: number;
  pnl: number;
}

export interface Trade {
  id: string;
  accountId: string;
  pair: string; // Enum simplified to string for flexibility in UI but validated against list
  direction: TradeDirection;
  openDatetime: string;
  closeDatetime?: string;
  entryPrice: number;
  exitPrice?: number; // Final exit price
  stopLoss: number;
  takeProfit: number;
  totalLots: number;
  totalPnl: number; // Includes partials
  riskReward: number;
  screenshotUrl?: string;
  notes?: string;
  status: TradeStatus;
  partials: PartialClose[];
}

// Alert Types
export enum AlertSeverity {
  WARNING = 'WARNING',
  DANGER = 'DANGER',
  CRITICAL = 'CRITICAL'
}

export interface TradingAlert {
  id: string;
  accountId: string;
  type: 'MAX_DD' | 'DAILY_DD';
  severity: AlertSeverity;
  currentValue: number;
  limitValue: number;
  percentage: number;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  avgRR: number;
  totalPnl: number;
  currentDrawdown: number;
  maxDrawdown: number;
  equity: number;
  balance: number;
  bestTrade: number;
  worstTrade: number;
}