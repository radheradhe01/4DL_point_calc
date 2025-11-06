'use client';

import { useState, useEffect } from 'react';
import { isDateInputSupported, formatDateForInput, parseDate } from '@/utils/compatibility';

interface DateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  max?: string;
  min?: string;
  required?: boolean;
  className?: string;
  label?: string;
}

export default function DateInput({
  id,
  value,
  onChange,
  max,
  min,
  required,
  className = '',
  label,
}: DateInputProps) {
  const [dateSupported, setDateSupported] = useState(true);
  const [fallbackValue, setFallbackValue] = useState('');

  useEffect(() => {
    setDateSupported(isDateInputSupported());
  }, []);

  useEffect(() => {
    if (!dateSupported && value) {
      // Format date for display in fallback input (MM/DD/YYYY)
      const date = parseDate(value);
      if (date) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        setFallbackValue(`${month}/${day}/${year}`);
      }
    }
  }, [value, dateSupported]);

  const handleFallbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setFallbackValue(inputValue);
    
    // Try to parse the date
    const date = parseDate(inputValue);
    if (date) {
      const formatted = formatDateForInput(date.toISOString());
      onChange(formatted);
    }
  };

  if (dateSupported) {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            {label}
          </label>
        )}
        <input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          max={max}
          min={min}
          required={required}
          className={`${className} text-gray-900 bg-white`}
        />
      </div>
    );
  }

  // Fallback for browsers without date input support
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
          {label} <span className="text-gray-500 text-xs">(MM/DD/YYYY)</span>
        </label>
      )}
      <input
        id={id}
        type="text"
        value={fallbackValue}
        onChange={handleFallbackChange}
        placeholder="MM/DD/YYYY"
        pattern="\d{2}/\d{2}/\d{4}"
        required={required}
        className={`${className} text-gray-900 bg-white`}
        inputMode="numeric"
      />
      {fallbackValue && !parseDate(fallbackValue) && (
        <p className="text-xs text-red-600 mt-1">Please enter a valid date (MM/DD/YYYY)</p>
      )}
    </div>
  );
}

