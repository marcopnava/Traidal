import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full p-8 mb-6 shadow-lg">
        <Icon size={56} className="text-gray-500 dark:text-gray-400" />
      </div>
      
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 text-center">
        {title}
      </h3>
      
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8 text-base md:text-lg">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-accent hover:bg-accent/90 text-white px-8 py-4 rounded-xl transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl flex items-center gap-2 group"
        >
          <span>{actionLabel}</span>
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
};

