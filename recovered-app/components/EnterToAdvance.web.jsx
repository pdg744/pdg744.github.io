import { useEffect } from 'react';
import { handleEnterToAdvance } from '../utils/enterToAdvance.js';

export default function EnterToAdvance() {
  useEffect(() => {
    const handleKey = (event) => handleEnterToAdvance(event, document);
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);
  return null;
}
