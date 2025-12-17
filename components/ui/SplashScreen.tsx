import React from 'react';
import { TrendingUp } from 'lucide-react';
// import { motion } from 'framer-motion'; // Temporarily disabled to fix build issue

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000); // 2 secondi di splash screen

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent-soft to-background dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <TrendingUp size={64} className="text-accent" />
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white">
            Traidal<span className="text-accent">.</span>
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Your Trading Journal Platform
        </p>
      </div>
    </div>
  );
};

