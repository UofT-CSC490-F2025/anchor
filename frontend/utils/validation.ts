/**
 * Validation Utility Functions
 * Form validation and input sanitization functions
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateRequired = (value: any, fieldName: string): ValidationResult => {
  const isValid = value !== null && value !== undefined && value !== '';
  return {
    isValid,
    errors: isValid ? [] : [`${fieldName} is required`],
  };
};

export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  return {
    isValid,
    errors: isValid ? [] : ['Please enter a valid email address'],
  };
};

export const validatePassword = (password: string, options: {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
} = {}): ValidationResult => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
  } = options;

  const errors: string[] = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateUrl = (url: string): ValidationResult => {
  try {
    new URL(url);
    return { isValid: true, errors: [] };
  } catch {
    return { isValid: false, errors: ['Please enter a valid URL'] };
  }
};

export const validatePhoneNumber = (phone: string): ValidationResult => {
  // Basic phone number validation (US format)
  const phoneRegex = /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
  const isValid = phoneRegex.test(phone.replace(/\s/g, ''));
  return {
    isValid,
    errors: isValid ? [] : ['Please enter a valid phone number'],
  };
};

export const validateRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationResult => {
  const isValid = value >= min && value <= max;
  return {
    isValid,
    errors: isValid ? [] : [`${fieldName} must be between ${min} and ${max}`],
  };
};

export const validateLength = (
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string
): ValidationResult => {
  const length = value ? value.length : 0;
  const isValid = length >= minLength && length <= maxLength;
  
  let errorMessage = '';
  if (length < minLength) {
    errorMessage = `${fieldName} must be at least ${minLength} characters long`;
  } else if (length > maxLength) {
    errorMessage = `${fieldName} must be no more than ${maxLength} characters long`;
  }

  return {
    isValid,
    errors: isValid ? [] : [errorMessage],
  };
};

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

export const validateAndSanitize = (
  value: string,
  validators: Array<(value: string) => ValidationResult>
): { sanitizedValue: string; validation: ValidationResult } => {
  const sanitizedValue = sanitizeInput(value);
  const allErrors: string[] = [];
  let isValid = true;

  for (const validator of validators) {
    const result = validator(sanitizedValue);
    if (!result.isValid) {
      isValid = false;
      allErrors.push(...result.errors);
    }
  }

  return {
    sanitizedValue,
    validation: {
      isValid,
      errors: allErrors,
    },
  };
};

export const validateForm = (
  formData: Record<string, any>,
  validationRules: Record<string, Array<(value: any) => ValidationResult>>
): { isValid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {};
  let isValid = true;

  for (const [fieldName, validators] of Object.entries(validationRules)) {
    const fieldValue = formData[fieldName];
    const fieldErrors: string[] = [];

    for (const validator of validators) {
      const result = validator(fieldValue);
      if (!result.isValid) {
        fieldErrors.push(...result.errors);
      }
    }

    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
      isValid = false;
    }
  }

  return { isValid, errors };
};