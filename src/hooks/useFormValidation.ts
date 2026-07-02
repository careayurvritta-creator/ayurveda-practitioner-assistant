import { useState, useCallback } from 'react';

interface ValidationRule {
  field: string;
  condition: boolean;
  message: string;
}

interface UseFormValidationReturn {
  errors: Record<string, string>;
  validate: (rules: ValidationRule[]) => boolean;
  clearErrors: () => void;
  clearFieldError: (field: string) => void;
  getFieldError: (field: string) => string | undefined;
  setFieldError: (field: string, message: string) => void;
}

export function useFormValidation(): UseFormValidationReturn {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((rules: ValidationRule[]): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    for (const rule of rules) {
      if (rule.condition) {
        newErrors[rule.field] = rule.message;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const getFieldError = useCallback((field: string) => errors[field], [errors]);

  const setFieldError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  return { errors, validate, clearErrors, clearFieldError, getFieldError, setFieldError };
}
