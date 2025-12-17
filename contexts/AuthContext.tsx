import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, fullName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let profileLoadInProgress = false;
    
    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Session check error:', error);
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          // Set user immediately with basic info
          const basicUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.email?.split('@')[0] || 'User'
          };
          setUser(basicUser);
          setLoading(false);
          
          // Load profile in background only once
          if (!profileLoadInProgress) {
            profileLoadInProgress = true;
            loadUserProfile(session.user, true).catch(() => {
              // Silently fail
            }).finally(() => {
              profileLoadInProgress = false;
            });
          }
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Session check error:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        const basicUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.email?.split('@')[0] || 'User'
        };
        setUser(basicUser);
        setLoading(false);
        
        // Load profile in background only once
        if (!profileLoadInProgress) {
          profileLoadInProgress = true;
          loadUserProfile(session.user, true).catch(() => {
            // Silently fail
          }).finally(() => {
            profileLoadInProgress = false;
          });
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser, skipLoading = false) => {
    try {
      // Try to get profile - no timeout, let it complete naturally
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', supabaseUser.id)
          .maybeSingle(); // Returns null if no profile exists, doesn't throw error

        if (profile && !profileError) {
          // Only update if the name is different to avoid unnecessary re-renders
          setUser(prevUser => {
            const newUser = {
              id: supabaseUser.id,
              email: profile.email || supabaseUser.email || '',
              name: profile.full_name || supabaseUser.email?.split('@')[0] || 'User'
            };
            // Only update if user data actually changed
            if (prevUser?.name !== newUser.name || prevUser?.email !== newUser.email) {
              return newUser;
            }
            return prevUser;
          });
        } else {
          // Profile doesn't exist, try to create it in background (don't wait)
          supabase.from('profiles').insert({
            id: supabaseUser.id,
            email: supabaseUser.email,
            full_name: supabaseUser.email?.split('@')[0] || 'User'
          }).catch(() => {
            // Ignore errors, profile might already exist
          });
        }
      } catch (error: any) {
        // Error loading profile - use basic user info (already set)
        console.log('Profile load error (using basic info):', error);
        // Profile might not exist, try to create in background
        supabase.from('profiles').insert({
          id: supabaseUser.id,
          email: supabaseUser.email,
          full_name: supabaseUser.email?.split('@')[0] || 'User'
        }).catch(() => {
          // Ignore errors, profile might already exist
        });
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      // Don't update user if there's an error, keep existing state
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        setLoading(false);
        throw error;
      }

      if (data.user) {
        // Set user immediately
        const basicUser: User = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.email?.split('@')[0] || 'User'
        };
        
        setUser(basicUser);
        setLoading(false);
        
        // Load profile in background (non-blocking)
        loadUserProfile(data.user, true).catch(() => {
          // Silently fail
        });
        
        return true;
      }

      setLoading(false);
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      setLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password: string, fullName?: string): Promise<boolean> => {
    try {
      // Get the current site URL for redirect
      const siteUrl = window.location.origin + window.location.pathname;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0]
          },
          emailRedirectTo: `${siteUrl}#/`
        }
      });

      if (error) {
        console.error('Signup error:', error);
        throw error; // Throw error so Signup.tsx can handle it
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName || email.split('@')[0]
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't throw, profile might already exist
        }

        await loadUserProfile(data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Signup error:', error);
      throw error; // Re-throw so Signup.tsx can handle specific errors
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

