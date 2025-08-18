
import { isUSNAlreadyRegistered, registerUSN } from './teacherAssignments';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateUSNUniqueness = (usn: string): ValidationResult => {
  if (!usn || usn.trim().length === 0) {
    return {
      isValid: false,
      message: "USN is required"
    };
  }

  const cleanUSN = usn.trim();
  
  if (isUSNAlreadyRegistered(cleanUSN)) {
    return {
      isValid: false,
      message: "This USN is already registered. Each USN can only sign up once."
    };
  }

  return {
    isValid: true
  };
};

export const completeUSNRegistration = (usn: string): void => {
  registerUSN(usn.trim());
};
