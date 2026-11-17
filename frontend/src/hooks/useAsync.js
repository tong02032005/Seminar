import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Chạy một hàm async (thường là hàm trong services/api.js) và quản lý
 * 3 trạng thái: loading / error / data. Tự chạy lại khi deps thay đổi.
 *
 * const { data, loading, error, reload, setData } = useAsync(() => getAnimals(filters), [filters]);
 */
export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const callId = useRef(0);

  const run = useCallback(() => {
    const id = ++callId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    return asyncFn()
      .then((data) => {
        if (id === callId.current) setState({ data, loading: false, error: null });
        return data;
      })
      .catch((error) => {
        if (id === callId.current) setState({ data: null, loading: false, error });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  const setData = useCallback(
    (updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })),
    []
  );

  return { ...state, reload: run, setData };
}
