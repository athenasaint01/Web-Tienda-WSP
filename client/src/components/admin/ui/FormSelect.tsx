import { forwardRef } from 'react';
import type { SelectHTMLAttributes, ReactNode } from 'react';

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  options?: Array<{ value: string | number; label: string }>;
  children?: ReactNode;
}

/**
 * Select component compatible with React Hook Form
 * Can be used with either options prop or children
 */
const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, helperText, options, children, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          ref={ref}
          className={`w-full px-4 py-2.5 border rounded-lg transition-all focus:ring-2 focus:ring-neutral-900 focus:border-transparent ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-neutral-300'
          } ${className}`}
          {...props}
        >
          {children || (
            <>
              <option value="">Seleccionar...</option>
              {options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </>
          )}
        </select>
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';

export default FormSelect;
