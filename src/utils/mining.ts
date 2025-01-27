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
 * where:
 * - p is probability of success on each try (finding required leading zeroes)
 *   p = 1/2^requiredZeroes since each bit has 1/2 chance of being 0,
 *   and we need requiredZeroes consecutive 0s
 * - k is number of attempts needed
 * - X is the random variable representing number of trials until success
 * - P(X ≤ k) is probability of finding a solution within k attempts
 */
export function calculateSecondsToFindBlock(hashRate: number, requiredZeroes: number, confidence: number): number {
  // Return Infinity for invalid hash rates
  if (hashRate <= 0) return Infinity;
  
  // Probability of finding required zeroes on a single hash attempt
  const successProbability = Math.pow(2, -requiredZeroes);
  
  // For extremely small probabilities, use approximation to avoid numerical issues
  if (successProbability < 1e-300) {
    // Use approximation based on confidence level
    // Higher confidence requires more hashes
    const estimatedHashesNeeded = Math.pow(2, requiredZeroes) * Math.log(1 / (1 - confidence));
    return estimatedHashesNeeded / hashRate;
  }
  
  // Calculate number of hashes needed for given confidence
  // Using geometric distribution: P(X ≤ k) = 1 - (1-p)^k
  // Solve for k: k = log(1-confidence) / log(1-p)
  const geometricDistributionTerm = Math.log(1 - confidence) / Math.log(1 - successProbability);
  
  // If log calculation resulted in NaN or Infinity, use approximation
  if (!isFinite(geometricDistributionTerm) || isNaN(geometricDistributionTerm)) {
    const estimatedHashesNeeded = Math.pow(2, requiredZeroes) * Math.log(1 / (1 - confidence));
    return estimatedHashesNeeded / hashRate;
  }
  
  const totalHashesNeeded = Math.ceil(geometricDistributionTerm);
  return totalHashesNeeded / hashRate;
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
      
      // Special handling for years with large numbers
      if (unit === 'year') {
        const largeNumbers = [
          { threshold: 1e24, name: 'septillion' },
          { threshold: 1e21, name: 'sextillion' },
          { threshold: 1e18, name: 'quintillion' },
          { threshold: 1e15, name: 'quadrillion' },
          { threshold: 1e12, name: 'trillion' },
          { threshold: 1e9, name: 'billion' },
          { threshold: 1e6, name: 'million' },
          { threshold: 1e3, name: 'thousand' }
        ];

        for (const { threshold, name } of largeNumbers) {
          if (value >= threshold) {
            if (name === 'thousand') {
              return `${value.toLocaleString()} years`;
            }
            return `${(value / threshold).toFixed(1)} ${name} years`;
          }
        }
      }
      
      // Add 's' for plural units except when value is 1
      const plural = value === 1 ? '' : 's';
      return `${value} ${unit}${plural}`;
    }
  }

  return `${Math.round(seconds)}s`;
}