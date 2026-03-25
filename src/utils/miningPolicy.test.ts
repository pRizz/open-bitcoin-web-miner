import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DISABLE_WEBGPU_MINING_ON_MOBILE,
  resolveDisableWebGPUMiningOnMobile,
  resolveMiningMode,
  resolveWebGPUAvailabilityReason,
} from './miningPolicy';

describe('resolveDisableWebGPUMiningOnMobile', () => {
  it('defaults the mobile WebGPU block to enabled when the env flag is unset', () => {
    // Arrange
    const maybeEnvValue = undefined;

    // Act
    const result = resolveDisableWebGPUMiningOnMobile({
      maybeEnvValue,
      isDev: false,
      maybeDevOverride: null,
    });

    // Assert
    expect(result).toBe(DEFAULT_DISABLE_WEBGPU_MINING_ON_MOBILE);
    expect(result).toBe(true);
  });

  it('lets the dev override take precedence over the env default', () => {
    // Arrange
    const maybeEnvValue = 'true';

    // Act
    const result = resolveDisableWebGPUMiningOnMobile({
      maybeEnvValue,
      isDev: true,
      maybeDevOverride: false,
    });

    // Assert
    expect(result).toBe(false);
  });
});

describe('resolveWebGPUAvailabilityReason', () => {
  it('allows WebGPU on desktop when support is available and the mobile block default is enabled', () => {
    // Arrange
    const disableWebGPUMiningOnMobile = true;

    // Act
    const result = resolveWebGPUAvailabilityReason({
      isWebGPUSupported: true,
      isMobile: false,
      disableWebGPUMiningOnMobile,
    });

    // Assert
    expect(result).toBe('allowed');
  });

  it('blocks WebGPU on mobile when the mobile block is enabled', () => {
    // Arrange
    const disableWebGPUMiningOnMobile = true;

    // Act
    const result = resolveWebGPUAvailabilityReason({
      isWebGPUSupported: true,
      isMobile: true,
      disableWebGPUMiningOnMobile,
    });

    // Assert
    expect(result).toBe('disabled_on_mobile');
  });

  it('allows WebGPU on mobile when the config disables the mobile block', () => {
    // Arrange
    const disableWebGPUMiningOnMobile = false;

    // Act
    const result = resolveWebGPUAvailabilityReason({
      isWebGPUSupported: true,
      isMobile: true,
      disableWebGPUMiningOnMobile,
    });

    // Assert
    expect(result).toBe('allowed');
  });

  it('reports unsupported browsers regardless of the mobile policy', () => {
    // Arrange
    const disableWebGPUMiningOnMobile = false;

    // Act
    const result = resolveWebGPUAvailabilityReason({
      isWebGPUSupported: false,
      isMobile: false,
      disableWebGPUMiningOnMobile,
    });

    // Assert
    expect(result).toBe('unsupported');
  });
});

describe('resolveMiningMode', () => {
  it('falls back from a saved webgpu mode to cpu when WebGPU is blocked', () => {
    // Arrange
    const maybePreferredMode = 'webgpu';

    // Act
    const result = resolveMiningMode({
      maybePreferredMode,
      isWebGPUAllowed: false,
    });

    // Assert
    expect(result).toBe('cpu');
  });

  it('defaults to webgpu when there is no saved mode and WebGPU is allowed', () => {
    // Arrange
    const maybePreferredMode = null;

    // Act
    const result = resolveMiningMode({
      maybePreferredMode,
      isWebGPUAllowed: true,
    });

    // Assert
    expect(result).toBe('webgpu');
  });
});
