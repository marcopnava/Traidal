import React, { useState } from 'react';
import { Calendar, Clock, TrendingUp, CalendarDays, Zap, Infinity } from 'lucide-react';
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { CustomDatePicker } from './CustomDatePicker';

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presets = [
  { label: 'Today', icon: Clock, getValue: () => ({ start: new Date(), end: new Date() }) },
  { label: 'Last 7 Days', icon: TrendingUp, getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { label: 'Last 30 Days', icon: TrendingUp, getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { label: 'This Week', icon: CalendarDays, getValue: () => ({ start: startOfWeek(new Date()), end: new Date() }) },
  { label: 'This Month', icon: CalendarDays, getValue: () => ({ start: startOfMonth(new Date()), end: new Date() }) },
  { label: 'This Year', icon: Zap, getValue: () => ({ start: startOfYear(new Date()), end: new Date() }) },
  { label: 'All Time', icon: Infinity, getValue: () => ({ start: new Date(2020, 0, 1), end: new Date() }) },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);

  const handlePresetClick = (preset: typeof presets[0]) => {
    onChange(preset.getValue());
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange({
        start: customStart,
        end: customEnd
      });
      setIsOpen(false);
    }
  };

  const displayText = value.start && value.end
    ? `${format(value.start, 'MMM d')} - ${format(value.end, 'MMM d, yyyy')}`
    : 'Select date range';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-soft hover:shadow-md transition-all duration-200 text-gray-900 dark:text-white"
      >
        <Calendar size={20} className="text-accent flex-shrink-0" />
        <span className="font-medium text-sm">{displayText}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-700 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 z-50 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
            <h4 className="text-sm font-bold text-primary dark:text-white mb-3 flex items-center gap-2">
              <Zap size={16} className="text-accent" />
              Quick Select
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {presets.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-600 hover:bg-accent-soft dark:hover:bg-accent/20 hover:text-accent dark:hover:text-accent text-gray-700 dark:text-gray-200 rounded-xl transition-all duration-200 font-medium"
                  >
                    <Icon size={14} className="flex-shrink-0" />
                    <span className="truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <h4 className="text-sm font-bold text-primary dark:text-white mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-accent" />
                Custom Range
              </h4>
              <div className="space-y-3">
                <CustomDatePicker
                  label="Start Date"
                  value={customStart}
                  onChange={setCustomStart}
                />
                <CustomDatePicker
                  label="End Date"
                  value={customEnd}
                  onChange={setCustomEnd}
                  minDate={customStart || undefined}
                />
                <button
                  type="button"
                  onClick={handleCustomApply}
                  disabled={!customStart || !customEnd}
                  className="w-full bg-accent hover:bg-accent/90 text-white px-4 py-2.5 rounded-xl transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  Apply Range
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

