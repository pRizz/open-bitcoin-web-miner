import { useState, useEffect } from 'react';

export const useInitialThreadCount = () => {
  const [maxThreads, setMaxThreads] = useState(1);
  const [threadCount, setThreadCount] = useState(1);

  useEffect(() => {
    if (navigator.hardwareConcurrency) {
      const cores = navigator.hardwareConcurrency;
      setMaxThreads(cores);
      setThreadCount(Math.max(1, Math.floor(cores * 0.95)));
      // TODO: enable this for testing/development
      // setThreadCount(1);
    }
  }, []);

  return {
    maxThreads,
    threadCount,
    setThreadCount,
  };
};