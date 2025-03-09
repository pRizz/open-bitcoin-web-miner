/**
 * Converts a u32 nonce into an array of four u8s in big-endian order
 * @param nonce - The u32 nonce to convert (must be a positive integer between 0 and 2^32-1)
 * @returns Array of four u8s representing the nonce in big-endian order
 * @throws Error if nonce is out of valid u32 range
 */
export function nonceToU8ArrayBE(nonce: number): Uint8Array {
  if (!Number.isInteger(nonce) || nonce < 0 || nonce > 0xFFFFFFFF) {
    throw new Error('Nonce must be a positive integer between 0 and 2^32-1');
  }

  const result = new Uint8Array(4);
  result[0] = (nonce >> 24) & 0xFF;
  result[1] = (nonce >> 16) & 0xFF;
  result[2] = (nonce >> 8) & 0xFF;
  result[3] = nonce & 0xFF;
  return result;
}

/**
 * Converts an array of four u8s in big-endian order into a u32 nonce
 * @param bytes - Array of exactly four u8s representing the nonce in big-endian order
 * @returns The u32 nonce value
 * @throws Error if input array is not exactly 4 bytes or contains invalid values
 */
export function u8ArrayBEToNonce(bytes: Uint8Array): number {
  if (bytes.length !== 4) {
    throw new Error('Input must be exactly 4 bytes');
  }

  if (!bytes.every(byte => byte >= 0 && byte <= 0xFF)) {
    throw new Error('Each byte must be between 0 and 255');
  }

  return (
    (bytes[0] << 24) |
        (bytes[1] << 16) |
        (bytes[2] << 8) |
        bytes[3]
  ) >>> 0;  // >>> 0 ensures unsigned 32-bit integer
}
