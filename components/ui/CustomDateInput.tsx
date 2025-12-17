import React from 'react';
import { Calendar } from 'lucide-react';

interface CustomDateInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export const CustomDateInput: React.FC<CustomDateInputProps> = ({
  label,
  value,
  onChange,
  required = false,
  className = ''
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-secondary dark:text-gray-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <Calendar size={16} className="text-accent" />
        </div>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border-none rounded-2xl shadow-soft text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 focus:shadow-md outline-none transition-all duration-200 cursor-pointer hover:shadow-md"
        />
      </div>
    </div>
  );
};

