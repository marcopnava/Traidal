import { useState } from 'react';
import { CreditCard, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWallet, detectBrand } from '../context/WalletContext';

function formatCardInput(v: string) {
  return v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
}
function luhn(num: string) {
  const d = num.replace(/\D/g, ''); if (d.length < 12) return false;
  let sum = 0, alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = parseInt(d[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}

export default function Cards() {
  const { cards, addCard, removeCard } = useWallet();
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = number.replace(/\D/g, '');
    if (!luhn(digits)) return toast.error('Invalid card number.');
    const [mm, yy] = exp.split('/').map(s => s.trim());
    const m = parseInt(mm || '', 10); const y = 2000 + parseInt(yy || '', 10);
    if (!m || m < 1 || m > 12) return toast.error('Invalid expiration month.');
    if (!y || y < new Date().getFullYear()) return toast.error('Card is expired.');
    if (!/^\d{3,4}$/.test(cvc)) return toast.error('Invalid CVC.');
    if (!holder.trim()) return toast.error('Cardholder name required.');

    addCard({
      brand: detectBrand(digits),
      last4: digits.slice(-4),
      holder: holder.trim(),
      expMonth: m, expYear: y,
    });
    toast.success('Card linked');
    setOpen(false); setNumber(''); setHolder(''); setExp(''); setCvc('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">Cards</h1>
          <p className="text-sm text-neutral-500">Link a debit or credit card to top up your balance.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary"><Plus className="w-4 h-4" /> Link card</button>
      </div>

      {cards.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 grid place-items-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="mt-4 font-bold">No cards yet</h3>
          <p className="text-sm text-neutral-500 mt-1">Link your first card to deposit funds.</p>
          <button onClick={() => setOpen(true)} className="btn-primary mt-4">Link card</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map(c => (
            <div key={c.id} className="card p-5">
              <div className="rounded-xl bg-gradient-to-tr from-brand-800 to-brand-500 text-white p-5">
                <div className="flex items-center justify-between text-xs uppercase opacity-80">
                  <span>{c.brand}</span><span>Credit / Debit</span>
                </div>
                <div className="mt-6 tracking-widest font-semibold">•••• •••• •••• {c.last4}</div>
                <div className="flex justify-between text-xs mt-4 opacity-90">
                  <span>{c.holder}</span><span>{String(c.expMonth).padStart(2, '0')}/{String(c.expYear).slice(-2)}</span>
                </div>
              </div>
              <button onClick={() => { removeCard(c.id); toast.success('Card removed'); }}
                className="mt-3 text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={() => setOpen(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={submit} className="card p-6 w-full max-w-md space-y-3">
            <h2 className="font-bold text-lg">Link a new card</h2>
            <div>
              <label className="label">Card number</label>
              <input className="input" inputMode="numeric" value={number}
                onChange={e => setNumber(formatCardInput(e.target.value))} placeholder="4242 4242 4242 4242" required />
            </div>
            <div>
              <label className="label">Cardholder name</label>
              <input className="input" value={holder} onChange={e => setHolder(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Expiration (MM/YY)</label>
                <input className="input" value={exp}
                  onChange={e => setExp(e.target.value.replace(/[^\d/]/g, '').slice(0, 5))} placeholder="12/29" required />
              </div>
              <div>
                <label className="label">CVC</label>
                <input className="input" inputMode="numeric" value={cvc}
                  onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" required />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button className="btn-primary flex-1">Link card</button>
            </div>
            <p className="text-xs text-neutral-500">
              Demo environment — card details are stored locally in your browser only. No real charges are made.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
