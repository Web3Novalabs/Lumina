import {
  isEmail,
  isPhone,
  isUrl,
  isCurrencyAmount,
  minLength,
  maxLength,
  runValidation,
  isRequired,
} from '../lib/validation';

describe('isRequired', () => {
  it('rejects null', async () => {
    const rule = isRequired();
    expect(await rule.validate(null)).toBe(false);
  });

  it('rejects undefined', async () => {
    const rule = isRequired();
    expect(await rule.validate(undefined)).toBe(false);
  });

  it('rejects empty string', async () => {
    const rule = isRequired();
    expect(await rule.validate('')).toBe(false);
  });

  it('rejects whitespace-only string', async () => {
    const rule = isRequired();
    expect(await rule.validate('   ')).toBe(false);
  });

  it('rejects empty array', async () => {
    const rule = isRequired();
    expect(await rule.validate([])).toBe(false);
  });

  it('accepts non-empty string', async () => {
    const rule = isRequired();
    expect(await rule.validate('hello')).toBe(true);
  });

  it('accepts non-empty array', async () => {
    const rule = isRequired();
    expect(await rule.validate([1, 2])).toBe(true);
  });

  it('accepts number zero', async () => {
    const rule = isRequired();
    expect(await rule.validate(0)).toBe(true);
  });

  it('accepts boolean false', async () => {
    const rule = isRequired();
    expect(await rule.validate(false)).toBe(true);
  });

  it('uses custom message', () => {
    const rule = isRequired('Custom required message');
    expect(rule.message).toBe('Custom required message');
  });
});

describe('isEmail', () => {
  const rule = isEmail();

  it('returns true for empty value (delegates to required)', async () => {
    expect(await rule.validate('')).toBe(true);
  });

  it('returns true for valid email', async () => {
    expect(await rule.validate('user@example.com')).toBe(true);
  });

  it('returns true for email with plus sign', async () => {
    expect(await rule.validate('user+tag@example.com')).toBe(true);
  });

  it('returns true for email with subdomain', async () => {
    expect(await rule.validate('user@mail.example.co.uk')).toBe(true);
  });

  it('returns false for missing @', async () => {
    expect(await rule.validate('userexample.com')).toBe(false);
  });

  it('returns false for missing domain', async () => {
    expect(await rule.validate('user@')).toBe(false);
  });

  it('returns false for missing TLD', async () => {
    expect(await rule.validate('user@example')).toBe(false);
  });

  it('returns false for spaces', async () => {
    expect(await rule.validate('user @example.com')).toBe(false);
  });

  it('uses custom message', () => {
    const customRule = isEmail('Bad email');
    expect(customRule.message).toBe('Bad email');
  });
});

describe('isPhone', () => {
  const rule = isPhone();

  it('returns true for empty value', async () => {
    expect(await rule.validate('')).toBe(true);
  });

  it('returns true for 10-digit number', async () => {
    expect(await rule.validate('1234567890')).toBe(true);
  });

  it('returns true for number with dashes', async () => {
    expect(await rule.validate('123-456-7890')).toBe(true);
  });

  it('returns true for number with spaces', async () => {
    expect(await rule.validate('123 456 7890')).toBe(true);
  });

  it('returns true for number with country code', async () => {
    expect(await rule.validate('+11234567890')).toBe(true);
  });

  it('returns false for too short', async () => {
    expect(await rule.validate('12345')).toBe(false);
  });

  it('returns false for letters', async () => {
    expect(await rule.validate('abcdefghij')).toBe(false);
  });

  it('returns false for exactly 9 digits', async () => {
    expect(await rule.validate('123456789')).toBe(false);
  });
});

describe('isUrl', () => {
  const rule = isUrl();

  it('returns true for empty value', async () => {
    expect(await rule.validate('')).toBe(true);
  });

  it('returns true for https URL', async () => {
    expect(await rule.validate('https://example.com')).toBe(true);
  });

  it('returns true for http URL', async () => {
    expect(await rule.validate('http://example.com')).toBe(true);
  });

  it('returns true for URL with path', async () => {
    expect(await rule.validate('https://example.com/path/to/page')).toBe(true);
  });

  it('returns true for URL with query params', async () => {
    expect(await rule.validate('https://example.com?foo=bar')).toBe(true);
  });

  it('returns false for invalid URL', async () => {
    expect(await rule.validate('not-a-url')).toBe(false);
  });

  it('returns false for missing protocol', async () => {
    expect(await rule.validate('example.com')).toBe(false);
  });
});

describe('isCurrencyAmount', () => {
  const rule = isCurrencyAmount();

  it('returns true for empty value', async () => {
    expect(await rule.validate('')).toBe(true);
  });

  it('returns true for null', async () => {
    expect(await rule.validate(null)).toBe(true);
  });

  it('returns true for undefined', async () => {
    expect(await rule.validate(undefined)).toBe(true);
  });

  it('returns true for whole number', async () => {
    expect(await rule.validate('100')).toBe(true);
  });

  it('returns true for zero', async () => {
    expect(await rule.validate('0')).toBe(true);
  });

  it('returns true for number with two decimal places', async () => {
    expect(await rule.validate('100.50')).toBe(true);
  });

  it('returns true for number with one decimal place', async () => {
    expect(await rule.validate('100.5')).toBe(true);
  });

  it('returns false for three decimal places', async () => {
    expect(await rule.validate('100.555')).toBe(false);
  });

  it('returns false for letters', async () => {
    expect(await rule.validate('abc')).toBe(false);
  });

  it('returns false for negative number', async () => {
    expect(await rule.validate('-100')).toBe(false);
  });

  it('accepts numeric input', async () => {
    expect(await rule.validate(42)).toBe(true);
  });

  it('accepts numeric float', async () => {
    expect(await rule.validate(42.99)).toBe(true);
  });
});

describe('minLength', () => {
  it('returns true for empty value', async () => {
    const rule = minLength(5);
    expect(await rule.validate('')).toBe(true);
  });

  it('returns true when length equals min', async () => {
    const rule = minLength(5);
    expect(await rule.validate('hello')).toBe(true);
  });

  it('returns true when length exceeds min', async () => {
    const rule = minLength(5);
    expect(await rule.validate('hello world')).toBe(true);
  });

  it('returns false when length is below min', async () => {
    const rule = minLength(5);
    expect(await rule.validate('hi')).toBe(false);
  });

  it('uses default message', () => {
    const rule = minLength(3);
    expect(rule.message).toBe('Minimum length is 3 characters');
  });

  it('uses custom message', () => {
    const rule = minLength(3, 'Too short!');
    expect(rule.message).toBe('Too short!');
  });
});

describe('maxLength', () => {
  it('returns true for empty value', async () => {
    const rule = maxLength(5);
    expect(await rule.validate('')).toBe(true);
  });

  it('returns true when length equals max', async () => {
    const rule = maxLength(5);
    expect(await rule.validate('hello')).toBe(true);
  });

  it('returns true when length is below max', async () => {
    const rule = maxLength(10);
    expect(await rule.validate('hi')).toBe(true);
  });

  it('returns false when length exceeds max', async () => {
    const rule = maxLength(5);
    expect(await rule.validate('hello world')).toBe(false);
  });

  it('uses default message', () => {
    const rule = maxLength(10);
    expect(rule.message).toBe('Maximum length is 10 characters');
  });

  it('uses custom message', () => {
    const rule = maxLength(10, 'Too long!');
    expect(rule.message).toBe('Too long!');
  });
});

describe('runValidation', () => {
  it('returns null when all rules pass', async () => {
    const result = await runValidation('test@example.com', [
      isRequired(),
      isEmail(),
    ]);
    expect(result).toBeNull();
  });

  it('returns first failing rule message', async () => {
    const result = await runValidation('', [
      isRequired('Field is required'),
      isEmail(),
    ]);
    expect(result).toBe('Field is required');
  });

  it('returns second rule message when first passes', async () => {
    const result = await runValidation('not-an-email', [
      isRequired(),
      isEmail('Invalid email'),
    ]);
    expect(result).toBe('Invalid email');
  });

  it('returns null for empty rules array', async () => {
    const result = await runValidation('anything', []);
    expect(result).toBeNull();
  });

  it('works with multiple rules and returns first failure', async () => {
    const rules = [minLength(5, 'Too short'), isEmail('Invalid email')];
    const result = await runValidation('x@y', rules);
    // minLength(5) — 'x@y' has length 3, so should fail
    expect(result).toBe('Too short');
  });
});
