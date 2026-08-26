import React, {
  forwardRef,
  TextareaHTMLAttributes,
  useId,
  useState,
} from 'react';
import { FormField } from './FormField';
import { getControlClassName } from './form-styles';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      required = false,
      className = '',
      id: idProp,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const hasError = Boolean(error);
    const maxLength = props.maxLength;
    const [charCount, setCharCount] = useState(() => {
      if (
        typeof props.defaultValue === 'string' ||
        typeof props.defaultValue === 'number'
      ) {
        return String(props.defaultValue).length;
      }
      if (typeof props.value === 'string' || typeof props.value === 'number') {
        return String(props.value).length;
      }
      return 0;
    });

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      props.onChange?.(e);
    };

    const textarea = (
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        required={required}
        aria-invalid={hasError || undefined}
        aria-required={required || undefined}
        className={getControlClassName(
          hasError,
          `${className} resize-y`.trim()
        )}
        {...props}
        onChange={handleChange}
      />
    );

    const counter = maxLength ? (
      <span className="mt-1 block text-right text-xs text-[var(--color-text-muted)]">
        {charCount}/{maxLength}
      </span>
    ) : null;

    if (label || helperText || error) {
      return (
        <div>
          <FormField
            id={id}
            label={label}
            helperText={helperText}
            error={error}
            required={required}
          >
            {textarea}
          </FormField>
          {counter}
        </div>
      );
    }

    return (
      <>
        {textarea}
        {counter}
      </>
    );
  }
);

Textarea.displayName = 'Textarea';
