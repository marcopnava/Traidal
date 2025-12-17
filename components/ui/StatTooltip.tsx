import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
// import { motion, AnimatePresence } from 'framer-motion'; // Temporarily disabled to fix build issue

export interface StatTooltipItem {
  label: string;
  value: string | number;
  color?: 'default' | 'green' | 'red' | 'yellow' | 'blue' | 'accent';
  icon?: React.ReactNode;
}

interface StatTooltipProps {
  title: string;
  icon?: React.ReactNode;
  items: StatTooltipItem[];
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
}

const getColorClasses = (color?: string) => {
  switch (color) {
    case 'green':
      return 'text-green-600 dark:text-green-400 font-bold';
    case 'red':
      return 'text-red-600 dark:text-red-400 font-bold';
    case 'yellow':
      return 'text-yellow-600 dark:text-yellow-400 font-bold';
    case 'blue':
      return 'text-blue-600 dark:text-blue-400 font-bold';
    case 'accent':
      return 'text-accent dark:text-accent font-bold';
    default:
      return 'text-gray-900 dark:text-white font-semibold';
  }
};

export const StatTooltip: React.FC<StatTooltipProps> = ({
  title,
  icon,
  items,
  children,
  side = 'top',
  delayDuration = 200,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Tooltip.Provider delayDuration={delayDuration}>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          <div className="cursor-help">
            {children}
          </div>
        </Tooltip.Trigger>
        
        {open && (
          <Tooltip.Portal forceMount>
            <Tooltip.Content
              side={side}
              sideOffset={8}
              align="center"
              className="z-50 min-w-[280px] max-w-[360px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-2xl p-5"
            >
              <div>
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                    {icon && (
                      <div className="p-2 bg-accent/10 dark:bg-accent/20 rounded-xl">
                        {icon}
                      </div>
                    )}
                    <h4 className="text-base font-bold text-gray-900 dark:text-white">
                      {title}
                    </h4>
                  </div>

                  {/* Items */}
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {item.icon && (
                            <div className="text-gray-400 dark:text-gray-500">
                              {item.icon}
                            </div>
                          )}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {item.label}
                          </span>
                        </div>
                        <span className={`text-sm ${getColorClasses(item.color)}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                {/* Arrow */}
                <Tooltip.Arrow
                  className="fill-white dark:fill-gray-800"
                  width={12}
                  height={6}
                />
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

