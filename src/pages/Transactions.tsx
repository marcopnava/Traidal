import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { formatMoney, formatDate } from '../lib/format';

export default function Transactions() {
  const { transactions } = useWallet();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Transactions</h1>
        <p className="text-sm text-neutral-500">All your wallet activity.</p>
      </div>
      {transactions.length === 0 ? (
        <div className="card p-8 text-center text-sm text-neutral-500">No transactions yet.</div>
      ) : (
        <ul className="card divide-y divide-neutral-100">
          {transactions.map(tx => {
            const incoming = tx.type === 'deposit' || tx.type === 'receive';
            return (
              <li key={tx.id} className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full grid place-items-center ${incoming ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-600'}`}>
                  {incoming ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold capitalize">{tx.type}</div>
                  <div className="text-xs text-neutral-500 truncate">
                    {tx.counterparty || '—'}{tx.note ? ` · ${tx.note}` : ''} · {formatDate(tx.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${incoming ? 'text-emerald-600' : 'text-neutral-900'}`}>
                    {incoming ? '+' : '−'} {formatMoney(tx.amount, tx.currency)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-neutral-400">{tx.status}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
