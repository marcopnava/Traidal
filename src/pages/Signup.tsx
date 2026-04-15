import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import PayPalButton from '../components/PayPalButton';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters.');
    setBusy(true);
    try {
      await signUp(email, password, name);
      toast.success('Account created');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Sign up failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex bg-gradient-to-br from-brand-700 to-brand-900 text-white p-12 flex-col justify-between">
        <Logo size={32} />
        <div>
          <h2 className="text-3xl font-extrabold leading-tight">Join Skrill.<br />It only takes a minute.</h2>
          <p className="opacity-80 mt-3 max-w-sm">Create your wallet, link a card and start sending money.</p>
        </div>
        <div className="text-xs opacity-70">© {new Date().getFullYear()} Skrill</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-8"><Logo /></div>
          <h1 className="text-2xl font-extrabold text-brand-900">Create your account</h1>
          <p className="text-sm text-neutral-500 mt-1">Sign up with PayPal to skip the forms.</p>

          <div className="mt-6">
            <PayPalButton label="Sign up with PayPal" />
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
            <div className="h-px flex-1 bg-neutral-200" /> OR <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="label">Full name</label>
              <input className="input" required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
          </form>

          <p className="text-sm text-neutral-500 mt-6">
            Already have an account? <Link to="/login" className="text-brand-700 font-semibold">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
