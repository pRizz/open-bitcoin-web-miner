
// Content is copied from src/utils/mining.ts due to the need to run this file as a CLI tool, but being in an incompatible root directory
// Update as needed

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

  // Compute the full target as: coefficient * 2^(8*(exponent - 3))
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
export function requiredLeadingZeroesToDifficulty(zeroBits: number): number {
  // Approximate: each zero bit halves the possible target space
  // So: difficulty ≈ 2^(zeroBits) / 2^(genesisZeroBits)
  const genesisZeroBits = calculateRequiredLeadingBinaryZeroes(1);
  const difficulty = Math.pow(2, zeroBits - genesisZeroBits);
  return difficulty;
}

// Get the target from the genesis nBits
const genesisTarget = nBitsToTarget(genesisNBits);

// Calculate how many leading zero bits are needed in a hash to satisfy a given difficulty
export function calculateRequiredLeadingBinaryZeroes(difficulty: number): number {
  // Convert difficulty to target using the formula: new_target = genesis_target / difficulty
  const target = genesisTarget / BigInt(difficulty);

  // Convert the target to a binary string
  const binaryString = target.toString(2).padStart(256, "0");

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
