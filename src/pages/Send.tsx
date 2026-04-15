import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useWallet } from '../context/WalletContext';
import { formatMoney } from '../lib/format';

export default function Send() {
  const { send, balance, currency } = useWallet();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) return toast.error('Enter a valid amount.');
    if (n > balance) return toast.error('Insufficient balance.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error('Enter a valid email.');
    setBusy(true);
    await new Promise(r => setTimeout(r, 800));
    send(n, email, note || undefined);
    setBusy(false);
    toast.success(`Sent ${formatMoney(n, currency)} to ${email}`);
    navigate('/dashboard');
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Send money</h1>
        <p className="text-sm text-neutral-500">Available: <span className="font-semibold">{formatMoney(balance, currency)}</span></p>
      </div>

      <form onSubmit={submit} className="card p-6 space-y-4">
        <div>
          <label className="label">Recipient email</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="friend@example.com" required />
        </div>
        <div>
          <label className="label">Amount ({currency})</label>
          <input className="input text-2xl font-extrabold" inputMode="decimal" placeholder="0.00"
            value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ''))} required />
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="Dinner last night" />
        </div>
        <button className="btn-primary w-full py-3" disabled={busy}>
          {busy ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
