import { supabase } from '../lib/supabase';
import { Account, Trade, TradingAlert, AlertSettings } from '../types';

export const SupabaseService = {
  // Accounts
  async getAccounts(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
    
    if (!data) return [];
    return data.map(transformAccountFromDB);
  },

  async saveAccount(account: Account): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const dbAccount = transformAccountToDB(account, user.id);
    
    // Log the data being sent (for debugging)
    console.log('Saving account to DB:', JSON.stringify(dbAccount, null, 2));
    console.log('User ID:', user.id);
    
    const { data, error } = await supabase
      .from('accounts')
      .upsert(dbAccount, {
        onConflict: 'id'
      })
      .select();
    
    if (error) {
      console.error('Supabase error saving account:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      });
      
      // Provide more detailed error message based on error code
      let errorMsg = error.message || 'Failed to save account';
      if (error.code === '42501') {
        errorMsg = 'Permission denied. Please check Row Level Security (RLS) policies on the accounts table.';
      } else if (error.code === '23502') {
        errorMsg = `Missing required field: ${error.hint || 'unknown field'}`;
      } else if (error.code === '23505') {
        errorMsg = 'An account with this ID already exists.';
      } else if (error.code === 'PGRST116') {
        errorMsg = 'No rows returned. Check RLS policies.';
      } else if (error.details) {
        errorMsg = `${error.message}: ${error.details}`;
      }
      
      throw new Error(errorMsg); 
    }
    
    console.log('Account saved successfully:', data);
    
    if (!data || data.length === 0) {
      throw new Error('Account saved but no data returned');
    }
  },

  async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  // Trades
  async getTrades(accountId?: string): Promise<Trade[]> {
    let query = supabase
      .from('trades')
      .select(`
        *,
        partial_closes (*)
      `)
      .order('open_datetime', { ascending: false });
    
    if (accountId) {
      query = query.eq('account_id', accountId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching trades:', error);
      throw error;
    }
    
    if (!data) return [];
    return data.map(transformTradeFromDB);
  },

  async saveTrade(trade: Trade): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const dbTrade = transformTradeToDB(trade, user.id);
    const { partials, ...tradeData } = dbTrade;
    
    // Save trade
    const { error: tradeError } = await supabase
      .from('trades')
      .upsert(tradeData);
    
    if (tradeError) {
      console.error('Error saving trade:', tradeError);
      throw tradeError;
    }
    
    // Delete existing partials and insert new ones
    if (partials && partials.length > 0) {
      await supabase
        .from('partial_closes')
        .delete()
        .eq('trade_id', trade.id);
      
      const { error: partialsError } = await supabase
        .from('partial_closes')
        .insert(partials.map(p => ({
          id: p.id,
          trade_id: trade.id,
          close_number: p.closeNumber,
          close_datetime: p.closeDatetime,
          exit_price: p.exitPrice,
          lots_closed: p.lotsClosed,
          pnl: p.pnl
        })));
      
      if (partialsError) {
        console.error('Error saving partial closes:', partialsError);
        throw partialsError;
      }
    } else {
      // If no partials, delete any existing ones
      await supabase
        .from('partial_closes')
        .delete()
        .eq('trade_id', trade.id);
    }
  },

  async deleteTrade(id: string): Promise<void> {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting trade:', error);
      throw error;
    }
  },

  // Alerts
  async getAlerts(): Promise<TradingAlert[]> {
    const { data, error } = await supabase
      .from('trading_alerts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
    
    if (!data) return [];
    return data.map(transformAlertFromDB);
  },

  async saveAlert(alert: TradingAlert): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const dbAlert = transformAlertToDB(alert, user.id);
    const { error } = await supabase
      .from('trading_alerts')
      .upsert(dbAlert);
    
    if (error) {
      console.error('Error saving alert:', error);
      throw error;
    }
  },

  async deleteAlert(id: string): Promise<void> {
    const { error } = await supabase
      .from('trading_alerts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  },

  // Alert Settings
  async getAlertSettings(): Promise<AlertSettings> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Return defaults if not authenticated
      return {
        maxDrawdownWarning: 70,
        maxDrawdownDanger: 80,
        maxDrawdownCritical: 90,
        dailyDrawdownWarning: 60,
        dailyDrawdownDanger: 80,
        dailyDrawdownCritical: 90,
        profitTargetInfo: 80,
        enableSounds: true,
        enableNotifications: true
      };
    }

    const { data, error } = await supabase
      .from('alert_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching alert settings:', error);
      throw error;
    }
    
    if (!data) {
      // Return defaults if no settings exist
      return {
        maxDrawdownWarning: 70,
        maxDrawdownDanger: 80,
        maxDrawdownCritical: 90,
        dailyDrawdownWarning: 60,
        dailyDrawdownDanger: 80,
        dailyDrawdownCritical: 90,
        profitTargetInfo: 80,
        enableSounds: true,
        enableNotifications: true
      };
    }
    
    return transformAlertSettingsFromDB(data);
  },

  async saveAlertSettings(settings: AlertSettings): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const dbSettings = transformAlertSettingsToDB(settings, user.id);
    const { error } = await supabase
      .from('alert_settings')
      .upsert(dbSettings);
    
    if (error) {
      console.error('Error saving alert settings:', error);
      throw error;
    }
  }
};

// Transform functions (snake_case <-> camelCase)
function transformAccountFromDB(db: any): Account {
  return {
    id: db.id,
    name: db.name,
    type: db.type,
    broker: db.broker,
    phase: db.phase,
    challengeType: db.challenge_type,
    currency: db.currency,
    initialBalance: parseFloat(db.initial_balance),
    challengeCost: db.challenge_cost ? parseFloat(db.challenge_cost) : undefined,
    maxDrawdownLimit: db.max_drawdown_limit ? parseFloat(db.max_drawdown_limit) : undefined,
    dailyDrawdownLimit: db.daily_drawdown_limit ? parseFloat(db.daily_drawdown_limit) : undefined,
    profitSplitPercent: db.profit_split_percent,
    phase1ProfitTarget: db.phase1_profit_target ? parseFloat(db.phase1_profit_target) : undefined,
    phase2ProfitTarget: db.phase2_profit_target ? parseFloat(db.phase2_profit_target) : undefined,
    fundedProfitTarget: db.funded_profit_target ? parseFloat(db.funded_profit_target) : undefined,
    phase1ProfitTargetPercent: db.phase1_profit_target_percent ? parseFloat(db.phase1_profit_target_percent) : undefined,
    phase2ProfitTargetPercent: db.phase2_profit_target_percent ? parseFloat(db.phase2_profit_target_percent) : undefined,
    fundedProfitTargetPercent: db.funded_profit_target_percent ? parseFloat(db.funded_profit_target_percent) : undefined,
    currentPhasePnL: db.current_phase_pnl ? parseFloat(db.current_phase_pnl) : undefined,
    status: db.status,
    createdAt: db.created_at
  };
}

function transformAccountToDB(account: Account, userId: string): any {
  // Convert undefined to null for Supabase (Supabase doesn't accept undefined)
  const toNull = (value: any) => value === undefined ? null : value;
  
  // Ensure numeric values are properly formatted
  const toNumber = (value: any): number | null => {
    if (value === undefined || value === null) return null;
    const num = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(num) ? null : num;
  };
  
  return {
    id: account.id,
    user_id: userId,
    name: account.name?.trim() || '',
    type: account.type,
    broker: account.broker,
    phase: toNull(account.phase),
    challenge_type: toNull(account.challengeType),
    currency: account.currency,
    initial_balance: toNumber(account.initialBalance),
    challenge_cost: toNumber(account.challengeCost),
    max_drawdown_limit: toNumber(account.maxDrawdownLimit),
    daily_drawdown_limit: toNumber(account.dailyDrawdownLimit),
    profit_split_percent: toNumber(account.profitSplitPercent),
    phase1_profit_target: toNumber(account.phase1ProfitTarget),
    phase2_profit_target: toNumber(account.phase2ProfitTarget),
    funded_profit_target: toNumber(account.fundedProfitTarget),
    phase1_profit_target_percent: toNumber(account.phase1ProfitTargetPercent),
    phase2_profit_target_percent: toNumber(account.phase2ProfitTargetPercent),
    funded_profit_target_percent: toNumber(account.fundedProfitTargetPercent),
    current_phase_pnl: toNumber(account.currentPhasePnL),
    status: account.status || 'ACTIVE' // Default to ACTIVE if not provided
  };
}

function transformTradeFromDB(db: any): Trade {
  return {
    id: db.id,
    accountId: db.account_id,
    pair: db.pair,
    direction: db.direction,
    openDatetime: db.open_datetime,
    closeDatetime: db.close_datetime,
    entryPrice: parseFloat(db.entry_price),
    exitPrice: db.exit_price ? parseFloat(db.exit_price) : undefined,
    stopLoss: parseFloat(db.stop_loss),
    takeProfit: parseFloat(db.take_profit),
    totalLots: parseFloat(db.total_lots),
    totalPnl: parseFloat(db.total_pnl),
    commission: db.commission ? parseFloat(db.commission) : undefined,
    swap: db.swap ? parseFloat(db.swap) : undefined,
    riskReward: db.risk_reward ? parseFloat(db.risk_reward) : 0,
    screenshotUrl: db.screenshot_url,
    notes: db.notes,
    status: db.status,
    partials: (db.partial_closes || []).map((p: any) => ({
      id: p.id,
      tradeId: p.trade_id,
      closeNumber: p.close_number,
      closeDatetime: p.close_datetime,
      exitPrice: parseFloat(p.exit_price),
      lotsClosed: parseFloat(p.lots_closed),
      pnl: parseFloat(p.pnl)
    }))
  };
}

function transformTradeToDB(trade: Trade, userId: string): any {
  return {
    id: trade.id,
    user_id: userId,
    account_id: trade.accountId,
    pair: trade.pair,
    direction: trade.direction,
    open_datetime: trade.openDatetime,
    close_datetime: trade.closeDatetime,
    entry_price: trade.entryPrice,
    exit_price: trade.exitPrice,
    stop_loss: trade.stopLoss,
    take_profit: trade.takeProfit,
    total_lots: trade.totalLots,
    total_pnl: trade.totalPnl,
    commission: trade.commission,
    swap: trade.swap,
    risk_reward: trade.riskReward,
    screenshot_url: trade.screenshotUrl,
    notes: trade.notes,
    status: trade.status
  };
}

function transformAlertFromDB(db: any): TradingAlert {
  return {
    id: db.id,
    accountId: db.account_id,
    type: db.type,
    severity: db.severity,
    message: db.message,
    currentValue: parseFloat(db.current_value),
    limitValue: parseFloat(db.limit_value),
    percentage: parseFloat(db.percentage),
    isRead: db.is_read,
    createdAt: db.created_at
  };
}

function transformAlertToDB(alert: TradingAlert, userId: string): any {
  return {
    id: alert.id,
    user_id: userId,
    account_id: alert.accountId,
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    current_value: alert.currentValue,
    limit_value: alert.limitValue,
    percentage: alert.percentage,
    is_read: alert.isRead
  };
}

function transformAlertSettingsFromDB(db: any): AlertSettings {
  return {
    maxDrawdownWarning: db.max_drawdown_warning,
    maxDrawdownDanger: db.max_drawdown_danger,
    maxDrawdownCritical: db.max_drawdown_critical,
    dailyDrawdownWarning: db.daily_drawdown_warning,
    dailyDrawdownDanger: db.daily_drawdown_danger,
    dailyDrawdownCritical: db.daily_drawdown_critical,
    profitTargetInfo: db.profit_target_info,
    enableSounds: db.enable_sounds,
    enableNotifications: db.enable_notifications
  };
}

function transformAlertSettingsToDB(settings: AlertSettings, userId: string): any {
  return {
    user_id: userId,
    max_drawdown_warning: settings.maxDrawdownWarning,
    max_drawdown_danger: settings.maxDrawdownDanger,
    max_drawdown_critical: settings.maxDrawdownCritical,
    daily_drawdown_warning: settings.dailyDrawdownWarning,
    daily_drawdown_danger: settings.dailyDrawdownDanger,
    daily_drawdown_critical: settings.dailyDrawdownCritical,
    profit_target_info: settings.profitTargetInfo,
    enable_sounds: settings.enableSounds,
    enable_notifications: settings.enableNotifications
  };
}

