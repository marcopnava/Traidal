import { Link } from 'react-router-dom';
import { ArrowDownToLine, Send, CreditCard, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { formatMoney, formatDate } from '../lib/format';

export default function Dashboard() {
  const { user } = useAuth();
  const { balance, currency, transactions, cards } = useWallet();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Hi {user?.name || user?.email?.split('@')[0]}</h1>
        <p className="text-sm text-neutral-500">Here's an overview of your wallet.</p>
      </div>

      <section className="card p-6 bg-gradient-to-tr from-brand-700 to-brand-500 text-white border-0">
        <div className="text-xs uppercase opacity-80 tracking-wider">Available balance</div>
        <div className="mt-1 text-4xl font-extrabold">{formatMoney(balance, currency)}</div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/deposit" className="btn bg-white text-brand-800 hover:bg-brand-50"><ArrowDownToLine className="w-4 h-4" /> Deposit</Link>
          <Link to="/send" className="btn bg-white/10 text-white hover:bg-white/20"><Send className="w-4 h-4" /> Send</Link>
          <Link to="/cards" className="btn bg-white/10 text-white hover:bg-white/20"><CreditCard className="w-4 h-4" /> Cards ({cards.length})</Link>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-brand-900">Recent activity</h2>
          <Link to="/transactions" className="text-sm text-brand-700 font-semibold">View all</Link>
        </div>
        {transactions.length === 0 ? (
          <div className="card p-8 text-center text-sm text-neutral-500">
            No transactions yet. <Link to="/deposit" className="text-brand-700 font-semibold">Make your first deposit</Link>.
          </div>
        ) : (
          <ul className="card divide-y divide-neutral-100">
            {transactions.slice(0, 6).map(tx => {
              const incoming = tx.type === 'deposit' || tx.type === 'receive';
              return (
                <li key={tx.id} className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full grid place-items-center ${incoming ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-600'}`}>
                    {incoming ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold capitalize">{tx.type}</div>
                    <div className="text-xs text-neutral-500 truncate">{tx.counterparty || '—'} · {formatDate(tx.createdAt)}</div>
                  </div>
                  <div className={`text-sm font-bold ${incoming ? 'text-emerald-600' : 'text-neutral-900'}`}>
                    {incoming ? '+' : '−'} {formatMoney(tx.amount, tx.currency)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
