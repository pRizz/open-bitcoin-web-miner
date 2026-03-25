import { beforeEach, describe, expect, it } from 'vitest';

let loadDevDisableWebGPUMiningOnMobileOverride: typeof import('./localStorage').loadDevDisableWebGPUMiningOnMobileOverride;
let saveDevDisableWebGPUMiningOnMobileOverride: typeof import('./localStorage').saveDevDisableWebGPUMiningOnMobileOverride;

describe('dev WebGPU mobile override storage', () => {
  beforeEach(async () => {
    const storage = new Map<string, string>();

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
        clear: () => {
          storage.clear();
        },
      },
    });

    const localStorageModule = await import('./localStorage');
    loadDevDisableWebGPUMiningOnMobileOverride = localStorageModule.loadDevDisableWebGPUMiningOnMobileOverride;
    saveDevDisableWebGPUMiningOnMobileOverride = localStorageModule.saveDevDisableWebGPUMiningOnMobileOverride;

    localStorage.clear();
  });

  it('round-trips a saved true override', () => {
    // Arrange
    const maybeValue = true;

    // Act
    saveDevDisableWebGPUMiningOnMobileOverride(maybeValue);
    const result = loadDevDisableWebGPUMiningOnMobileOverride();

    // Assert
    expect(result).toBe(true);
  });

  it('returns null after clearing the saved override', () => {
    // Arrange
    saveDevDisableWebGPUMiningOnMobileOverride(false);

    // Act
    saveDevDisableWebGPUMiningOnMobileOverride(null);
    const result = loadDevDisableWebGPUMiningOnMobileOverride();

    // Assert
    expect(result).toBeNull();
  });
});
