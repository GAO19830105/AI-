import { useCallback, useRef, useState } from 'react';

/**
 * 管理异步操作的 pending 状态，并用 ref 防止在单次 render 之前重复进入（连点发送）。
 */
export function useExclusiveAsync() {
  const [isPending, setIsPending] = useState(false);
  const inFlightRef = useRef(false);

  const runExclusive = useCallback(async (fn: () => Promise<void>) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsPending(true);
    try {
      await fn();
    } finally {
      inFlightRef.current = false;
      setIsPending(false);
    }
  }, []);

  return { isPending, runExclusive } as const;
}
