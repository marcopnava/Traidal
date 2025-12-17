import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, Clock } from 'lucide-react';

interface CustomDateTimePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

// Custom input component for DateTimePicker
const CustomInput = forwardRef<HTMLButtonElement, any>(({ value, onClick, placeholder }, ref) => (
  <button
    type="button"
    onClick={onClick}
    ref={ref}
    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none transition-all cursor-pointer hover:border-accent text-left"
  >
    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
      <Calendar size={14} className="text-accent" />
      <Clock size={14} className="text-accent" />
    </div>
    {value || placeholder || 'dd/mm/yyyy HH:mm'}
  </button>
));

CustomInput.displayName = 'CustomInput';

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  className = '',
  placeholder = 'Select date and time'
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <DatePicker
          selected={value}
          onChange={onChange}
          customInput={<CustomInput />}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat="dd/MM/yyyy HH:mm"
          placeholderText={placeholder}
          popperClassName="custom-datepicker-popper"
          calendarClassName="custom-datepicker-calendar"
          wrapperClassName="w-full"
          showPopperArrow={false}
        />
      </div>
    </div>
  );
};

