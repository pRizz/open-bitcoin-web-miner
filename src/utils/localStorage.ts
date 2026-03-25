import { validateBitcoinAddress } from "./mining";
import { validateBlockchainMessage } from "./blockchainMessage";
import { MiningMode } from "@/types/mining";

export const STORAGE_KEYS = {
  MINER_ADDRESS: 'minerAddress',
  BLOCKCHAIN_MESSAGE: 'blockchainMessage',
  LEADERBOARD_USERNAME: 'username',
  LEADERBOARD_MESSAGE: 'leaderboardMessage',
  MINING_MODE: 'miningMode',
  DEV_DISABLE_WEBGPU_MINING_ON_MOBILE_OVERRIDE: 'devDisableWebGPUMiningOnMobileOverride',
} as const;

// Username validation (1-20 alphanumeric characters and inner spaces only)
export function validateUsername(username: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\s]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(username) && username.length <= 20;
}

// Leaderboard message validation (up to 120 characters)
function validateLeaderboardMessage(message: string): boolean {
  return message.length <= 120;
}

// Mining mode validation
// TODO: update if MiningMode ever changes
function validateMiningMode(maybeMode: string): maybeMode is MiningMode {
  return ['cpu', 'webgl', 'webgpu'].includes(maybeMode);
}

export function loadLeaderboardUsername(): string | null {
  const maybeUsername = localStorage.getItem(STORAGE_KEYS.LEADERBOARD_USERNAME);
  if (maybeUsername && validateUsername(maybeUsername)) {
    return maybeUsername;
  }
  return null;
}

export function saveLeaderboardUsername(maybeUsername: string | null): void {
  if (maybeUsername && validateUsername(maybeUsername)) {
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD_USERNAME, maybeUsername);
  } else {
    localStorage.removeItem(STORAGE_KEYS.LEADERBOARD_USERNAME);
  }
}

export function loadLeaderboardMessage(): string | null {
  const maybeMessage = localStorage.getItem(STORAGE_KEYS.LEADERBOARD_MESSAGE);
  if (maybeMessage && validateLeaderboardMessage(maybeMessage)) {
    return maybeMessage;
  }
  return null;
}

export function saveLeaderboardMessage(maybeMessage: string | null): void {
  if (maybeMessage && validateLeaderboardMessage(maybeMessage)) {
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD_MESSAGE, maybeMessage);
  } else {
    localStorage.removeItem(STORAGE_KEYS.LEADERBOARD_MESSAGE);
  }
}

export function loadMinerAddress(): string | null {
  const maybeAddress = localStorage.getItem(STORAGE_KEYS.MINER_ADDRESS);
  if (maybeAddress && validateBitcoinAddress(maybeAddress)) {
    return maybeAddress;
  }
  return null;
}

export function saveMinerAddress(maybeAddress: string | null): void {
  if (maybeAddress && validateBitcoinAddress(maybeAddress)) {
    localStorage.setItem(STORAGE_KEYS.MINER_ADDRESS, maybeAddress);
  } else {
    localStorage.removeItem(STORAGE_KEYS.MINER_ADDRESS);
  }
}

export function loadBlockchainMessage(): string | null {
  const maybeMessage = localStorage.getItem(STORAGE_KEYS.BLOCKCHAIN_MESSAGE);
  if (maybeMessage && !validateBlockchainMessage(maybeMessage)) {
    return maybeMessage;
  }
  return null;
}

export function saveBlockchainMessage(maybeMessage: string | null): void {
  if (maybeMessage && !validateBlockchainMessage(maybeMessage)) {
    localStorage.setItem(STORAGE_KEYS.BLOCKCHAIN_MESSAGE, maybeMessage);
  } else {
    localStorage.removeItem(STORAGE_KEYS.BLOCKCHAIN_MESSAGE);
  }
}

export function loadMiningMode(): MiningMode | null {
  const maybeMode = localStorage.getItem(STORAGE_KEYS.MINING_MODE);
  if (maybeMode && validateMiningMode(maybeMode)) {
    return maybeMode;
  }
  return null;
}

export function saveMiningMode(maybeMode: MiningMode | null): void {
  if (maybeMode && validateMiningMode(maybeMode)) {
    localStorage.setItem(STORAGE_KEYS.MINING_MODE, maybeMode);
  } else {
    localStorage.removeItem(STORAGE_KEYS.MINING_MODE);
  }
}

function validateBooleanString(maybeValue: string): maybeValue is "true" | "false" {
  return maybeValue === "true" || maybeValue === "false";
}

export function loadDevDisableWebGPUMiningOnMobileOverride(): boolean | null {
  const maybeValue = localStorage.getItem(STORAGE_KEYS.DEV_DISABLE_WEBGPU_MINING_ON_MOBILE_OVERRIDE);
  if (!maybeValue || !validateBooleanString(maybeValue)) {
    return null;
  }

  return maybeValue === "true";
}

export function saveDevDisableWebGPUMiningOnMobileOverride(maybeValue: boolean | null): void {
  if (maybeValue === null) {
    localStorage.removeItem(STORAGE_KEYS.DEV_DISABLE_WEBGPU_MINING_ON_MOBILE_OVERRIDE);
    return;
  }

  localStorage.setItem(
    STORAGE_KEYS.DEV_DISABLE_WEBGPU_MINING_ON_MOBILE_OVERRIDE,
    maybeValue ? "true" : "false"
  );
}
