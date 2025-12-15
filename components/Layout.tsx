import React, { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, Settings, Calendar as CalendarIcon, LogOut } from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-6 py-3 my-1 mx-2 rounded-2xl transition-all duration-200 group ${
        isActive
          ? 'bg-primary text-white shadow-lg shadow-primary/20'
          : 'text-secondary hover:bg-white hover:text-primary hover:shadow-soft'
      }`
    }
  >
    <Icon size={20} strokeWidth={2} />
    <span className="font-medium">{label}</span>
  </NavLink>
);

export const Layout: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-background text-primary font-sans">
      {/* Sidebar */}
      <aside className="w-72 fixed h-full hidden lg:flex flex-col border-r border-gray-100 bg-background/50 backdrop-blur-sm z-50">
        <div className="p-8">
          <h1 className="text-3xl font-bold tracking-tight">Traidal<span className="text-accent">.</span></h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="mb-8">
            <p className="px-8 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</p>
            <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <SidebarItem to="/journal" icon={BookOpen} label="Journal" />
            <SidebarItem to="/accounts" icon={Users} label="Accounts" />
            <SidebarItem to="/calendar" icon={CalendarIcon} label="Calendar" />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
           <SidebarItem to="/settings" icon={Settings} label="Settings" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-4 lg:p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};