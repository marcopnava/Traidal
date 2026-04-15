import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowDownToLine } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { formatMoney } from '../lib/format';

export default function Deposit() {
  const { cards, deposit, balance, currency } = useWallet();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [cardId, setCardId] = useState(cards[0]?.id || '');
  const [busy, setBusy] = useState(false);

  const quick = [20, 50, 100, 250, 500];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) return toast.error('Enter a valid amount.');
    if (!cardId) return toast.error('Select a card.');
    setBusy(true);
    await new Promise(r => setTimeout(r, 900));
    deposit(n, cardId);
    setBusy(false);
    toast.success(`Deposited ${formatMoney(n, currency)}`);
    navigate('/dashboard');
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Deposit funds</h1>
        <p className="text-sm text-neutral-500">Top up your wallet from a linked card.</p>
      </div>

      <div className="card p-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-neutral-500">Current balance</div>
          <div className="font-bold text-brand-900">{formatMoney(balance, currency)}</div>
        </div>
        <ArrowDownToLine className="w-5 h-5 text-brand-600" />
      </div>

      {cards.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-neutral-600">You need to link a card before depositing.</p>
          <Link to="/cards" className="btn-primary mt-4 inline-flex">Link a card</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <label className="label">Amount ({currency})</label>
            <input className="input text-2xl font-extrabold" inputMode="decimal" placeholder="0.00"
              value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ''))} required />
            <div className="mt-3 flex flex-wrap gap-2">
              {quick.map(q => (
                <button key={q} type="button" onClick={() => setAmount(String(q))}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100">
                  {formatMoney(q, currency)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Pay from</label>
            <select className="input" value={cardId} onChange={e => setCardId(e.target.value)}>
              {cards.map(c => (
                <option key={c.id} value={c.id}>
                  {c.brand.toUpperCase()} •••• {c.last4} — {c.holder}
                </option>
              ))}
            </select>
          </div>

          <button className="btn-primary w-full py-3" disabled={busy}>
            {busy ? 'Processing…' : `Deposit ${amount ? formatMoney(parseFloat(amount) || 0, currency) : ''}`}
          </button>

          <p className="text-xs text-neutral-500 text-center">
            Demo environment — no real payment is processed.
          </p>
        </form>
      )}
    </div>
  );
}
