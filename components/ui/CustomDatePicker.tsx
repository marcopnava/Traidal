import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

interface CustomDatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
}

// Custom input component for DatePicker
const CustomInput = forwardRef<HTMLButtonElement, any>(({ value, onClick, placeholder }, ref) => (
  <button
    type="button"
    onClick={onClick}
    ref={ref}
    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border-none rounded-2xl shadow-soft text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 focus:shadow-md outline-none transition-all duration-200 cursor-pointer hover:shadow-md text-left"
  >
    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
      <Calendar size={16} className="text-accent" />
    </div>
    {value || placeholder || 'dd/mm/yyyy'}
  </button>
));

CustomInput.displayName = 'CustomInput';

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  className = '',
  placeholder = 'Select date',
  minDate,
  maxDate
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
        <DatePicker
          selected={value}
          onChange={onChange}
          customInput={<CustomInput />}
          dateFormat="dd/MM/yyyy"
          placeholderText={placeholder}
          minDate={minDate}
          maxDate={maxDate}
          popperClassName="custom-datepicker-popper"
          calendarClassName="custom-datepicker-calendar"
          wrapperClassName="w-full"
          showPopperArrow={false}
        />
      </div>
    </div>
  );
};

