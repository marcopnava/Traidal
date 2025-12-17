import React, { PropsWithChildren, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, Settings, Calendar as CalendarIcon, Moon, Sun, Menu, X, LogOut, List, Bell } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { showSuccess } from '../components/ui/Toast';

const SidebarItem = ({ to, icon: Icon, label, badge }: { to: string, icon: any, label: string, badge?: number }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-6 py-3 my-1 mx-2 rounded-2xl transition-all duration-200 group relative ${
        isActive
          ? 'bg-primary dark:bg-accent text-white shadow-lg shadow-primary/20 dark:shadow-accent/20'
          : 'text-secondary dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-primary dark:hover:text-white hover:shadow-soft'
      }`
    }
  >
    <Icon size={20} strokeWidth={2} />
    <span className="font-medium">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="absolute right-4 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
        {badge}
      </span>
    )}
  </NavLink>
);

export const Layout: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { unreadCount } = useAlerts();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showSuccess('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-background dark:bg-gray-900 text-primary dark:text-white font-sans transition-colors duration-300">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence mode="wait">
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`w-72 fixed h-full flex flex-col border-r border-gray-100 dark:border-gray-800 bg-background dark:bg-gray-900 backdrop-blur-sm z-50 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-8 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Traidal<span className="text-accent">.</span>
            </h1>
            {user && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
            )}
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon size={20} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <Sun size={20} className="text-accent" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="mb-8">
            <p className="px-8 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Menu</p>
            <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <SidebarItem to="/journal" icon={BookOpen} label="Journal" />
            <SidebarItem to="/accounts" icon={Users} label="Accounts" />
            <SidebarItem to="/accounts-overview" icon={List} label="Overview" />
            <SidebarItem to="/calendar" icon={CalendarIcon} label="Calendar" />
            <SidebarItem to="/alerts" icon={Bell} label="Alerts" badge={unreadCount} />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
           <SidebarItem to="/settings" icon={Settings} label="Settings" />
           <button
             onClick={handleLogout}
             className="flex items-center gap-3 px-6 py-3 my-1 mx-2 rounded-2xl transition-all duration-200 group w-full text-left text-secondary dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
           >
             <LogOut size={20} strokeWidth={2} />
             <span className="font-medium">Logout</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-4 lg:p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};