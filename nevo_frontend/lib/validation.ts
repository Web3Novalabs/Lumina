export type ValidationRule<T = unknown> = {
  validate: (value: T) => boolean | Promise<boolean>;
  message: string;
};

/**
 * Runs an array of validation rules against a value in order, returning the
 * first error message encountered or `null` if all rules pass.
 *
 * @param value  The value to validate.
 * @param rules  Validation rules to apply in order.
 * @returns The first error message, or `null` if all rules pass.
 */
export const runValidation = async <T>(
  value: T,
  rules: ValidationRule<T>[]
): Promise<string | null> => {
  for (const rule of rules) {
    const isValid = await rule.validate(value);
    if (!isValid) {
      return rule.message;
    }
  }
  return null;
};

/**
 * Creates a rule that rejects `null`, `undefined`, empty strings, and empty arrays.
 * Returns the validation rule object.
 */
export const isRequired = (
  message = 'This field is required'
): ValidationRule => ({
  validate: (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },
  message,
});

/**
 * Creates a rule that validates a string against a basic email pattern.
 * Returns the validation rule object.
 */
export const isEmail = (
  message = 'Invalid email format'
): ValidationRule<string> => ({
  validate: (value) => {
    if (!value) return true; // Let required rule handle empty values
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  message,
});

/**
 * Creates a rule that validates a string as a phone number (digits, dashes,
 * spaces, optional leading `+`). Returns the validation rule object.
 */
export const isPhone = (
  message = 'Invalid phone number format'
): ValidationRule<string> => ({
  validate: (value) => {
    if (!value) return true;
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(value);
  },
  message,
});

/**
 * Creates a rule that validates a string as a well-formed URL using `new URL()`.
 * Returns the validation rule object.
 */
export const isUrl = (
  message = 'Invalid URL format'
): ValidationRule<string> => ({
  validate: (value) => {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  message,
});

/**
 * Creates a rule that validates a string or number as a positive decimal with
 * up to two fractional digits (e.g. `"19.99"`, `100`).
 * Returns the validation rule object.
 */
export const isCurrencyAmount = (
  message = 'Invalid currency amount'
): ValidationRule<string | number> => ({
  validate: (value) => {
    if (value === null || value === undefined || value === '') return true;
    // Allow positive numbers with up to 2 decimal places
    const amountRegex = /^\d+(\.\d{1,2})?$/;
    return amountRegex.test(String(value));
  },
  message,
});

/**
 * Creates a rule that rejects strings shorter than `min` characters.
 * Returns the validation rule object.
 */
export const minLength = (
  min: number,
  message?: string
): ValidationRule<string> => ({
  validate: (value) => {
    if (!value) return true;
    return value.length >= min;
  },
  message: message || `Minimum length is ${min} characters`,
});

/**
 * Creates a rule that rejects strings longer than `max` characters.
 * Returns the validation rule object.
 */
export const maxLength = (
  max: number,
  message?: string
): ValidationRule<string> => ({
  validate: (value) => {
    if (!value) return true;
    return value.length <= max;
  },
  message: message || `Maximum length is ${max} characters`,
});
