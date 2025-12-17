import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { BackButton } from '../components/ui/BackButton';
import { User, Download, Save, Trash2, Settings as SettingsIcon, Globe, DollarSign, Bell, Volume2, VolumeX } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertsContext';
import { showSuccess, showError } from '../components/ui/Toast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { handleNumberInputFocus, formatNumberInputValue } from '../utils/inputHelpers';
import { CustomSelect, SelectOption } from '../components/ui/CustomSelect';

interface UserProfile {
  fullName: string;
  email: string;
  avatar?: string;
  timezone?: string;
  currency?: string;
}

const timezoneOptions: SelectOption[] = [
  { value: 'UTC', label: 'UTC', description: 'Coordinated Universal Time', icon: <Globe size={18} className="text-accent" /> },
  { value: 'America/New_York', label: 'New York', description: 'EST/EDT', icon: <Globe size={18} className="text-blue-500" /> },
  { value: 'America/Chicago', label: 'Chicago', description: 'CST/CDT', icon: <Globe size={18} className="text-blue-500" /> },
  { value: 'America/Los_Angeles', label: 'Los Angeles', description: 'PST/PDT', icon: <Globe size={18} className="text-blue-500" /> },
  { value: 'Europe/London', label: 'London', description: 'GMT/BST', icon: <Globe size={18} className="text-green-500" /> },
  { value: 'Europe/Paris', label: 'Paris', description: 'CET/CEST', icon: <Globe size={18} className="text-green-500" /> },
  { value: 'Asia/Tokyo', label: 'Tokyo', description: 'JST', icon: <Globe size={18} className="text-red-500" /> },
  { value: 'Asia/Shanghai', label: 'Shanghai', description: 'CST', icon: <Globe size={18} className="text-red-500" /> },
  { value: 'Australia/Sydney', label: 'Sydney', description: 'AEST/AEDT', icon: <Globe size={18} className="text-purple-500" /> }
];

const currencyOptions: SelectOption[] = [
  { value: 'USD', label: 'USD', description: 'US Dollar ($)', icon: <DollarSign size={18} className="text-green-500" /> },
  { value: 'EUR', label: 'EUR', description: 'Euro (€)', icon: <DollarSign size={18} className="text-blue-500" /> },
  { value: 'GBP', label: 'GBP', description: 'British Pound (£)', icon: <DollarSign size={18} className="text-purple-500" /> },
  { value: 'JPY', label: 'JPY', description: 'Japanese Yen (¥)', icon: <DollarSign size={18} className="text-red-500" /> },
  { value: 'AUD', label: 'AUD', description: 'Australian Dollar (A$)', icon: <DollarSign size={18} className="text-orange-500" /> },
  { value: 'CAD', label: 'CAD', description: 'Canadian Dollar (C$)', icon: <DollarSign size={18} className="text-red-400" /> }
];

export const Settings = () => {
  const { user } = useAuth();
  const { settings: alertSettings, updateSettings } = useAlerts();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    email: user?.email || '',
    timezone: 'UTC',
    currency: 'USD'
  });
  
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    // Load profile from localStorage
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    } else if (user?.email) {
      setProfile(prev => ({ ...prev, email: user.email }));
    }
    setLoading(false);
  }, [user]);
  
  const handleSaveProfile = () => {
    try {
      localStorage.setItem('userProfile', JSON.stringify(profile));
      showSuccess('Profile updated successfully!');
    } catch (error) {
      showError('Failed to save profile');
    }
  };
  
  const handleExportData = async () => {
    try {
      const accounts = await SupabaseService.getAccounts();
      const trades = await SupabaseService.getTrades();
      
      const exportData = {
        profile,
        accounts,
        trades,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `traidal-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSuccess('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      showError('Failed to export data');
    }
  };
  
  const handleExportCSV = async () => {
    try {
      const trades = await SupabaseService.getTrades();
      const accounts = await SupabaseService.getAccounts();
      
      // Create CSV header
      const csvHeaders = [
        'Trade ID',
        'Account',
        'Pair',
        'Direction',
        'Open Date',
        'Close Date',
        'Entry Price',
        'Exit Price',
        'Lots',
        'Stop Loss',
        'Take Profit',
        'P&L',
        'Risk/Reward',
        'Status',
        'Notes'
      ].join(',');
      
      // Create CSV rows
      const csvRows = trades.map(trade => {
        const account = accounts.find(a => a.id === trade.accountId);
        return [
          trade.id,
          account?.name || 'Unknown',
          trade.pair,
          trade.direction,
          trade.openDatetime,
          trade.closeDatetime || '',
          trade.entryPrice,
          trade.exitPrice || '',
          trade.totalLots,
          trade.stopLoss,
          trade.takeProfit,
          trade.totalPnl,
          trade.riskReward,
          trade.status,
          (trade.notes || '').replace(/,/g, ';') // Escape commas in notes
        ].join(',');
      });
      
      const csv = [csvHeaders, ...csvRows].join('\n');
      const csvBlob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(csvBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `traidal-trades-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSuccess('Trades exported to CSV successfully!');
    } catch (error) {
      showError('Failed to export CSV');
    }
  };
  
  const handleClearAllData = () => {
    try {
      localStorage.removeItem('accounts');
      localStorage.removeItem('trades');
      showSuccess('All trading data cleared successfully!');
      setShowClearDataConfirm(false);
      // Reload page to reset state
      window.location.reload();
    } catch (error) {
      showError('Failed to clear data');
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-white flex items-center gap-3">
            <SettingsIcon size={32} className="text-accent" />
            Settings
          </h1>
          <p className="text-secondary dark:text-gray-400 mt-1">Manage your profile and preferences</p>
        </div>
      </div>
      
      {/* Profile Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-accent-soft dark:bg-accent/20 rounded-xl">
            <User size={24} className="text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary dark:text-white">Profile</h2>
            <p className="text-sm text-secondary dark:text-gray-400">Update your personal information</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                placeholder="Your full name"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-secondary dark:text-gray-400 mt-1">
                Email is managed by authentication system
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomSelect
              label="Timezone"
              options={timezoneOptions}
              value={profile.timezone || 'UTC'}
              onChange={value => setProfile({ ...profile, timezone: value })}
            />
            
            <CustomSelect
              label="Preferred Currency"
              options={currencyOptions}
              value={profile.currency || 'USD'}
              onChange={value => setProfile({ ...profile, currency: value })}
            />
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveProfile}
              className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors"
            >
              <Save size={18} />
              Save Profile
            </button>
          </div>
        </div>
      </Card>
      
      {/* Data Export */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <Download size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary dark:text-white">Export Data</h2>
            <p className="text-sm text-secondary dark:text-gray-400">Download your trading data</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExportData}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-accent dark:hover:border-accent rounded-xl font-medium text-primary dark:text-white transition-colors group"
            >
              <Download size={20} className="group-hover:text-accent" />
              <div className="text-left">
                <div className="font-semibold">Export Complete Backup</div>
                <div className="text-xs text-secondary dark:text-gray-400">JSON format with all data</div>
              </div>
            </button>
            
            <button
              onClick={handleExportCSV}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-accent dark:hover:border-accent rounded-xl font-medium text-primary dark:text-white transition-colors group"
            >
              <Download size={20} className="group-hover:text-accent" />
              <div className="text-left">
                <div className="font-semibold">Export Trades CSV</div>
                <div className="text-xs text-secondary dark:text-gray-400">Spreadsheet format for analysis</div>
              </div>
            </button>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> Regular backups are recommended. Export your data weekly to keep a safe copy of your trading history.
            </p>
          </div>
        </div>
      </Card>
      
      {/* Alert Settings */}
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
              💡 <strong>Tip:</strong> Alerts are checked automatically every 30 seconds. Adjust these thresholds based on your risk management strategy.
            </p>
          </div>
        </div>
      </Card>
      
      {/* Danger Zone */}
      <Card className="border-2 border-red-200 dark:border-red-900/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <Trash2 size={24} className="text-danger" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-danger">Danger Zone</h2>
            <p className="text-sm text-secondary dark:text-gray-400">Irreversible actions</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-primary dark:text-white mb-1">Clear All Trading Data</h3>
                <p className="text-sm text-secondary dark:text-gray-400">
                  This will permanently delete all your accounts, trades, and related data. This action cannot be undone. Make sure to export your data first.
                </p>
              </div>
              <button
                onClick={() => setShowClearDataConfirm(true)}
                className="flex-shrink-0 px-6 py-3 bg-danger hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Clear Data Confirmation */}
      <ConfirmDialog
        isOpen={showClearDataConfirm}
        onClose={() => setShowClearDataConfirm(false)}
        onConfirm={handleClearAllData}
        title="Clear All Data?"
        message="This will permanently delete ALL your trading accounts, trades, and statistics. This action cannot be undone. Are you absolutely sure?"
        confirmText="Yes, Clear Everything"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

