import { Trade, Account, TradeStatus, TradeDirection, AccountType, PropPhase, PropChallengeType, TradingAlert, AlertType, AlertSeverity, AlertSettings } from '../types';

export const calculateRiskReward = (
  entry: number,
  sl: number,
  tp: number,
  direction: TradeDirection
): number => {
  if (!entry || !sl || !tp) return 0;
  
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  
  if (risk === 0) return 0;
  return Number((reward / risk).toFixed(2));
};

export const calculateAccountStats = (account: Account, trades: Trade[]) => {
  // Helper per verificare se closeDatetime è valido
  const hasValidCloseDate = (trade: Trade): boolean => {
    return trade.closeDatetime != null && 
           trade.closeDatetime !== '' && 
           trade.closeDatetime.trim() !== '' &&
           !isNaN(new Date(trade.closeDatetime).getTime());
  };
  
  // Sort trades by date - per trade chiusi usa closeDatetime, per aperti usa openDatetime
  const sortedTrades = [...trades].sort((a, b) => {
    const dateA = hasValidCloseDate(a)
      ? new Date(a.closeDatetime!).getTime() 
      : new Date(a.openDatetime).getTime();
    const dateB = hasValidCloseDate(b)
      ? new Date(b.closeDatetime!).getTime() 
      : new Date(b.openDatetime).getTime();
    return dateA - dateB;
  });

  // Helper function to calculate total P&L with fees
  const getTotalPnlWithFees = (trade: Trade): number => {
    const basePnl = trade.totalPnl || 0;
    const commission = trade.commission || 0;
    const swap = trade.swap || 0;
    return basePnl + commission + swap;
  };
  
  // Considera chiusi i trade con closeDatetime valido OPPURE status CLOSED
  // Ma per il calcolo dell'equity, usa solo quelli con closeDatetime valido
  const closedTrades = sortedTrades.filter(t => hasValidCloseDate(t) || t.status === TradeStatus.CLOSED);
  
  // Debug
  console.log('calculateAccountStats Debug:', {
    totalTrades: trades.length,
    closedTradesCount: closedTrades.length,
    tradesWithCloseDate: sortedTrades.filter(t => hasValidCloseDate(t)).length,
    tradesWithStatusClosed: sortedTrades.filter(t => t.status === TradeStatus.CLOSED).length,
    sampleClosedTrade: closedTrades[0] ? {
      id: closedTrades[0].id,
      status: closedTrades[0].status,
      closeDatetime: closedTrades[0].closeDatetime,
      hasValidCloseDate: hasValidCloseDate(closedTrades[0]),
      totalPnl: closedTrades[0].totalPnl,
      commission: closedTrades[0].commission,
      swap: closedTrades[0].swap
    } : null
  });
  
  // Win Rate (based on total P&L with fees)
  const winningTrades = closedTrades.filter(t => getTotalPnlWithFees(t) > 0);
  const winRate = closedTrades.length > 0 
    ? (winningTrades.length / closedTrades.length) * 100 
    : 0;

  // Profit Factor (with fees)
  const grossProfit = closedTrades.reduce((acc, t) => {
    const totalWithFees = getTotalPnlWithFees(t);
    return acc + (totalWithFees > 0 ? totalWithFees : 0);
  }, 0);
  const grossLoss = Math.abs(closedTrades.reduce((acc, t) => {
    const totalWithFees = getTotalPnlWithFees(t);
    return acc + (totalWithFees < 0 ? totalWithFees : 0);
  }, 0));
  const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;

  // Total P&L (with fees) - usa TUTTI i trade chiusi (con o senza closeDatetime)
  const totalPnl = closedTrades.reduce((acc, t) => acc + getTotalPnlWithFees(t), 0);
  
  console.log('calculateAccountStats P&L:', {
    totalPnl,
    initialBalance: account.initialBalance,
    expectedEquity: account.initialBalance + totalPnl
  });

  // Equity Curve Data & Drawdown
  let currentEquity = account.initialBalance;
  let maxEquity = currentEquity;
  let maxDrawdown = 0;
  let currentDrawdown = 0;

  // Trova il primo trade cronologicamente (più vecchio) per determinare la data di inizio dell'equity curve
  // I trade sono già ordinati per data (dal più vecchio al più recente)
  const firstTrade = sortedTrades.find(trade => {
    const isClosed = hasValidCloseDate(trade) || trade.status === TradeStatus.CLOSED;
    return isClosed;
  });
  
  // Data di inizio: usa la data del primo trade (più vecchio), altrimenti usa la data di creazione dell'account
  const startDate = firstTrade 
    ? (hasValidCloseDate(firstTrade) ? firstTrade.closeDatetime! : firstTrade.openDatetime)
    : account.createdAt;

  const equityCurve = [{ date: startDate, value: account.initialBalance }];

  sortedTrades.forEach(trade => {
    // Considera chiuso se ha closeDatetime valido OPPURE se è CLOSED
    const isClosed = hasValidCloseDate(trade) || trade.status === TradeStatus.CLOSED;
    
    if (isClosed) {
      const totalWithFees = getTotalPnlWithFees(trade);
      currentEquity += totalWithFees;
      
      // Update Peak
      if (currentEquity > maxEquity) {
        maxEquity = currentEquity;
      }

      // Calculate DD
      const dd = maxEquity - currentEquity;
      if (dd > maxDrawdown) {
        maxDrawdown = dd;
      }
      currentDrawdown = dd;

      // Per l'equity curve, usa closeDatetime se disponibile, altrimenti openDatetime
      const dateToUse = hasValidCloseDate(trade) 
        ? trade.closeDatetime! 
        : trade.openDatetime;
      
      equityCurve.push({
        date: dateToUse,
        value: currentEquity
      });
    }
  });
  
  // Ordina l'equity curve per data (importante per il grafico)
  equityCurve.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Assicurati che il primo punto sia sempre quello iniziale con initialBalance alla data del primo trade
  // Se dopo l'ordinamento il primo punto non è quello iniziale, rimuovilo e riaggiungilo all'inizio
  const initialPoint = equityCurve.find(p => 
    new Date(p.date).getTime() === new Date(startDate).getTime() && 
    p.value === account.initialBalance
  );
  
  if (initialPoint) {
    // Rimuovi il punto iniziale dalla sua posizione attuale
    const initialIndex = equityCurve.findIndex(p => p === initialPoint);
    if (initialIndex > 0) {
      equityCurve.splice(initialIndex, 1);
      // Rimetti il punto iniziale all'inizio
      equityCurve.unshift(initialPoint);
    }
  } else {
    // Se il punto iniziale non esiste, aggiungilo all'inizio
    equityCurve.unshift({ date: startDate, value: account.initialBalance });
  }
  
  // Aggiungi sempre un punto finale con la data di oggi e l'equity corrente
  // Questo assicura che il grafico mostri sempre l'equity fino ad oggi, anche senza trade oggi
  const today = new Date().toISOString();
  const lastPoint = equityCurve[equityCurve.length - 1];
  
  // Se l'ultimo punto non è di oggi, aggiungi un punto finale con oggi
  if (!lastPoint || new Date(lastPoint.date).toDateString() !== new Date(today).toDateString()) {
    equityCurve.push({
      date: today,
      value: currentEquity
    });
  } else {
    // Se l'ultimo punto è di oggi, aggiorna il valore con l'equity corrente
    lastPoint.value = currentEquity;
  }
  
  // Riordina dopo aver aggiunto il punto finale, ma mantieni sempre il punto iniziale all'inizio
  equityCurve.sort((a, b) => {
    // Il punto iniziale deve sempre essere il primo
    if (new Date(a.date).getTime() === new Date(account.createdAt).getTime() && a.value === account.initialBalance) {
      return -1;
    }
    if (new Date(b.date).getTime() === new Date(account.createdAt).getTime() && b.value === account.initialBalance) {
      return 1;
    }
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  console.log('calculateAccountStats Equity:', {
    initialBalance: account.initialBalance,
    currentEquity,
    totalPnl,
    calculatedEquity: account.initialBalance + totalPnl,
    equityCurvePoints: equityCurve.length,
    equityCurveSample: equityCurve.slice(0, 3)
  });

  // Avg RR
  const totalRR = closedTrades.reduce((acc, t) => acc + t.riskReward, 0);
  const avgRR = closedTrades.length > 0 ? totalRR / closedTrades.length : 0;

  return {
    totalTrades: closedTrades.length,
    winRate: Number(winRate.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    totalPnl: Number(totalPnl.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    currentDrawdown: Number(currentDrawdown.toFixed(2)),
    currentEquity: Number(currentEquity.toFixed(2)),
    equityCurve,
    avgRR: Number(avgRR.toFixed(2)),
    bestTrade: Math.max(...closedTrades.map(t => getTotalPnlWithFees(t)), 0),
    worstTrade: Math.min(...closedTrades.map(t => getTotalPnlWithFees(t)), 0),
  };
};

export const getDrawdownStatus = (currentDD: number, limit: number) => {
  if (!limit || limit === 0) return { color: 'text-gray-500', status: 'Safe', percent: 0 };
  
  const percent = (currentDD / limit) * 100;
  let color = 'text-green-500';
  let status = 'Safe';
  let bgColor = 'bg-green-500';

  if (percent >= 95) {
    color = 'text-red-600';
    bgColor = 'bg-red-600';
    status = 'Critical';
  } else if (percent >= 85) {
    color = 'text-orange-500';
    bgColor = 'bg-orange-500';
    status = 'Danger';
  } else if (percent >= 70) {
    color = 'text-yellow-500';
    bgColor = 'bg-yellow-500';
    status = 'Warning';
  }

  return { color, status, percent, bgColor };
};

/**
 * Check and update PROP account phase progression based on profit targets
 * Returns updated account if phase should change, otherwise returns original account
 */
export const checkAndUpdatePropPhase = (account: Account, trades: Trade[]): Account => {
  // Only process PROP accounts
  if (account.type !== AccountType.PROP || !account.phase) {
    return account;
  }

  // Filter trades for this account and calculate current phase P&L
  const accountTrades = trades.filter(t => t.accountId === account.id && t.status === TradeStatus.CLOSED);
  
  // Calculate total P&L for current phase
  // Note: In a real implementation, you'd track when phase changed and only count trades after that
  // For now, we calculate total P&L
  const totalPnL = accountTrades.reduce((sum, t) => sum + t.totalPnl, 0);
  
  // Update currentPhasePnL
  const updatedAccount = { ...account, currentPhasePnL: totalPnL };

  // Check Phase 1 -> Phase 2 or Funded
  if (account.phase === PropPhase.PHASE_1 && account.phase1ProfitTarget && totalPnL >= account.phase1ProfitTarget) {
    if (account.challengeType === PropChallengeType.TWO_PHASE) {
      // Move to Phase 2
      return {
        ...updatedAccount,
        phase: PropPhase.PHASE_2,
        currentPhasePnL: 0 // Reset for new phase
      };
    } else if (account.challengeType === PropChallengeType.ONE_PHASE) {
      // Move directly to Funded
      return {
        ...updatedAccount,
        type: AccountType.FUNDED,
        phase: PropPhase.FUNDED,
        currentPhasePnL: 0 // Reset for funded phase
      };
    }
  }

  // Check Phase 2 -> Funded
  if (account.phase === PropPhase.PHASE_2 && account.phase2ProfitTarget && totalPnL >= account.phase2ProfitTarget) {
    return {
      ...updatedAccount,
      type: AccountType.FUNDED,
      phase: PropPhase.FUNDED,
      currentPhasePnL: 0 // Reset for funded phase
    };
  }

  return updatedAccount;
};

/**
 * Calculate win/loss streaks for trades
 */
export const calculateStreaks = (trades: Trade[]) => {
  const closedTrades = trades
    .filter(t => t.status === TradeStatus.CLOSED)
    .sort((a, b) => 
      new Date(a.closeDatetime || a.openDatetime).getTime() - 
      new Date(b.closeDatetime || b.openDatetime).getTime()
    );

  if (closedTrades.length === 0) {
    return {
      currentStreak: 0,
      currentStreakType: 'none' as 'win' | 'loss' | 'none',
      bestWinStreak: 0,
      worstLossStreak: 0,
    };
  }

  let currentStreak = 0;
  let currentStreakType: 'win' | 'loss' | 'none' = 'none';
  let tempStreak = 0;
  let tempStreakType: 'win' | 'loss' | 'none' = 'none';
  let bestWinStreak = 0;
  let worstLossStreak = 0;

  closedTrades.forEach((trade, index) => {
    const isWin = trade.totalPnl > 0;
    const streakType = isWin ? 'win' : 'loss';

    if (index === 0) {
      tempStreak = 1;
      tempStreakType = streakType;
    } else if (streakType === tempStreakType) {
      tempStreak++;
    } else {
      // Streak broken, record if it's a record
      if (tempStreakType === 'win' && tempStreak > bestWinStreak) {
        bestWinStreak = tempStreak;
      }
      if (tempStreakType === 'loss' && tempStreak > worstLossStreak) {
        worstLossStreak = tempStreak;
      }
      // Start new streak
      tempStreak = 1;
      tempStreakType = streakType;
    }

    // If it's the last trade, this is the current streak
    if (index === closedTrades.length - 1) {
      currentStreak = tempStreak;
      currentStreakType = tempStreakType;
      
      // Also check if it's a record
      if (tempStreakType === 'win' && tempStreak > bestWinStreak) {
        bestWinStreak = tempStreak;
      }
      if (tempStreakType === 'loss' && tempStreak > worstLossStreak) {
        worstLossStreak = tempStreak;
      }
    }
  });

  return {
    currentStreak,
    currentStreakType,
    bestWinStreak,
    worstLossStreak,
  };
};

/**
 * Calculate trading expectancy (average $ per trade)
 */
export const calculateExpectancy = (trades: Trade[]) => {
  const closedTrades = trades.filter(t => t.status === TradeStatus.CLOSED);
  
  if (closedTrades.length === 0) return 0;

  const winningTrades = closedTrades.filter(t => t.totalPnl > 0);
  const losingTrades = closedTrades.filter(t => t.totalPnl < 0);

  const winRate = winningTrades.length / closedTrades.length;
  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + t.totalPnl, 0) / winningTrades.length 
    : 0;
  const avgLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, t) => sum + t.totalPnl, 0) / losingTrades.length)
    : 0;

  const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);
  
  return Number(expectancy.toFixed(2));
};

/**
 * Calculate days in drawdown (days since peak equity)
 */
export const calculateDaysInDrawdown = (account: Account, trades: Trade[]): number => {
  const sortedTrades = [...trades]
    .filter(t => t.status === TradeStatus.CLOSED)
    .sort((a, b) => 
      new Date(a.closeDatetime || a.openDatetime).getTime() - 
      new Date(b.closeDatetime || b.openDatetime).getTime()
    );

  if (sortedTrades.length === 0) return 0;

  let currentEquity = account.initialBalance;
  let maxEquity = currentEquity;
  let peakDate = new Date(account.createdAt);

  sortedTrades.forEach(trade => {
    currentEquity += trade.totalPnl;
    if (currentEquity > maxEquity) {
      maxEquity = currentEquity;
      peakDate = new Date(trade.closeDatetime || trade.openDatetime);
    }
  });

  // If current equity equals max equity, we're at peak (0 days in DD)
  if (currentEquity === maxEquity) return 0;

  // Calculate days since peak
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - peakDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Detect trading alerts for an account based on current performance
 */
export const detectAccountAlerts = (
  account: Account,
  trades: Trade[],
  settings: AlertSettings
): TradingAlert[] => {
  const alerts: TradingAlert[] = [];
  const stats = calculateAccountStats(account, trades);
  const now = new Date().toISOString();

  // 1. Max Drawdown Alerts
  if (account.maxDrawdownLimit && account.maxDrawdownLimit > 0) {
    const currentDD = Math.abs(stats.currentDrawdown);
    const ddPercentage = (currentDD / account.maxDrawdownLimit) * 100;

    if (ddPercentage >= settings.maxDrawdownCritical) {
      alerts.push({
        id: `${account.id}-max-dd-critical-${Date.now()}`,
        accountId: account.id,
        type: AlertType.MAX_DD,
        severity: AlertSeverity.CRITICAL,
        message: `Critical: Max Drawdown at ${ddPercentage.toFixed(1)}% of limit!`,
        currentValue: currentDD,
        limitValue: account.maxDrawdownLimit,
        percentage: ddPercentage,
        isRead: false,
        createdAt: now,
      });
    } else if (ddPercentage >= settings.maxDrawdownDanger) {
      alerts.push({
        id: `${account.id}-max-dd-danger-${Date.now()}`,
        accountId: account.id,
        type: AlertType.MAX_DD,
        severity: AlertSeverity.DANGER,
        message: `Danger: Max Drawdown at ${ddPercentage.toFixed(1)}% of limit`,
        currentValue: currentDD,
        limitValue: account.maxDrawdownLimit,
        percentage: ddPercentage,
        isRead: false,
        createdAt: now,
      });
    } else if (ddPercentage >= settings.maxDrawdownWarning) {
      alerts.push({
        id: `${account.id}-max-dd-warning-${Date.now()}`,
        accountId: account.id,
        type: AlertType.MAX_DD,
        severity: AlertSeverity.WARNING,
        message: `Warning: Max Drawdown at ${ddPercentage.toFixed(1)}% of limit`,
        currentValue: currentDD,
        limitValue: account.maxDrawdownLimit,
        percentage: ddPercentage,
        isRead: false,
        createdAt: now,
      });
    }
  }

  // 2. Daily Drawdown Alerts
  if (account.dailyDrawdownLimit && account.dailyDrawdownLimit > 0) {
    const today = new Date().toISOString().split('T')[0];
    const todayTrades = trades.filter(t => 
      t.status === TradeStatus.CLOSED && 
      t.closeDatetime?.startsWith(today)
    );
    const dailyPnL = todayTrades.reduce((sum, t) => sum + t.totalPnl, 0);
    
    if (dailyPnL < 0) {
      const dailyDD = Math.abs(dailyPnL);
      const dailyDDPercentage = (dailyDD / account.dailyDrawdownLimit) * 100;

      if (dailyDDPercentage >= settings.dailyDrawdownCritical) {
        alerts.push({
          id: `${account.id}-daily-dd-critical-${Date.now()}`,
          accountId: account.id,
          type: AlertType.DAILY_DD,
          severity: AlertSeverity.CRITICAL,
          message: `Critical: Daily Drawdown at ${dailyDDPercentage.toFixed(1)}% of limit!`,
          currentValue: dailyDD,
          limitValue: account.dailyDrawdownLimit,
          percentage: dailyDDPercentage,
          isRead: false,
          createdAt: now,
        });
      } else if (dailyDDPercentage >= settings.dailyDrawdownDanger) {
        alerts.push({
          id: `${account.id}-daily-dd-danger-${Date.now()}`,
          accountId: account.id,
          type: AlertType.DAILY_DD,
          severity: AlertSeverity.DANGER,
          message: `Danger: Daily Drawdown at ${dailyDDPercentage.toFixed(1)}% of limit`,
          currentValue: dailyDD,
          limitValue: account.dailyDrawdownLimit,
          percentage: dailyDDPercentage,
          isRead: false,
          createdAt: now,
        });
      } else if (dailyDDPercentage >= settings.dailyDrawdownWarning) {
        alerts.push({
          id: `${account.id}-daily-dd-warning-${Date.now()}`,
          accountId: account.id,
          type: AlertType.DAILY_DD,
          severity: AlertSeverity.WARNING,
          message: `Warning: Daily Drawdown at ${dailyDDPercentage.toFixed(1)}% of limit`,
          currentValue: dailyDD,
          limitValue: account.dailyDrawdownLimit,
          percentage: dailyDDPercentage,
          isRead: false,
          createdAt: now,
        });
      }
    }
  }

  // 3. PROP Profit Target Alerts
  if (account.type === AccountType.PROP && account.phase) {
    const currentPhasePnL = account.currentPhasePnL || 0;
    let targetPnL = 0;

    if (account.phase === PropPhase.PHASE_1 && account.phase1ProfitTarget) {
      targetPnL = account.phase1ProfitTarget;
    } else if (account.phase === PropPhase.PHASE_2 && account.phase2ProfitTarget) {
      targetPnL = account.phase2ProfitTarget;
    } else if (account.phase === PropPhase.FUNDED && account.fundedProfitTarget) {
      targetPnL = account.fundedProfitTarget;
    }

    if (targetPnL > 0) {
      const targetPercentage = (currentPhasePnL / targetPnL) * 100;

      // Target reached!
      if (targetPercentage >= 100) {
        alerts.push({
          id: `${account.id}-target-success-${Date.now()}`,
          accountId: account.id,
          type: AlertType.PROFIT_TARGET,
          severity: AlertSeverity.SUCCESS,
          message: `🎉 Profit target reached for ${account.phase}!`,
          currentValue: currentPhasePnL,
          limitValue: targetPnL,
          percentage: targetPercentage,
          isRead: false,
          createdAt: now,
        });
      } 
      // Close to target
      else if (targetPercentage >= settings.profitTargetInfo) {
        alerts.push({
          id: `${account.id}-target-info-${Date.now()}`,
          accountId: account.id,
          type: AlertType.PROFIT_TARGET,
          severity: AlertSeverity.INFO,
          message: `You're at ${targetPercentage.toFixed(1)}% of your profit target!`,
          currentValue: currentPhasePnL,
          limitValue: targetPnL,
          percentage: targetPercentage,
          isRead: false,
          createdAt: now,
        });
      }
    }
  }

  return alerts;
};

/**
 * Get default alert settings
 */
export const getDefaultAlertSettings = (): AlertSettings => ({
  maxDrawdownWarning: 70,
  maxDrawdownDanger: 80,
  maxDrawdownCritical: 90,
  dailyDrawdownWarning: 60,
  dailyDrawdownDanger: 80,
  dailyDrawdownCritical: 90,
  profitTargetInfo: 80,
  enableSounds: true,
  enableNotifications: true,
});
