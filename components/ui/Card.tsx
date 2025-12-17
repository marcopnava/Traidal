import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  animate?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action, animate = false }) => {
  // Changed default from true to false to prevent flickering on re-renders
  const Component = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.15, ease: "easeOut" } // Further reduced duration
  } : {};

  return (
    <Component 
      {...animationProps}
      className={`bg-white dark:bg-gray-800 rounded-[2rem] shadow-soft dark:shadow-gray-900/30 p-6 transition-shadow duration-200 hover:shadow-lg dark:hover:shadow-gray-900/50 ${className}`}
    >
      {(title || action) && (
        <div className="flex justify-between items-center mb-6">
          {title && <h3 className="text-xl font-semibold text-primary dark:text-white">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </Component>
  );
};
