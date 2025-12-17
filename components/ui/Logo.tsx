import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-6xl'
  };

  const squareSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };

  return (
    <div className={`inline-flex items-baseline gap-1 ${className}`}>
      <span className={`font-bold text-gray-900 dark:text-white ${sizeClasses[size]}`}>
        Traidal
      </span>
      <span className={`inline-block ${squareSizes[size]} bg-accent rounded-sm`} style={{ marginBottom: '0.1em' }} />
    </div>
  );
};

