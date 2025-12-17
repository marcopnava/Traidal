import React, { useMemo, useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { BackButton } from '../components/ui/BackButton';
import { SupabaseService } from '../services/supabaseService';
import { Trade, Account } from '../types';

export const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [isAccountSelectOpen, setIsAccountSelectOpen] = useState(false);
  const accountSelectRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const loadedTrades = await SupabaseService.getTrades();
        const loadedAccounts = await SupabaseService.getAccounts();
        setTrades(loadedTrades);
        setAccounts(loadedAccounts);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
    // Refresh automatico ogni 30 secondi
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Click outside per chiudere il selettore
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountSelectRef.current && !accountSelectRef.current.contains(event.target as Node)) {
        setIsAccountSelectOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Calcola P&L per ogni giorno (con commissioni e swap) - filtrato per account selezionato
  const dailyPnLData = useMemo(() => {
    const pnlByDay: Record<string, { 
      total: number; 
      byAccount: Record<string, number>; 
      trades: number;
      tradeList: Array<{ id: string; pair: string; pnl: number; accountId: string }>;
    }> = {};
    
    // Helper per verificare se closeDatetime è valido
    const hasValidCloseDate = (trade: Trade): boolean => {
      return trade.closeDatetime != null && 
             trade.closeDatetime !== '' && 
             trade.closeDatetime.trim() !== '' &&
             !isNaN(new Date(trade.closeDatetime).getTime());
    };
    
    // Calcola il totale degli initialBalance per calcolare la percentuale
    const totalInitialBalance = selectedAccountId === 'ALL'
      ? accounts.reduce((sum, acc) => sum + acc.initialBalance, 0)
      : accounts.find(a => a.id === selectedAccountId)?.initialBalance || 0;
    
    // Filtra i trade per account se selezionato
    // Considera chiusi i trade con closeDatetime valido OPPURE status CLOSED
    const filteredTrades = selectedAccountId === 'ALL' 
      ? trades.filter(t => hasValidCloseDate(t) || t.status === 'CLOSED')
      : trades.filter(t => t.accountId === selectedAccountId && (hasValidCloseDate(t) || t.status === 'CLOSED'));
    
    console.log('Calendar Debug:', {
      totalTrades: trades.length,
      filteredTrades: filteredTrades.length,
      selectedAccountId,
      tradesWithCloseDate: trades.filter(t => hasValidCloseDate(t)).length,
      tradesWithStatusClosed: trades.filter(t => t.status === 'CLOSED').length,
      sampleTrade: filteredTrades[0] ? {
        id: filteredTrades[0].id,
        status: filteredTrades[0].status,
        closeDatetime: filteredTrades[0].closeDatetime,
        hasValidCloseDate: hasValidCloseDate(filteredTrades[0]),
        accountId: filteredTrades[0].accountId,
        totalPnl: filteredTrades[0].totalPnl,
        commission: filteredTrades[0].commission,
        swap: filteredTrades[0].swap
      } : null,
      allTradesSample: trades.slice(0, 5).map(t => ({
        id: t.id,
        status: t.status,
        closeDatetime: t.closeDatetime,
        hasValidCloseDate: hasValidCloseDate(t)
      }))
    });
    
    filteredTrades.forEach(trade => {
      // Se ha closeDatetime valido, usa quello
      // Altrimenti se è CLOSED, usa openDatetime come fallback
      let dateToUse: string | null = null;
      
      if (hasValidCloseDate(trade)) {
        dateToUse = trade.closeDatetime!;
      } else if (trade.status === 'CLOSED' && trade.openDatetime) {
        // Fallback: usa openDatetime se il trade è chiuso ma non ha closeDatetime
        dateToUse = trade.openDatetime;
      }
      
      if (dateToUse) {
        const totalWithFees = (trade.totalPnl || 0) + (trade.commission || 0) + (trade.swap || 0);
        const dateKey = format(new Date(dateToUse), 'yyyy-MM-dd');
        
        if (!pnlByDay[dateKey]) {
          pnlByDay[dateKey] = { 
            total: 0, 
            byAccount: {}, 
            trades: 0,
            tradeList: []
          };
        }
        
        pnlByDay[dateKey].total += totalWithFees;
        pnlByDay[dateKey].byAccount[trade.accountId] = 
          (pnlByDay[dateKey].byAccount[trade.accountId] || 0) + totalWithFees;
        pnlByDay[dateKey].trades += 1;
        
        // Aggiungi il trade alla lista per il tooltip
        pnlByDay[dateKey].tradeList.push({
          id: trade.id,
          pair: trade.pair,
          pnl: totalWithFees,
          accountId: trade.accountId
        });
      }
    });
    
    console.log('Calendar P&L by Day:', {
      daysWithData: Object.keys(pnlByDay).length,
      sampleDay: Object.entries(pnlByDay)[0] ? {
        date: Object.entries(pnlByDay)[0][0],
        data: Object.entries(pnlByDay)[0][1]
      } : null
    });
    
    return { pnlByDay, totalInitialBalance };
  }, [trades, selectedAccountId, accounts]);
  
  // Estrai pnlByDay e totalInitialBalance
  const dailyPnL = dailyPnLData.pnlByDay;
  const totalInitialBalance = dailyPnLData.totalInitialBalance;
  
  // Genera giorni del mese
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  // Scala graduale di colori basata sul P&L - colori più pieni e contrasto migliore
  const getColorForDay = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayData = dailyPnL[dateKey];
    
    if (!dayData) return 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500';
    
    const pnl = dayData.total;
    
    if (pnl > 0) {
      // Scala verde per profitti - colori più pieni
      if (pnl >= 2000) return 'bg-green-700 dark:bg-green-800 text-white font-bold shadow-lg shadow-green-500/30';
      if (pnl >= 1000) return 'bg-green-600 dark:bg-green-700 text-white font-bold shadow-md shadow-green-500/20';
      if (pnl >= 500) return 'bg-green-500 dark:bg-green-600 text-white font-bold';
      if (pnl >= 200) return 'bg-green-400 dark:bg-green-500 text-white font-bold';
      if (pnl >= 50) return 'bg-green-300 dark:bg-green-400 text-gray-900 dark:text-gray-900 font-bold';
      return 'bg-green-200 dark:bg-green-300 text-gray-800 dark:text-gray-800 font-semibold';
    } else if (pnl < 0) {
      // Scala rossa per perdite - colori più pieni
      const absLoss = Math.abs(pnl);
      if (absLoss >= 2000) return 'bg-red-700 dark:bg-red-800 text-white font-bold shadow-lg shadow-red-500/30';
      if (absLoss >= 1000) return 'bg-red-600 dark:bg-red-700 text-white font-bold shadow-md shadow-red-500/20';
      if (absLoss >= 500) return 'bg-red-500 dark:bg-red-600 text-white font-bold';
      if (absLoss >= 200) return 'bg-red-400 dark:bg-red-500 text-white font-bold';
      if (absLoss >= 50) return 'bg-red-300 dark:bg-red-400 text-gray-900 dark:text-gray-900 font-bold';
      return 'bg-red-200 dark:bg-red-300 text-gray-800 dark:text-gray-800 font-semibold';
    }
    
    return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
  };
  
  const getAccountName = (accountId: string) => {
    return accounts.find(a => a.id === accountId)?.name || 'Unknown';
  };
  
  // Calcola statistiche mensili
  const monthlyStats = useMemo(() => {
    const daysInMonth = Object.entries(dailyPnL).filter(([dateKey]) => {
      const date = new Date(dateKey);
      return isSameMonth(date, currentDate);
    });
    
    const totalPnL = daysInMonth.reduce((sum, [_, data]) => sum + data.total, 0);
    const totalTrades = daysInMonth.reduce((sum, [_, data]) => sum + data.trades, 0);
    const profitableDays = daysInMonth.filter(([_, data]) => data.total > 0).length;
    const losingDays = daysInMonth.filter(([_, data]) => data.total < 0).length;
    const winRate = daysInMonth.length > 0 ? (profitableDays / daysInMonth.length) * 100 : 0;
    
    return { totalPnL, totalTrades, profitableDays, losingDays, winRate, activeDays: daysInMonth.length };
  }, [dailyPnL, currentDate]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }
  
  const selectedAccount = selectedAccountId === 'ALL' 
    ? null 
    : accounts.find(a => a.id === selectedAccountId);
  
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold text-primary dark:text-white flex items-center gap-3">
              <CalendarIcon size={32} className="text-accent" />
              Trading Calendar
            </h1>
            <p className="text-secondary dark:text-gray-400 mt-1">Track your daily performance at a glance</p>
          </div>
        </div>
        
        {/* Selettore Account in alto a destra */}
        <div ref={accountSelectRef} className="relative w-full md:w-64 z-10">
          <button
            type="button"
            onClick={() => setIsAccountSelectOpen(!isAccountSelectOpen)}
            className="
              flex items-center justify-between gap-3 px-4 py-2.5
              bg-white dark:bg-gray-800 
              border-2 border-gray-200 dark:border-gray-700
              rounded-2xl shadow-lg hover:shadow-xl
              transition-all duration-200
              w-full
              group
              hover:border-accent/50
            "
          >
            <div className="flex flex-col items-start overflow-hidden flex-1 min-w-0">
              <span className="font-medium text-primary dark:text-white truncate w-full text-sm">
                {selectedAccountId === 'ALL' ? 'All Accounts' : selectedAccount?.name || 'Select Account'}
              </span>
              {selectedAccount && (
                <span className="text-xs text-secondary dark:text-gray-400 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-accent-soft dark:bg-accent/20 text-accent dark:text-accent rounded-full font-medium">
                    {selectedAccount.type}
                  </span>
                  {selectedAccount.broker}
                </span>
              )}
            </div>
            <ChevronDown 
              size={20} 
              className={`
                transition-transform duration-200 flex-shrink-0
                text-secondary dark:text-gray-400 group-hover:text-accent
                ${isAccountSelectOpen && 'rotate-180'}
              `} 
            />
          </button>
          
          {isAccountSelectOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsAccountSelectOpen(false)}
              />
              
              {/* Dropdown */}
              <div className="
                absolute top-full right-0 mt-2 
                bg-white dark:bg-gray-800 
                border border-gray-200 dark:border-gray-700
                rounded-2xl shadow-xl
                overflow-hidden z-50
                max-h-[400px] overflow-y-auto
                w-full
              ">
                {/* All Accounts Option */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAccountId('ALL');
                    setIsAccountSelectOpen(false);
                  }}
                  className={`
                    w-full px-4 py-3.5 text-left
                    hover:bg-gray-50 dark:hover:bg-gray-700/50
                    transition-colors
                    border-b border-gray-100 dark:border-gray-700
                    ${selectedAccountId === 'ALL' && 'bg-accent-soft dark:bg-accent/10 border-l-4 border-accent'}
                  `}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-primary dark:text-white mb-1">
                        All Accounts
                      </div>
                      <div className="text-xs text-secondary dark:text-gray-400">
                        Overview completo di tutti gli account
                      </div>
                    </div>
                    {selectedAccountId === 'ALL' && (
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                    )}
                  </div>
                </button>
                
                {/* Individual Accounts */}
                {accounts.map((account, index) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => {
                      setSelectedAccountId(account.id);
                      setIsAccountSelectOpen(false);
                    }}
                    className={`
                      w-full px-4 py-3.5 text-left
                      hover:bg-gray-50 dark:hover:bg-gray-700/50
                      transition-colors
                      ${index !== accounts.length - 1 && 'border-b border-gray-100 dark:border-gray-700'}
                      ${account.id === selectedAccountId && 'bg-accent-soft dark:bg-accent/10 border-l-4 border-accent'}
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-primary dark:text-white mb-1 truncate">
                          {account.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-secondary dark:text-gray-300 rounded-lg font-medium">
                            {account.type}
                          </span>
                          {account.phase && (
                            <span className="px-2 py-1 bg-accent-soft dark:bg-accent/20 text-accent dark:text-accent rounded-lg font-medium">
                              {account.phase.replace('_', ' ')}
                            </span>
                          )}
                          <span className="text-secondary dark:text-gray-400">
                            {account.broker}
                          </span>
                        </div>
                      </div>
                      {account.id === selectedAccountId && (
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Info message se non ci sono trade */}
      {Object.keys(dailyPnL).length === 0 && !loading && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <CalendarIcon size={24} className="text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                Nessun trade chiuso trovato
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                I giorni del calendario mostreranno colori verde/rosso quando aggiungerai trade chiusi con data di chiusura.
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Monthly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="col-span-2 md:col-span-1">
          <div className="space-y-1">
            <p className="text-xs text-secondary dark:text-gray-400 uppercase tracking-wider">Total P&L</p>
            <p className={`text-2xl font-bold ${monthlyStats.totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
              {monthlyStats.totalPnL >= 0 ? '+' : ''}{monthlyStats.totalPnL.toFixed(0)}
            </p>
          </div>
        </Card>
        
        <Card>
          <div className="space-y-1">
            <p className="text-xs text-secondary dark:text-gray-400 uppercase tracking-wider">Trades</p>
            <p className="text-2xl font-bold text-primary dark:text-white">{monthlyStats.totalTrades}</p>
          </div>
        </Card>
        
        <Card>
          <div className="space-y-1">
            <p className="text-xs text-secondary dark:text-gray-400 uppercase tracking-wider">Active Days</p>
            <p className="text-2xl font-bold text-primary dark:text-white">{monthlyStats.activeDays}</p>
          </div>
        </Card>
        
        <Card>
          <div className="space-y-1">
            <p className="text-xs text-secondary dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp size={12} className="text-success" />
              Win Days
            </p>
            <p className="text-2xl font-bold text-success">{monthlyStats.profitableDays}</p>
          </div>
        </Card>
        
        <Card>
          <div className="space-y-1">
            <p className="text-xs text-secondary dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingDown size={12} className="text-danger" />
              Loss Days
            </p>
            <p className="text-2xl font-bold text-danger">{monthlyStats.losingDays}</p>
          </div>
        </Card>
        
        <Card>
          <div className="space-y-1">
            <p className="text-xs text-secondary dark:text-gray-400 uppercase tracking-wider">Day Win Rate</p>
            <p className="text-2xl font-bold text-accent">{monthlyStats.winRate.toFixed(0)}%</p>
          </div>
        </Card>
      </div>
      
      <Card className="p-6">
        {/* Header con navigazione mese */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-primary dark:text-white"
            aria-label="Previous month"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary dark:text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-sm text-accent hover:underline mt-1"
            >
              Today
            </button>
          </div>
          
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-primary dark:text-white"
            aria-label="Next month"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        
        {/* Giorni della settimana */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-bold text-secondary dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Griglia giorni */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayData = dailyPnL[dateKey];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const pnl = dayData?.total || 0;
            
            return (
              <div
                key={dateKey}
                className={`
                  relative group min-h-[100px] rounded-xl transition-all
                  ${getColorForDay(day)}
                  ${!isCurrentMonth && 'opacity-30'}
                  ${isTodayDate && 'ring-2 ring-accent ring-offset-2 dark:ring-offset-gray-900'}
                  ${dayData && 'hover:scale-105 hover:z-10 cursor-pointer'}
                  hover:shadow-xl
                  flex flex-col justify-between p-3
                `}
              >
                {/* Numero del giorno */}
                <div className="text-sm font-bold mb-2 opacity-90">
                  {format(day, 'd')}
                </div>
                
                {/* P&L prominente al centro */}
                {dayData && (
                  <div className="flex-1 flex flex-col justify-center items-center">
                    {/* Percentuale sopra il P&L */}
                    {totalInitialBalance > 0 && (
                      <div className="text-xs font-semibold mb-1 opacity-90">
                        {((pnl / totalInitialBalance) * 100).toFixed(2)}%
                      </div>
                    )}
                    <div className="text-lg font-bold mb-1">
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(0)}
                    </div>
                    <div className="text-xs opacity-80 font-medium">
                      {dayData.trades} trade{dayData.trades !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
                
                {/* Spazio vuoto se non ci sono dati */}
                {!dayData && (
                  <div className="flex-1"></div>
                )}
                
                {/* Tooltip al hover */}
                {dayData && (
                  <div className="
                    absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
                    opacity-0 group-hover:opacity-100 pointer-events-none
                    transition-all duration-200 scale-95 group-hover:scale-100
                  ">
                    <div className="bg-gray-900 dark:bg-gray-800 text-white p-4 rounded-xl shadow-2xl min-w-[280px] max-w-[320px] border border-gray-700">
                      <div className="font-bold mb-2 border-b border-gray-700 pb-2 text-sm">
                        {format(day, 'EEEE, MMM dd')}
                      </div>
                      <div className="space-y-2">
                        {/* Recap singoli trade */}
                        {dayData.tradeList && dayData.tradeList.length > 0 && (
                          <div className="mb-3 pb-2 border-b border-gray-700">
                            <div className="text-xs font-semibold text-gray-400 mb-2">Trade Details</div>
                            <div className="space-y-1 max-h-[120px] overflow-y-auto">
                              {dayData.tradeList.map((trade) => {
                                const accountName = getAccountName(trade.accountId);
                                return (
                                  <div key={trade.id} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-300 truncate flex-1 mr-2">
                                      {trade.pair} {selectedAccountId === 'ALL' ? `(${accountName})` : ''}
                                    </span>
                                    <span className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* P&L per account */}
                        {Object.entries(dayData.byAccount).map(([accountId, pnl]) => (
                          <div key={accountId} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300 truncate flex-1 mr-2">
                              {getAccountName(accountId)}
                            </span>
                            <span className={`font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                            </span>
                          </div>
                        ))}
                        
                        {/* Total */}
                        <div className="flex justify-between font-bold text-sm border-t border-gray-700 pt-2 mt-2">
                          <span>Total</span>
                          <span className={dayData.total >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {dayData.total >= 0 ? '+' : ''}{dayData.total.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 text-center pt-1">
                          {dayData.trades} trade{dayData.trades !== 1 && 's'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Legenda */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-secondary dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Profit Scale:</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-green-700"></div>
              <span>&gt;2000</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-green-500"></div>
              <span>500-1000</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-green-300"></div>
              <span>50-200</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700"></div>
              <span>0</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-red-300"></div>
              <span>-50 to -200</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-red-500"></div>
              <span>-500 to -1000</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-red-700"></div>
              <span>&lt;-2000</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

