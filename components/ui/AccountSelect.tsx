import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Account } from '../../types';

interface AccountSelectProps {
  accounts: Account[];
  selectedId: string;
  onChange: (accountId: string) => void;
  className?: string;
}

export const AccountSelect: React.FC<AccountSelectProps> = ({ 
  accounts, 
  selectedId, 
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedAccount = accounts.find(a => a.id === selectedId);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center justify-between gap-3 px-4 py-2.5
          bg-white dark:bg-gray-800 
          border border-gray-200 dark:border-gray-700
          rounded-2xl shadow-soft hover:shadow-md
          transition-all duration-200
          min-w-[250px] w-full
          group
        "
      >
        <div className="flex flex-col items-start overflow-hidden">
          <span className="font-medium text-primary dark:text-white truncate w-full">
            {selectedAccount?.name || 'Select Account'}
          </span>
          {selectedAccount && (
            <span className="text-xs text-secondary dark:text-gray-400 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-accent-soft dark:bg-accent/20 text-accent dark:text-accent rounded-full font-medium">
                {selectedAccount.type}
              </span>
              {selectedAccount.broker}
            </span>
          )}
        </div>
        <ChevronDown 
          size={20} 
          className={`
            transition-transform duration-200 flex-shrink-0
            text-secondary dark:text-gray-400 group-hover:text-accent
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
            bg-white dark:bg-gray-800 
            border border-gray-200 dark:border-gray-700
            rounded-2xl shadow-xl
            overflow-hidden z-50
            max-h-[400px] overflow-y-auto
            animate-in fade-in slide-in-from-top-2 duration-200
          ">
            {accounts.map((account, index) => (
              <button
                key={account.id}
                type="button"
                onClick={() => {
                  onChange(account.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-3.5 text-left
                  hover:bg-gray-50 dark:hover:bg-gray-700/50
                  transition-colors
                  ${index !== accounts.length - 1 && 'border-b border-gray-100 dark:border-gray-700'}
                  ${account.id === selectedId && 'bg-accent-soft dark:bg-accent/10 border-l-4 border-accent'}
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-primary dark:text-white mb-1 truncate">
                      {account.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-secondary dark:text-gray-300 rounded-lg font-medium">
                        {account.type}
                      </span>
                      {account.phase && (
                        <span className="px-2 py-1 bg-accent-soft dark:bg-accent/20 text-accent dark:text-accent rounded-lg font-medium">
                          {account.phase.replace('_', ' ')}
                        </span>
                      )}
                      <span className="text-secondary dark:text-gray-400">
                        {account.broker}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary dark:text-white">
                      {account.currency} {account.initialBalance.toLocaleString()}
                    </div>
                    {account.status && (
                      <div className={`
                        text-xs font-medium mt-1
                        ${account.status === 'ACTIVE' && 'text-success'}
                        ${account.status === 'INACTIVE' && 'text-secondary'}
                        ${account.status === 'FAILED' && 'text-danger'}
                        ${account.status === 'PASSED' && 'text-accent'}
                      `}>
                        {account.status}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

