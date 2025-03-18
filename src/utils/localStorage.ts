import { validateBitcoinAddress } from "./mining";
import { validateBlockchainMessage } from "./blockchainMessage";

export const STORAGE_KEYS = {
  MINER_ADDRESS: 'minerAddress',
  BLOCKCHAIN_MESSAGE: 'blockchainMessage',
  USERNAME: 'username',
  LEADERBOARD_MESSAGE: 'leaderboardMessage'
} as const;

// Username validation (1-20 alphanumeric characters)
function validateUsername(username: string): boolean {
  return /^[a-zA-Z0-9]{1,20}$/.test(username);
}

// Leaderboard message validation (up to 120 characters)
function validateLeaderboardMessage(message: string): boolean {
  return message.length <= 120;
}

export function loadUsername(): string | null {
  const maybeUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);
  if (maybeUsername && validateUsername(maybeUsername)) {
    return maybeUsername;
  }
  return null;
}

export function saveUsername(maybeUsername: string | null): void {
  if (maybeUsername && validateUsername(maybeUsername)) {
    localStorage.setItem(STORAGE_KEYS.USERNAME, maybeUsername);
  } else {
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
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