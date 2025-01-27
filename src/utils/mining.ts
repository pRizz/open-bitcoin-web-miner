import { HashSolution } from "@/types/mining";

export function calculateLeadingZeroes(hash: string): { binary: number; hex: number } {
  // Calculate hex zeroes
  let hexZeroes = 0;
  for (let i = 0; i < hash.length; i++) {
    if (hash[i] === '0') {
      hexZeroes++;
    } else {
      break;
    }
  }

  // Convert to binary and calculate binary zeroes
  const binary = hex2bin(hash);
  let binaryZeroes = 0;
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '0') {
      binaryZeroes++;
    } else {
      break;
    }
  }

  return { binary: binaryZeroes, hex: hexZeroes };
}

export function hex2bin(hex: string): string {
  const binLookup: { [key: string]: string } = {
    '0': '0000', '1': '0001', '2': '0010', '3': '0011',
    '4': '0100', '5': '0101', '6': '0110', '7': '0111',
    '8': '1000', '9': '1001', 'a': '1010', 'b': '1011',
    'c': '1100', 'd': '1101', 'e': '1110', 'f': '1111'
  };
  
  let bin = '';
  for (let i = 0; i < hex.length; i++) {
    bin += binLookup[hex[i].toLowerCase()] || '';
  }
  return bin;
}

export function formatHashRate(hashRate: number): string {
  if (hashRate >= 1e12) {
    return `${(hashRate / 1e12).toFixed(2)} TH/s`;
  } else if (hashRate >= 1e9) {
    return `${(hashRate / 1e9).toFixed(2)} GH/s`;
  } else if (hashRate >= 1e6) {
    return `${(hashRate / 1e6).toFixed(2)} MH/s`;
  } else if (hashRate >= 1e3) {
    return `${(hashRate / 1e3).toFixed(2)} KH/s`;
  }
  return `${hashRate.toFixed(2)} H/s`;
}

export function validateBitcoinAddress(address: string): boolean {
  // Basic validation - should be between 26-35 chars and start with 1, 3, or bc1
  return /^(1|3|bc1)[a-zA-Z0-9]{25,34}$/.test(address);
}

export function generateMockBlockHeader(): Partial<HashSolution> {
  return {
    version: 0x20000000,
    previousBlock: "00000000000000000007c31205989f6743ccfe4266b0dbe340a0b825c7795296",
    merkleRoot: "b14bef53a7c4cc091005c70e5a3aff49ad8c5df4f785c5ddd5e5be2b9c627b68",
    timestamp: Math.floor(Date.now() / 1000),
    bits: "170c1f55",
    nonce: Math.floor(Math.random() * 0xFFFFFFFF),
  };
}

/**
 * Calculates the expected time to find a block with given confidence level
 * Based on geometric distribution: P(X ≤ k) = 1 - (1-p)^k
 * where p is probability of success on each try
 */

export function calculateExpectedBlockTime(hashRate: number, requiredZeroes: number, confidence: number): number {
  // Return Infinity only for invalid hash rates
  if (hashRate <= 0) return Infinity;
  
  // Probability of finding required zeroes on a single hash
  const p = Math.pow(2, -requiredZeroes);
  
  // For extremely small probabilities, use approximation to avoid numerical issues
  if (p < 1e-300) {
    // Use approximation: required hashes ≈ 2^requiredZeroes
    const approximateHashes = Math.pow(2, requiredZeroes);
    return approximateHashes / hashRate;
  }
  
  // Calculate number of hashes needed for given confidence
  // Using geometric distribution: P(X ≤ k) = 1 - (1-p)^k
  // Solve for k: k = log(1-confidence) / log(1-p)
  const logTerm = Math.log(1 - confidence) / Math.log(1 - p);
  
  // If log calculation resulted in NaN or Infinity, use approximation
  if (!isFinite(logTerm) || isNaN(logTerm)) {
    const approximateHashes = Math.pow(2, requiredZeroes);
    return approximateHashes / hashRate;
  }
  
  const hashesNeeded = Math.ceil(logTerm);
  return hashesNeeded / hashRate;
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "∞";
  
  const timeUnits = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 }
  ];

  // Handle very small times (less than a second)
  if (seconds < 1) {
    const ms = Math.round(seconds * 1000);
    return `${ms}ms`;
  }

  // Find the most appropriate unit
  for (const { unit, seconds: unitSeconds } of timeUnits) {
    if (seconds >= unitSeconds) {
      const value = Math.round(seconds / unitSeconds);
      
      // Special handling for years
      if (unit === 'year') {
        if (value >= 1_000_000_000) {
          return `${(value / 1_000_000_000).toFixed(1)} billion years`;
        }
        if (value >= 1_000_000) {
          return `${(value / 1_000_000).toFixed(1)} million years`;
        }
        if (value >= 1_000) {
          return `${value.toLocaleString()} years`;
        }
      }
      
      // Add 's' for plural units except when value is 1
      const plural = value === 1 ? '' : 's';
      return `${value} ${unit}${plural}`;
    }
  }

  return `${Math.round(seconds)}s`;
}