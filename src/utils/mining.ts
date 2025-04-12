import { HashSolution } from "@/types/mining";
import API_CONFIG from "@/config/api";

/**
 * Compares two hash strings as big integers
 * @param a First hash string
 * @param b Second hash string
 * @returns -1 if a < b, 0 if a = b, 1 if a > b
 */
export function compareHashes(a: string, b: string): number {
  // First compare lengths (shorter hash is smaller)
  if (a.length !== b.length) {
    return a.length - b.length;
  }
  // If lengths are equal, compare as strings (which works for hex strings)
  return a.localeCompare(b);
}

// Deprecated; use calculateLeadingZeroesU8Array instead
export function calculateLeadingZeroes(hash: string): { leadingBinaryZeroes: number; leadingHexZeroes: number } {
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

  return { leadingBinaryZeroes: binaryZeroes, leadingHexZeroes: hexZeroes };
}

export function calculateLeadingZeroesU8Array(hash: Uint8Array): { leadingBinaryZeroes: number; leadingHexZeroes: number } {
  let leadingBinaryZeroes = 0;

  for (const byte of hash) {
    if (byte === 0) {
      leadingBinaryZeroes += 8;
    } else {
      // Count leading binary zeroes in this byte
      let mask = 0b10000000;
      while ((byte & mask) === 0) {
        leadingBinaryZeroes++;
        mask >>= 1;
      }
      break;
    }
  }

  // Leading hex zeroes are counted per full byte (2 hex digits per byte)
  const leadingHexZeroes = Math.floor(leadingBinaryZeroes / 4);

  return { leadingBinaryZeroes, leadingHexZeroes };
}

export function hexStringFromU8Array(u8Array: Uint8Array): string {
  return Array.from(u8Array).map(b => b.toString(16).padStart(2, '0')).join('');
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

export function formatHashRateWithShortSIUnits(hashRate: number): string {
  if (hashRate >= 1e18) {
    return `${(hashRate / 1e18).toFixed(2)} EH/s`;
  } else if (hashRate >= 1e15) {
    return `${(hashRate / 1e15).toFixed(2)} PH/s`;
  } else if (hashRate >= 1e12) {
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

export function formatHashRateWithLongSIUnits(hashRate: number): string {
  if (hashRate >= 1e18) {
    return `${(hashRate / 1e18).toFixed(2)} ExaH/s`;
  } else if (hashRate >= 1e15) {
    return `${(hashRate / 1e15).toFixed(2)} PetaH/s`;
  } else if (hashRate >= 1e12) {
    return `${(hashRate / 1e12).toFixed(2)} TeraH/s`;
  } else if (hashRate >= 1e9) {
    return `${(hashRate / 1e9).toFixed(2)} GigaH/s`;
  } else if (hashRate >= 1e6) {
    return `${(hashRate / 1e6).toFixed(2)} MegaH/s`;
  } else if (hashRate >= 1e3) {
    return `${(hashRate / 1e3).toFixed(2)} KiloH/s`;
  }
  return `${hashRate.toFixed(2)} H/s`;
}

export function formatHashRateWithNumericUnits(hashRate: number): string {
  if (hashRate >= 1e18) {
    return `${(hashRate / 1e18).toFixed(2)} Quintillion H/s`;
  } else if (hashRate >= 1e15) {
    return `${(hashRate / 1e15).toFixed(2)} Quadrillion H/s`;
  } else if (hashRate >= 1e12) {
    return `${(hashRate / 1e12).toFixed(2)} Trillion H/s`;
  } else if (hashRate >= 1e9) {
    return `${(hashRate / 1e9).toFixed(2)} Billion H/s`;
  } else if (hashRate >= 1e6) {
    return `${(hashRate / 1e6).toFixed(2)} Million H/s`;
  } else if (hashRate >= 1e3) {
    return `${(hashRate / 1e3).toFixed(2)} Thousand H/s`;
  }
  return `${hashRate.toFixed(2)} H/s`;
}

export function validateBitcoinAddress(address: string): boolean {
  // In debug mode, allow regtest addresses (bcrt1...)
  if (API_CONFIG.baseUrl.includes('localhost') || API_CONFIG.baseUrl.includes('127.0.0.1')) {
    return /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{11,71}|bcrt1[a-zA-HJ-NP-Z0-9]{11,71})$/.test(address);
    // main coinbase address: bcrt1q248p60qnmqkn69j4kv4yshrxx628e3j06yegwx
    // other miner address: bcrt1qxkjdntyd6h3cwk8wuczys6q8ppjphr99tcekz3
  }

  // Production validation for legacy (1), script hash (3), and bech32 (bc1) addresses
  return /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{11,71})$/.test(address);
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

// The original Bitcoin genesis difficulty is 1
const genesisDifficulty = 1;

// This is the compact "nBits" representation of the target used in Bitcoin block headers
const genesisNBits = 0x1d00ffff;

// Converts the compact nBits representation to the full 256-bit target
export function nBitsToTarget(nBits: number): bigint {
  // Extract the exponent (first byte) and the coefficient (last 3 bytes)
  const exponent = (nBits >>> 24) & 0xff;
  const coefficient = nBits & 0x007fffff;

  if (nBits & 0x00800000) {
    throw new Error("Negative targets are not allowed.");
  }

  // Compute the full target as: coefficient * 2^(8*(exponent - 3)) = coefficient << (8 * (exponent - 3))
  const shift = BigInt(8 * (exponent - 3));
  return BigInt(coefficient) << shift;
}

// Convert a compact target (nBits) into difficulty
// FIXME: loses precision
// export function bitsToDifficulty(nBits: number): number {
//   const target = nBitsToTarget(nBits);
//   return Number(genesisTarget) / Number(target);
// }

// Estimate difficulty from required leading zero bits
export function requiredLeadingZeroesToDifficulty(leadingZeroes: number): number {
  // Approximate: each zero bit halves the possible target space
  // So: difficulty ≈ 2^(leadingZeroes) / 2^(genesisLeadingZeroes) = 2^(leadingZeroes - genesisLeadingZeroes)
  const genesisLeadingZeroes = calculateRequiredLeadingBinaryZeroes(genesisDifficulty);
  const difficulty = Math.pow(2, leadingZeroes - genesisLeadingZeroes);
  return difficulty;
}

// Get the target from the genesis nBits
const genesisTarget = nBitsToTarget(genesisNBits);

// Calculate how many leading zero bits are needed in a hash to satisfy a given difficulty
export function calculateRequiredLeadingBinaryZeroes(difficulty: number): number {
  // Convert difficulty to target using the formula: new_target = genesis_target / difficulty
  if (difficulty <= 0) {
    throw new Error("Difficulty must be greater than 0.");
  }
  let target;
  // If difficulty is less than 1, or not an integer, we need to use the formula: new_target = genesis_target * floor(1 / difficulty)
  if (difficulty < 1 || difficulty % 1 !== 0) {
    target = genesisTarget * BigInt(Math.floor(1 / difficulty));
  } else {
    target = genesisTarget / BigInt(difficulty);
  }
  console.log(`target from difficulty ${difficulty} is ${target}`);
  // Convert the target to a binary string
  // const binaryString = target.toString(2).padStart(256, "0");

  // Convert the target to a binary string
  const binaryString = target.toString(2).padStart(256, "0");
  console.log(`binaryString from target ${target} is ${binaryString}`);
  // as a hex string
  const hexString = target.toString(16).padStart(64, "0");
  console.log(`hexString from target ${target} is ${hexString}`);

  // Count how many leading zeroes are in the binary string
  let leadingZeroCount = 0;
  for (const bit of binaryString) {
    if (bit === "0") {
      leadingZeroCount++;
    } else {
      break;
    }
  }

  return leadingZeroCount;
}
