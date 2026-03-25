import { MiningMode } from "@/types/mining";

export const DEFAULT_DISABLE_WEBGPU_MINING_ON_MOBILE = true;

export type WebGPUAvailabilityReason = "allowed" | "unsupported" | "disabled_on_mobile";

interface ResolveDisableWebGPUMiningOnMobileOptions {
  maybeEnvValue?: string;
  isDev: boolean;
  maybeDevOverride?: boolean | null;
}

interface ResolveWebGPUAvailabilityOptions {
  isWebGPUSupported: boolean;
  isMobile: boolean;
  disableWebGPUMiningOnMobile: boolean;
}

interface ResolveMiningModeOptions {
  maybePreferredMode: MiningMode | null;
  isWebGPUAllowed: boolean;
}

function parseBooleanFlag(maybeValue: string | undefined, fallbackValue: boolean): boolean {
  if (!maybeValue) {
    return fallbackValue;
  }

  const normalizedValue = maybeValue.trim().toLowerCase();

  if (["true", "1", "yes", "on"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalizedValue)) {
    return false;
  }

  return fallbackValue;
}

export function isWebGPUSupportedSync(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.gpu !== "undefined";
}

export function getDisableWebGPUMiningOnMobileEnvDefault(): boolean {
  return parseBooleanFlag(
    import.meta.env.VITE_DISABLE_WEBGPU_MINING_ON_MOBILE,
    DEFAULT_DISABLE_WEBGPU_MINING_ON_MOBILE
  );
}

export function resolveDisableWebGPUMiningOnMobile({
  maybeEnvValue,
  isDev,
  maybeDevOverride,
}: ResolveDisableWebGPUMiningOnMobileOptions): boolean {
  const envDefault = parseBooleanFlag(maybeEnvValue, DEFAULT_DISABLE_WEBGPU_MINING_ON_MOBILE);

  if (isDev && maybeDevOverride !== null && maybeDevOverride !== undefined) {
    return maybeDevOverride;
  }

  return envDefault;
}

export function resolveWebGPUAvailabilityReason({
  isWebGPUSupported,
  isMobile,
  disableWebGPUMiningOnMobile,
}: ResolveWebGPUAvailabilityOptions): WebGPUAvailabilityReason {
  if (!isWebGPUSupported) {
    return "unsupported";
  }

  if (isMobile && disableWebGPUMiningOnMobile) {
    return "disabled_on_mobile";
  }

  return "allowed";
}

export function resolveMiningMode({
  maybePreferredMode,
  isWebGPUAllowed,
}: ResolveMiningModeOptions): MiningMode {
  if (!maybePreferredMode) {
    return isWebGPUAllowed ? "webgpu" : "cpu";
  }

  if (maybePreferredMode === "webgpu" && !isWebGPUAllowed) {
    return "cpu";
  }

  return maybePreferredMode;
}
