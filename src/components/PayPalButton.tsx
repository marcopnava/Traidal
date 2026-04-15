import toast from 'react-hot-toast';

export default function PayPalButton({ label = 'Continue with PayPal' }: { label?: string }) {
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;
  const env = (import.meta.env.VITE_PAYPAL_ENV as string | undefined) ?? 'sandbox';

  const handleClick = () => {
    if (!clientId) {
      toast.error('PayPal is not configured yet. Set VITE_PAYPAL_CLIENT_ID to enable login.');
      return;
    }
    const base = env === 'live' ? 'https://www.paypal.com' : 'https://www.sandbox.paypal.com';
    const redirectUri = `${window.location.origin}/auth/paypal/callback`;
    const state = crypto.randomUUID();
    sessionStorage.setItem('paypal_oauth_state', state);
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: 'openid email profile',
      redirect_uri: redirectUri,
      state,
    });
    window.location.href = `${base}/connect?flowEntry=static&${params.toString()}`;
  };

  return (
    <button type="button" onClick={handleClick}
      className="w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold bg-[#ffc439] hover:bg-[#f7b928] text-[#003087] transition active:scale-[0.98]">
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
        <path d="M7.1 21.2H4.4c-.3 0-.5-.2-.4-.5L6.4 3.3c.1-.3.3-.5.6-.5h5.5c3.3 0 5.5 1.7 5 4.9-.6 3.6-3 5.2-6.4 5.2H8.7c-.4 0-.6.2-.7.6l-.9 7.7zM15.1 8.3c.2-1.5-.8-2.3-2.5-2.3H10c-.3 0-.5.2-.6.5l-.8 5.3c-.1.2.1.4.4.4h2c2 0 3.7-.9 4.1-3.9z"/>
      </svg>
      {label}
    </button>
  );
}
