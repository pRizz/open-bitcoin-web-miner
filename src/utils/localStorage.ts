import { validateBitcoinAddress } from "./mining";
import { validateBlockchainMessage } from "./blockchainMessage";

export const STORAGE_KEYS = {
  MINER_ADDRESS: 'minerAddress',
  BLOCKCHAIN_MESSAGE: 'blockchainMessage'
} as const;

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