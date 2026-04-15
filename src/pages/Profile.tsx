import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { formatDate } from '../lib/format';

export default function Profile() {
  const { user } = useAuth();
  const { currency, setCurrency } = useWallet();

  if (!user) return null;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Profile</h1>
        <p className="text-sm text-neutral-500">Account information and preferences.</p>
      </div>

      <div className="card p-6 space-y-4">
        <Row label="Name" value={user.name || '—'} />
        <Row label="Email" value={user.email} />
        <Row label="Provider" value={user.provider === 'paypal' ? 'PayPal' : 'Email & password'} />
        <Row label="Member since" value={formatDate(user.createdAt)} />
      </div>

      <div className="card p-6 space-y-3">
        <div className="font-bold text-brand-900">Wallet currency</div>
        <select className="input max-w-xs" value={currency} onChange={e => setCurrency(e.target.value as any)}>
          <option value="USD">USD — US Dollar</option>
          <option value="EUR">EUR — Euro</option>
          <option value="GBP">GBP — British Pound</option>
        </select>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-neutral-100 last:border-0 pb-3 last:pb-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}
