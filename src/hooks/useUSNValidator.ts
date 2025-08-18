
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Hook to validate USN (University Student Number) input
 * @param initialValue - Initial USN value 
 * @param exactLength - Exact required length (default: 11)
 * @returns Object containing value, onChange handler, and validation state
 */
export function useUSNValidator(initialValue: string = '', exactLength: number = 11) {
  const [value, setValue] = useState(initialValue);
  const [isValid, setIsValid] = useState(true);

  // Validate on mount or when props change
  useEffect(() => {
    if (initialValue && initialValue.length !== exactLength) {
      setIsValid(false);
    } else {
      setIsValid(true);
      setValue(initialValue);
    }
  }, [initialValue, exactLength]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Only allow digits
    if (!/^\d*$/.test(newValue)) {
      toast.info(`USN must contain only digits`, {
        id: 'usn-digits-only',
        duration: 2000
      });
      return;
    }
    
    if (newValue.length <= exactLength) {
      setValue(newValue);
      setIsValid(newValue.length === exactLength || newValue.length === 0);
    } else {
      // Don't update the value if it exceeds exact length
      toast.info(`USN must be exactly ${exactLength} digits only`, {
        id: 'usn-exact-length',
        duration: 2000
      });
    }
  };
  
  return {
    value,
    setValue,
    handleChange,
    isValid,
    exactLength
  };
}

export default useUSNValidator;
