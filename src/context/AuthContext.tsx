import { createContext, useContext, useEffect, useState } from 'react';

export type User = {
  id: string;
  email: string;
  name?: string;
  provider: 'email' | 'paypal';
  avatarUrl?: string;
  createdAt: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, name: string) => Promise<User>;
  signInWithPayPalProfile: (profile: { email: string; name?: string; avatarUrl?: string }) => User;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);
const USERS_KEY = 'traidal:users';
const SESSION_KEY = 'traidal:session';

type StoredUser = User & { passwordHash?: string };

async function hash(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function loadUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}
function saveUsers(u: StoredUser[]) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

function logAccess(type: 'signin' | 'signup', email: string) {
  try {
    fetch('/api/log-access', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type, email }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw));
    } finally { setLoading(false); }
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    else localStorage.removeItem(SESSION_KEY);
  };

  const signUp: AuthState['signUp'] = async (email, password, name) => {
    const users = loadUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }
    const u: StoredUser = {
      id: crypto.randomUUID(),
      email, name, provider: 'email',
      createdAt: new Date().toISOString(),
      passwordHash: await hash(password),
    };
    users.push(u); saveUsers(users);
    const { passwordHash, ...pub } = u;
    persist(pub);
    logAccess('signup', pub.email);
    return pub;
  };

  const signIn: AuthState['signIn'] = async (email, password) => {
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Please enter a valid email.');
    if (!password) throw new Error('Please enter a password.');
    const users = loadUsers();
    let found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      found = {
        id: crypto.randomUUID(),
        email,
        name: email.split('@')[0],
        provider: 'email',
        createdAt: new Date().toISOString(),
        passwordHash: await hash(password),
      };
      users.push(found); saveUsers(users);
    }
    const { passwordHash, ...pub } = found;
    persist(pub);
    logAccess('signin', pub.email);
    return pub;
  };

  const signInWithPayPalProfile: AuthState['signInWithPayPalProfile'] = (profile) => {
    const users = loadUsers();
    let found = users.find(u => u.email.toLowerCase() === profile.email.toLowerCase());
    if (!found) {
      found = {
        id: crypto.randomUUID(),
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        provider: 'paypal',
        createdAt: new Date().toISOString(),
      };
      users.push(found); saveUsers(users);
    }
    const { passwordHash, ...pub } = found;
    persist(pub); return pub;
  };

  const signOut = () => persist(null);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithPayPalProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
