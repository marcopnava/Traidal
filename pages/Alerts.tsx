import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlerts } from '../contexts/AlertsContext';
import { Card } from '../components/ui/Card';
import { BackButton } from '../components/ui/BackButton';
import { EmptyState } from '../components/ui/EmptyState';
import { AlertType, AlertSeverity } from '../types';
import { 
  Bell, 
  AlertTriangle, 
  AlertOctagon, 
  XOctagon, 
  Info, 
  CheckCircle2, 
  X,
  Check,
  TrendingDown,
  Target,
  Trophy,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { Account } from '../types';
import { useNavigate } from 'react-router-dom';
import { handleNumberInputFocus } from '../utils/inputHelpers';

export const Alerts = () => {
  const { alerts, unreadCount, markAsRead, markAllAsRead, dismissAlert, settings: alertSettings, updateSettings } = useAlerts();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'alerts' | 'settings'>('alerts');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccounts = async () => {
      setLoading(true);
      try {
        const loadedAccounts = await SupabaseService.getAccounts();
        setAccounts(loadedAccounts);
      } catch (error) {
        console.error('Error loading accounts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAccounts();
  }, []);

  const getSeverityConfig = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.INFO:
        return {
          icon: Info,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconColor: 'text-blue-500 dark:text-blue-400',
          textColor: 'text-blue-900 dark:text-blue-100',
        };
      case AlertSeverity.SUCCESS:
        return {
          icon: CheckCircle2,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          iconColor: 'text-green-500 dark:text-green-400',
          textColor: 'text-green-900 dark:text-green-100',
        };
      case AlertSeverity.WARNING:
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          iconColor: 'text-yellow-500 dark:text-yellow-400',
          textColor: 'text-yellow-900 dark:text-yellow-100',
        };
      case AlertSeverity.DANGER:
        return {
          icon: AlertOctagon,
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          iconColor: 'text-orange-500 dark:text-orange-400',
          textColor: 'text-orange-900 dark:text-orange-100',
        };
      case AlertSeverity.CRITICAL:
        return {
          icon: XOctagon,
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          iconColor: 'text-red-500 dark:text-red-400',
          textColor: 'text-red-900 dark:text-red-100',
        };
      default:
        return {
          icon: Bell,
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          iconColor: 'text-gray-500 dark:text-gray-400',
          textColor: 'text-gray-900 dark:text-gray-100',
        };
    }
  };

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case AlertType.MAX_DD:
      case AlertType.DAILY_DD:
        return TrendingDown;
      case AlertType.PROFIT_TARGET:
        return Target;
      case AlertType.PHASE_PASSED:
        return Trophy;
      default:
        return Bell;
    }
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Unknown Account';
  };

  const handleViewAccount = (accountId: string) => {
    navigate(`/accounts-overview`);
  };

  // Sort alerts: unread first, then by date
  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Alerts
          </h1>
          {unreadCount > 0 && activeTab === 'alerts' && (
            <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <p className="text-secondary dark:text-gray-400">
          Stay informed about your trading performance and risk levels
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-6 py-3 font-semibold text-sm transition-all relative ${
              activeTab === 'alerts'
                ? 'text-accent dark:text-accent'
                : 'text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell size={18} />
              <span>Alerts</span>
              {alerts.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'alerts'
                    ? 'bg-accent/20 text-accent'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {alerts.length}
                </span>
              )}
            </div>
            {activeTab === 'alerts' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-semibold text-sm transition-all relative ${
              activeTab === 'settings'
                ? 'text-accent dark:text-accent'
                : 'text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings size={18} />
              <span>Settings</span>
            </div>
            {activeTab === 'settings' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'alerts' && (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              {alerts.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-all shadow-soft hover:shadow-md"
                >
                  <Check size={18} />
                  Mark All Read
                </button>
              )}
            </div>

            {/* Alerts List */}
            {sortedAlerts.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No Alerts"
                description="You don't have any alerts at the moment. Keep trading safely!"
              />
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {sortedAlerts.map((alert, index) => {
                    const severityConfig = getSeverityConfig(alert.severity);
                    const TypeIcon = getTypeIcon(alert.type);
                    const SeverityIcon = severityConfig.icon;
                    
                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className={`relative ${severityConfig.bgColor} ${severityConfig.borderColor} border-2 ${
                            !alert.isRead ? 'ring-2 ring-accent/30' : ''
                          }`}
                        >
                          {/* Unread Indicator */}
                          {!alert.isRead && (
                            <div className="absolute top-4 left-4 w-3 h-3 bg-accent rounded-full animate-pulse" />
                          )}

                          <div className="flex items-start gap-4 pl-4">
                            {/* Icon */}
                            <div className={`p-3 rounded-xl ${severityConfig.bgColor} ${severityConfig.borderColor} border`}>
                              <SeverityIcon size={24} className={severityConfig.iconColor} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <TypeIcon size={16} className={severityConfig.iconColor} />
                                    <span className={`text-sm font-semibold uppercase tracking-wider ${severityConfig.textColor}`}>
                                      {alert.type.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <h3 className={`text-lg font-bold ${severityConfig.textColor}`}>
                                    {getAccountName(alert.accountId)}
                                  </h3>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  {!alert.isRead && (
                                    <button
                                      onClick={() => markAsRead(alert.id)}
                                      className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                                      aria-label="Mark as read"
                                      title="Mark as read"
                                    >
                                      <Check size={18} className={severityConfig.iconColor} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => dismissAlert(alert.id)}
                                    className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                                    aria-label="Dismiss"
                                    title="Dismiss"
                                  >
                                    <X size={18} className={severityConfig.iconColor} />
                                  </button>
                                </div>
                              </div>

                              {/* Message */}
                              <p className={`text-base ${severityConfig.textColor} mb-4`}>
                                {alert.message}
                              </p>

                              {/* Metrics */}
                              <div className="flex flex-wrap items-center gap-6 mb-4">
                                <div>
                                  <p className="text-xs text-secondary dark:text-gray-500 mb-1">Current</p>
                                  <p className={`text-sm font-bold ${severityConfig.textColor}`}>
                                    {alert.currentValue.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-secondary dark:text-gray-500 mb-1">Limit</p>
                                  <p className={`text-sm font-bold ${severityConfig.textColor}`}>
                                    {alert.limitValue.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-secondary dark:text-gray-500 mb-1">Percentage</p>
                                  <p className={`text-sm font-bold ${severityConfig.textColor}`}>
                                    {alert.percentage.toFixed(1)}%
                                  </p>
                                </div>
                                <div className="ml-auto">
                                  <p className="text-xs text-secondary dark:text-gray-500">
                                    {new Date(alert.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {/* View Account Button */}
                              <button
                                onClick={() => handleViewAccount(alert.accountId)}
                                className={`text-sm font-medium ${severityConfig.iconColor} hover:underline`}
                              >
                                View Account →
                              </button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                  <Bell size={24} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary dark:text-white">Alert Settings</h2>
                  <p className="text-sm text-secondary dark:text-gray-400">Configure when you receive trading alerts</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Max Drawdown Thresholds */}
                <div>
                  <h3 className="font-semibold text-primary dark:text-white mb-3 flex items-center gap-2">
                    📉 Max Drawdown Alerts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                        Warning at (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={alertSettings.maxDrawdownWarning}
                        onChange={e => updateSettings({ ...alertSettings, maxDrawdownWarning: Number(e.target.value) })}
                        onFocus={handleNumberInputFocus}
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                      />
                      <p className="text-xs text-secondary dark:text-gray-400 mt-1">
                        🟡 Yellow alert threshold
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                        Danger at (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={alertSettings.maxDrawdownDanger}
                        onChange={e => updateSettings({ ...alertSettings, maxDrawdownDanger: Number(e.target.value) })}
                        onFocus={handleNumberInputFocus}
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                      />
                      <p className="text-xs text-secondary dark:text-gray-400 mt-1">
                        🟠 Orange alert threshold
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                        Critical at (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={alertSettings.maxDrawdownCritical}
                        onChange={e => updateSettings({ ...alertSettings, maxDrawdownCritical: Number(e.target.value) })}
                        onFocus={handleNumberInputFocus}
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                      />
                      <p className="text-xs text-secondary dark:text-gray-400 mt-1">
                        🔴 Red alert threshold
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Daily Drawdown Thresholds */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-primary dark:text-white mb-3 flex items-center gap-2">
                    📊 Daily Drawdown Alerts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                        Warning at (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={alertSettings.dailyDrawdownWarning}
                        onChange={e => updateSettings({ ...alertSettings, dailyDrawdownWarning: Number(e.target.value) })}
                        onFocus={handleNumberInputFocus}
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                      />
                      <p className="text-xs text-secondary dark:text-gray-400 mt-1">
                        🟡 Yellow alert threshold
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                        Danger at (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={alertSettings.dailyDrawdownDanger}
                        onChange={e => updateSettings({ ...alertSettings, dailyDrawdownDanger: Number(e.target.value) })}
                        onFocus={handleNumberInputFocus}
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                      />
                      <p className="text-xs text-secondary dark:text-gray-400 mt-1">
                        🟠 Orange alert threshold
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                        Critical at (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={alertSettings.dailyDrawdownCritical}
                        onChange={e => updateSettings({ ...alertSettings, dailyDrawdownCritical: Number(e.target.value) })}
                        onFocus={handleNumberInputFocus}
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                      />
                      <p className="text-xs text-secondary dark:text-gray-400 mt-1">
                        🔴 Red alert threshold
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Profit Target Alert */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-primary dark:text-white mb-3 flex items-center gap-2">
                    🎯 Profit Target Alerts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                        Notify at (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={alertSettings.profitTargetInfo}
                        onChange={e => updateSettings({ ...alertSettings, profitTargetInfo: Number(e.target.value) })}
                        onFocus={handleNumberInputFocus}
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
                      />
                      <p className="text-xs text-secondary dark:text-gray-400 mt-1">
                        🔵 Info alert when close to target
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Notification Preferences */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-primary dark:text-white mb-3 flex items-center gap-2">
                    🔔 Notification Preferences
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={alertSettings.enableNotifications}
                          onChange={e => updateSettings({ ...alertSettings, enableNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg peer-checked:bg-accent peer-checked:border-accent peer-focus:ring-2 peer-focus:ring-accent/50 transition-all duration-200 flex items-center justify-center">
                          {alertSettings.enableNotifications && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-primary dark:text-white">Enable Notifications</div>
                        <div className="text-sm text-secondary dark:text-gray-400">Show toast notifications when alerts trigger</div>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={alertSettings.enableSounds}
                          onChange={e => updateSettings({ ...alertSettings, enableSounds: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg peer-checked:bg-accent peer-checked:border-accent peer-focus:ring-2 peer-focus:ring-accent/50 transition-all duration-200 flex items-center justify-center">
                          {alertSettings.enableSounds && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-primary dark:text-white flex items-center gap-2">
                          {alertSettings.enableSounds ? <Volume2 size={18} /> : <VolumeX size={18} />}
                          Enable Sound Alerts
                        </div>
                        <div className="text-sm text-secondary dark:text-gray-400">Play sound for critical alerts</div>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="p-4 bg-accent-soft dark:bg-accent/10 border border-accent/30 rounded-xl">
                  <p className="text-sm text-primary dark:text-gray-200">
                    💡 <strong>Tip:</strong> Alerts are checked automatically every 60 seconds. Adjust these thresholds based on your risk management strategy.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

