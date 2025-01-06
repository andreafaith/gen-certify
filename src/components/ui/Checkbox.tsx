import React from 'react';
import clsx from 'clsx';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
}

export function Checkbox({
  label,
  description,
  error,
  className,
  ...props
}: CheckboxProps) {
  return (
    <div className={clsx('relative flex items-start', className)}>
      <div className="flex h-6 items-center">
        <input
          type="checkbox"
          className={clsx(
            'h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600',
            {
              'border-red-300 text-red-500 focus:ring-red-500': error,
            }
          )}
          {...props}
        />
      </div>
      {(label || description) && (
        <div className="ml-3 text-sm leading-6">
          {label && (
            <label
              htmlFor={props.id}
              className={clsx('font-medium text-gray-900', {
                'text-red-500': error,
              })}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-gray-500">{description}</p>
          )}
          {error && (
            <p className="text-red-500 text-xs mt-1">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
