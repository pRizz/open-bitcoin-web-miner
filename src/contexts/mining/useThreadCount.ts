import { useState, useEffect } from 'react';

export const useThreadCount = () => {
  const [maxThreads, setMaxThreads] = useState(1);
  const [threadCount, setThreadCount] = useState(1);

  useEffect(() => {
    if (navigator.hardwareConcurrency) {
      const cores = navigator.hardwareConcurrency;
      setMaxThreads(cores);
      // TODO: Uncomment this
      // setThreadCount(Math.max(1, Math.floor(cores * 0.75)));
      setThreadCount(1);
    }
  }, []);

  return {
    maxThreads,
    threadCount,
    setThreadCount,
  };
};