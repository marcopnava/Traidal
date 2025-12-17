import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, TrendingUp, Eye, EyeOff, Globe, DollarSign, Mail, CheckCircle } from 'lucide-react';
import { showError, showSuccess } from '../components/ui/Toast';
import { motion } from 'framer-motion';
import { CustomSelect, SelectOption } from '../components/ui/CustomSelect';
import { supabase } from '../lib/supabase';

const timezoneOptions: SelectOption[] = [
  { value: 'UTC', label: 'UTC', description: 'Coordinated Universal Time', icon: <Globe size={18} className="text-accent" /> },
  { value: 'America/New_York', label: 'New York', description: 'EST/EDT', icon: <Globe size={18} className="text-blue-500" /> },
  { value: 'America/Chicago', label: 'Chicago', description: 'CST/CDT', icon: <Globe size={18} className="text-blue-500" /> },
  { value: 'America/Los_Angeles', label: 'Los Angeles', description: 'PST/PDT', icon: <Globe size={18} className="text-blue-500" /> },
  { value: 'Europe/London', label: 'London', description: 'GMT/BST', icon: <Globe size={18} className="text-green-500" /> },
  { value: 'Europe/Paris', label: 'Paris', description: 'CET/CEST', icon: <Globe size={18} className="text-green-500" /> },
  { value: 'Asia/Tokyo', label: 'Tokyo', description: 'JST', icon: <Globe size={18} className="text-red-500" /> },
  { value: 'Asia/Shanghai', label: 'Shanghai', description: 'CST', icon: <Globe size={18} className="text-red-500" /> },
  { value: 'Australia/Sydney', label: 'Sydney', description: 'AEST/AEDT', icon: <Globe size={18} className="text-purple-500" /> }
];

const currencyOptions: SelectOption[] = [
  { value: 'USD', label: 'USD', description: 'US Dollar ($)', icon: <DollarSign size={18} className="text-green-500" /> },
  { value: 'EUR', label: 'EUR', description: 'Euro (€)', icon: <DollarSign size={18} className="text-blue-500" /> },
  { value: 'GBP', label: 'GBP', description: 'British Pound (£)', icon: <DollarSign size={18} className="text-purple-500" /> },
  { value: 'JPY', label: 'JPY', description: 'Japanese Yen (¥)', icon: <DollarSign size={18} className="text-red-500" /> },
  { value: 'AUD', label: 'AUD', description: 'Australian Dollar (A$)', icon: <DollarSign size={18} className="text-orange-500" /> },
  { value: 'CAD', label: 'CAD', description: 'Canadian Dollar (C$)', icon: <DollarSign size={18} className="text-red-400" /> }
];

export const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    timezone: 'UTC',
    preferredCurrency: 'USD'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Handle email confirmation redirect (Supabase puts tokens in hash with HashRouter)
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Check for Supabase auth tokens in URL hash
      const hash = window.location.hash;
      if (hash.includes('access_token') || hash.includes('type=signup') || hash.includes('type=recovery')) {
        try {
          // Supabase will automatically handle the session from the URL
          // Wait for auth state to update
          const checkAuth = setInterval(() => {
            if (isAuthenticated) {
              clearInterval(checkAuth);
              showSuccess('Email confirmed! Welcome to Traidal!');
              // Clear the hash and navigate to dashboard
              window.location.hash = '/';
              navigate('/', { replace: true });
            }
          }, 500);
          
          // Clear interval after 10 seconds
          setTimeout(() => clearInterval(checkAuth), 10000);
        } catch (error) {
          console.error('Email confirmation error:', error);
        }
      }
    };

    handleEmailConfirmation();
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (formData.password.length < 6) {
      showError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showError('Please enter your first and last name');
      setIsLoading(false);
      return;
    }

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const success = await signup(formData.email, formData.password, fullName);
      
      if (success) {
        // Update profile with additional fields
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({
              full_name: fullName,
              timezone: formData.timezone,
              preferred_currency: formData.preferredCurrency
            })
            .eq('id', user.id);
        }

        // Show email confirmation message instead of navigating
        setEmailSent(true);
        setUserEmail(formData.email);
        showSuccess('Account created successfully!');
      } else {
        showError('Failed to create account. Please try again.');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific Supabase errors
      const errorMessage = error?.message || '';
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists') || errorMessage.includes('User already registered')) {
        showError('This email is already registered. Please login instead.');
      } else if (errorMessage.includes('Password') || errorMessage.includes('password')) {
        showError('Password is too weak. Please use at least 6 characters.');
      } else if (errorMessage.includes('Invalid email')) {
        showError('Please enter a valid email address.');
      } else if (error?.code === '23505') {
        showError('This email is already registered. Please login instead.');
      } else {
        showError(errorMessage || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show email confirmation message
  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent-soft to-background dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <TrendingUp size={40} className="text-accent" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Traidal<span className="text-accent">.</span>
              </h1>
            </div>
          </div>

          {/* Email Confirmation Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700 text-center"
          >
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Mail size={48} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Check Your Email
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We've sent a confirmation email to <strong className="text-gray-900 dark:text-white">{userEmail}</strong>
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-300">
              <CheckCircle size={16} className="inline mr-2" />
              Please check your inbox and click the confirmation link to activate your account and access the platform.
              </p>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Didn't receive the email? Check your spam folder or try signing up again.
            </p>
            
            <Link
              to="/login"
              className="text-accent hover:text-accent/80 font-semibold transition-colors"
            >
              Back to Login
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent-soft to-background dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <TrendingUp size={40} className="text-accent" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Traidal<span className="text-accent">.</span>
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Create your Trading Journal account</p>
        </div>

        {/* Signup Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all"
              />
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timezone
              </label>
              <CustomSelect
                value={formData.timezone}
                onChange={(value) => setFormData({ ...formData, timezone: value })}
                options={timezoneOptions}
                placeholder="Select timezone"
              />
            </div>

            {/* Preferred Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preferred Currency
              </label>
              <CustomSelect
                value={formData.preferredCurrency}
                onChange={(value) => setFormData({ ...formData, preferredCurrency: value })}
                options={currencyOptions}
                placeholder="Select currency"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-accent hover:text-accent/80 font-semibold transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          © 2025 Traidal. Track, Analyze, Improve.
        </p>
      </motion.div>
    </div>
  );
};

