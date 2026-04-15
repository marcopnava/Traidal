import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Globe2 } from 'lucide-react';
import Logo from '../components/Logo';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand-50/40 to-white">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-brand-800 hover:underline">Log in</Link>
          <Link to="/signup" className="btn-primary">Create account</Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold">
            Your digital wallet
          </span>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-brand-900 leading-tight">
            Move money the<br /> simple way.
          </h1>
          <p className="mt-4 text-neutral-600 text-lg max-w-md">
            Open a Traidal wallet in seconds, link your card, top up your balance and send money anywhere — all from one app.
          </p>
          <div className="mt-8 flex gap-3">
            <Link to="/signup" className="btn-primary px-6 py-3">Get started</Link>
            <Link to="/login" className="btn-secondary px-6 py-3">I have an account</Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            <Feature icon={ShieldCheck} label="Bank-grade security" />
            <Feature icon={Zap} label="Instant transfers" />
            <Feature icon={Globe2} label="Worldwide" />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 bg-gradient-to-tr from-brand-200/60 to-brand-500/10 blur-3xl rounded-full" />
          <div className="relative card p-6 rotate-[-2deg] max-w-sm ml-auto">
            <div className="text-xs text-neutral-500">Available balance</div>
            <div className="mt-1 text-3xl font-extrabold text-brand-900">$ 12,480.<span className="text-xl">00</span></div>
            <div className="mt-6 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white p-5">
              <div className="text-xs opacity-80">Traidal wallet</div>
              <div className="mt-6 tracking-widest font-semibold">•••• •••• •••• 4242</div>
              <div className="flex justify-between text-xs mt-3 opacity-90">
                <span>YOUR NAME</span><span>12/29</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 py-8 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Traidal. All rights reserved.
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-700 grid place-items-center">
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-xs font-semibold text-neutral-700">{label}</div>
    </div>
  );
}
