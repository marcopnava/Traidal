import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowDownToLine, CreditCard, ArrowLeftRight, Send, User, LogOut } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/deposit', label: 'Deposit', icon: ArrowDownToLine },
  { to: '/send', label: 'Send', icon: Send },
  { to: '/cards', label: 'Cards', icon: CreditCard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 border-r border-neutral-200 bg-white hidden md:flex flex-col">
        <div className="p-5 border-b border-neutral-200"><Logo /></div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-800' : 'text-neutral-600 hover:bg-neutral-50'
                }`
              }>
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-neutral-200">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-semibold">
              {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{user?.name || 'Account'}</div>
              <div className="text-xs text-neutral-500 truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={() => { signOut(); navigate('/login'); }}
            className="mt-2 flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-neutral-600 hover:bg-neutral-50">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden border-b border-neutral-200 bg-white px-4 py-3 flex items-center justify-between">
          <Logo size={24} />
          <button onClick={() => { signOut(); navigate('/login'); }} className="text-sm text-neutral-600">Sign out</button>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
