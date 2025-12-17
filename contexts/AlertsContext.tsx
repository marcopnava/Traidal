import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { TradingAlert, AlertSettings, Account, Trade } from '../types';
import { detectAccountAlerts, getDefaultAlertSettings } from '../utils/calculations';
import { SupabaseService } from '../services/supabaseService';

interface AlertsContextType {
  alerts: TradingAlert[];
  unreadCount: number;
  settings: AlertSettings;
  refreshAlerts: () => void;
  markAsRead: (alertId: string) => void;
  markAllAsRead: () => void;
  dismissAlert: (alertId: string) => void;
  updateSettings: (newSettings: AlertSettings) => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

const ALERTS_STORAGE_KEY = 'traidal_alerts';
const ALERT_SETTINGS_KEY = 'traidal_alert_settings';

export const AlertsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<TradingAlert[]>([]);
  const [settings, setSettings] = useState<AlertSettings>(getDefaultAlertSettings());

  // Load settings and alerts from Supabase on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load alert settings
        const loadedSettings = await SupabaseService.getAlertSettings();
        setSettings(loadedSettings);

        // Load existing alerts
        const loadedAlerts = await SupabaseService.getAlerts();
        setAlerts(loadedAlerts);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        // Fallback to defaults
        setSettings(getDefaultAlertSettings());
      }
    };
    loadInitialData();
  }, []);

  // Refresh alerts based on current accounts and trades (optimized with useCallback)
  const refreshAlerts = useCallback(async () => {
    try {
      const accounts: Account[] = await SupabaseService.getAccounts();
      const trades: Trade[] = await SupabaseService.getTrades();

      // Early return if no accounts or trades
      if (accounts.length === 0 && trades.length === 0) {
        setAlerts(prevAlerts => {
          if (prevAlerts.length === 0) return prevAlerts;
          return [];
        });
        return;
      }

      const newAlerts: TradingAlert[] = [];

      accounts.forEach(account => {
        const accountTrades = trades.filter(t => t.accountId === account.id);
        const accountAlerts = detectAccountAlerts(account, accountTrades, settings);
        newAlerts.push(...accountAlerts);
      });

      // Get existing alerts from Supabase to preserve read status
      const existingAlerts = await SupabaseService.getAlerts();
      const existingAlertsMap = new Map(existingAlerts.map(a => [a.id, a]));

      // Merge with existing alerts (keep read status)
      const mergedAlerts = newAlerts.map(newAlert => {
        const existing = existingAlertsMap.get(newAlert.id);
        return existing ? { ...newAlert, isRead: existing.isRead } : newAlert;
      });

      // Filter out old alerts (older than 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const filteredAlerts = mergedAlerts.filter(alert => 
        new Date(alert.createdAt) > sevenDaysAgo
      );

      // Save new alerts to Supabase
      for (const alert of filteredAlerts) {
        await SupabaseService.saveAlert(alert);
      }

      // Only update if alerts have actually changed (deep comparison)
      setAlerts(prevAlerts => {
        const prevAlertsStr = JSON.stringify(prevAlerts);
        const filteredAlertsStr = JSON.stringify(filteredAlerts);
        
        if (prevAlertsStr !== filteredAlertsStr) {
          return filteredAlerts;
        }
        
        return prevAlerts; // No update if nothing changed
      });
    } catch (error) {
      console.error('Error refreshing alerts:', error);
    }
  }, [settings]);

  // Mark alert as read (optimized with useCallback)
  const markAsRead = useCallback(async (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      try {
        await SupabaseService.saveAlert({ ...alert, isRead: true });
        setAlerts(prev => {
          return prev.map(a => a.id === alertId ? { ...a, isRead: true } : a);
        });
      } catch (error) {
        console.error('Error marking alert as read:', error);
      }
    }
  }, [alerts]);

  // Mark all alerts as read (optimized with useCallback)
  const markAllAsRead = useCallback(async () => {
    try {
      await Promise.all(alerts.map(alert => 
        SupabaseService.saveAlert({ ...alert, isRead: true })
      ));
      setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
    }
  }, [alerts]);

  // Dismiss/remove alert (optimized with useCallback)
  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      await SupabaseService.deleteAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  }, []);

  // Update settings
  const updateSettings = useCallback(async (newSettings: AlertSettings) => {
    try {
      await SupabaseService.saveAlertSettings(newSettings);
      setSettings(newSettings);
      // Refresh alerts with new settings (debounced)
      setTimeout(() => refreshAlerts(), 100);
    } catch (error) {
      console.error('Error saving alert settings:', error);
    }
  }, [refreshAlerts]);

  // Auto-refresh alerts every 60 seconds (reduced frequency to minimize flickering)
  useEffect(() => {
    refreshAlerts(); // Initial load
    const interval = setInterval(refreshAlerts, 60000); // Increased from 30s to 60s
    return () => clearInterval(interval);
  }, [refreshAlerts]); // Fixed: use refreshAlerts instead of settings

  // Memoize unreadCount to prevent unnecessary recalculations
  const unreadCount = useMemo(() => 
    alerts.filter(a => !a.isRead).length, 
    [alerts]
  );

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        unreadCount,
        settings,
        refreshAlerts,
        markAsRead,
        markAllAsRead,
        dismissAlert,
        updateSettings,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
};

