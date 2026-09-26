import { useEffect, useState } from 'react';

/** Trả về giá trị sau khi người dùng ngừng gõ `delay` ms – tránh gọi API liên tục */
export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
