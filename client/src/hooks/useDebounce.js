
import { useState, useEffect } from 'react';

function useDebounce(value, delay = 1000) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);  // cleanup on unmount or value change
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
