export enum AccountType {
  REAL = 'REAL',
  DEMO = 'DEMO',
  PROP = 'PROP',
  FUNDED = 'FUNDED'
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

export enum PropChallengeType {
  ONE_PHASE = 'ONE_PHASE',
  TWO_PHASE = 'TWO_PHASE',
  INSTANT = 'INSTANT'
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
  challengeType?: PropChallengeType;
  currency: Currency;
  initialBalance: number;
  challengeCost?: number;
  maxDrawdownLimit?: number; // Absolute value or calculated amount
  dailyDrawdownLimit?: number;
  profitSplitPercent?: number;
  
  // PROP Phase Targets
  phase1ProfitTarget?: number;
  phase2ProfitTarget?: number;
  fundedProfitTarget?: number;
  phase1ProfitTargetPercent?: number; // Percentuale del conto per Phase 1
  phase2ProfitTargetPercent?: number; // Percentuale del conto per Phase 2
  fundedProfitTargetPercent?: number; // Percentuale del conto per Funded
  currentPhasePnL?: number; // Profit/Loss nella fase corrente (si resetta al cambio fase)
  
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
  totalPnl: number; // Base P&L (senza commissioni/swap)
  commission?: number; // Commissioni (positive o negative)
  swap?: number; // Swap (positive o negative)
  riskReward: number;
  screenshotUrl?: string;
  notes?: string;
  status: TradeStatus;
  partials: PartialClose[];
}

// Alert Types
export enum AlertSeverity {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  DANGER = 'DANGER',
  CRITICAL = 'CRITICAL'
}

export enum AlertType {
  MAX_DD = 'MAX_DD',
  DAILY_DD = 'DAILY_DD',
  PROFIT_TARGET = 'PROFIT_TARGET',
  PHASE_PASSED = 'PHASE_PASSED'
}

export interface TradingAlert {
  id: string;
  accountId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  currentValue: number;
  limitValue: number;
  percentage: number;
  isRead: boolean;
  createdAt: string;
}

export interface AlertSettings {
  maxDrawdownWarning: number; // Percentage (default 70)
  maxDrawdownDanger: number; // Percentage (default 80)
  maxDrawdownCritical: number; // Percentage (default 90)
  dailyDrawdownWarning: number; // Percentage (default 60)
  dailyDrawdownDanger: number; // Percentage (default 80)
  dailyDrawdownCritical: number; // Percentage (default 90)
  profitTargetInfo: number; // Percentage (default 80)
  enableSounds: boolean;
  enableNotifications: boolean;
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