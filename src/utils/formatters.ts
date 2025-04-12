export const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export const formatLargeNumber = (num: number, decimals: number = 2): string => {
  const magnitudes = [
    { value: 1e24, name: 'septillion' },
    { value: 1e21, name: 'sextillion' },
    { value: 1e18, name: 'quintillion' },
    { value: 1e15, name: 'quadrillion' },
    { value: 1e12, name: 'trillion' },
    { value: 1e9, name: 'billion' },
    { value: 1e6, name: 'million' },
    { value: 1e3, name: 'thousand' }
  ];

  for (const { value, name } of magnitudes) {
    if (num >= value) {
      return `${(num / value).toFixed(decimals)} ${name}`;
    }
  }

  return num.toLocaleString();
};