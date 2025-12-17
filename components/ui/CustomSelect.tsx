import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  required?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  label,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(opt => opt.value === value);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };
  
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full flex items-center justify-between gap-3 px-4 py-3
            bg-white dark:bg-gray-700 
            border border-gray-200 dark:border-gray-600
            rounded-2xl shadow-soft hover:shadow-md
            transition-all duration-200
            text-left
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${isOpen && 'ring-2 ring-accent/50'}
          `}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {selectedOption?.icon && (
              <div className="flex-shrink-0">
                {selectedOption.icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-primary dark:text-white truncate">
                {selectedOption?.label || placeholder}
              </div>
              {selectedOption?.description && (
                <div className="text-xs text-secondary dark:text-gray-400 truncate mt-0.5">
                  {selectedOption.description}
                </div>
              )}
            </div>
          </div>
          <ChevronDown 
            size={20} 
            className={`
              transition-transform duration-200 flex-shrink-0
              text-secondary dark:text-gray-400
              ${isOpen && 'rotate-180'}
            `} 
          />
        </button>
        
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="
              absolute top-full left-0 right-0 mt-2 
              bg-white dark:bg-gray-700 
              border border-gray-200 dark:border-gray-600
              rounded-2xl shadow-xl
              overflow-hidden z-50
              max-h-[300px] overflow-y-auto
              animate-in fade-in slide-in-from-top-2 duration-200
            ">
              {options.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full px-4 py-3 text-left
                    hover:bg-gray-50 dark:hover:bg-gray-600
                    transition-colors
                    ${index !== options.length - 1 && 'border-b border-gray-100 dark:border-gray-600'}
                    ${option.value === value && 'bg-accent-soft dark:bg-accent/10'}
                    flex items-center justify-between gap-3
                  `}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {option.icon && (
                      <div className="flex-shrink-0">
                        {option.icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-primary dark:text-white truncate">
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-xs text-secondary dark:text-gray-400 truncate mt-0.5">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {option.value === value && (
                    <Check size={18} className="text-accent flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

