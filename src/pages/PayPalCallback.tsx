import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function PayPalCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { signInWithPayPalProfile } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const code = params.get('code');
    const state = params.get('state');
    const saved = sessionStorage.getItem('paypal_oauth_state');
    sessionStorage.removeItem('paypal_oauth_state');

    if (!code) { toast.error('Missing authorization code from PayPal.'); navigate('/login'); return; }
    if (saved && state && saved !== state) { toast.error('OAuth state mismatch.'); navigate('/login'); return; }

    (async () => {
      try {
        const res = await fetch('/api/paypal/exchange', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code, redirect_uri: `${window.location.origin}/auth/paypal/callback` }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'PayPal exchange failed');
        const { profile } = await res.json();
        if (!profile?.email) throw new Error('PayPal did not return an email.');
        signInWithPayPalProfile({ email: profile.email, name: profile.name, avatarUrl: profile.picture });
        toast.success('Signed in with PayPal');
        navigate('/dashboard');
      } catch (err: any) {
        toast.error(err.message || 'PayPal login failed');
        navigate('/login');
      }
    })();
  }, []);

  return <div className="min-h-screen grid place-items-center text-sm text-neutral-500">Finishing PayPal sign-in…</div>;
}
