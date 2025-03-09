import { describe, it, expect } from 'vitest';
import { NoncelessBlockHeader, serializeBlockHeader } from '@/types/websocket';
import { doubleSha256BlockHeader } from '@/workers/cpuMiningUtils';

describe('Block Header Serialization and Hashing', () => {
  it('should correctly serialize and hash a known block header', async () => {
    // Arrange
    const blockHeader: NoncelessBlockHeader = {
      version: [1, 0, 0, 0],  // Version 1 in little-endian
      previous_block_hash: Array.from(Buffer.from("1234000000000000000000000000000000000000000000000000000000000000", 'hex')).reverse(),
      merkle_root: Array.from(Buffer.from("abcd000000000000000000000000000000000000000000000000000000000000", 'hex')).reverse(),
      timestamp: [0x65, 0xeb, 0xd0, 0xb0].reverse(),  // 1709953200 in little-endian; need to verify this
      compact_target: [0xff, 0xff, 0x00, 0x1d],  // 0x1d00ffff in little-endian
    };
    const nonce = 12345;

    // Expected serialization (80 bytes total):
    // - version: 4 bytes, little-endian
    // - prev_blockhash: 32 bytes, little-endian
    // - merkle_root: 32 bytes, little-endian
    // - timestamp: 4 bytes, little-endian
    // - bits: 4 bytes, little-endian
    // - nonce: 4 bytes, little-endian
    const expectedSerialization = new Uint8Array([
      // version (4 bytes, little-endian)
      0x01, 0x00, 0x00, 0x00,
      // prev_blockhash (32 bytes, little-endian)
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x34, 0x12,
      // merkle_root (32 bytes, little-endian)
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xcd, 0xab,
      // timestamp (4 bytes, little-endian)
      0xb0, 0xd0, 0xeb, 0x65,
      // bits (4 bytes, little-endian)
      0xff, 0xff, 0x00, 0x1d,
      // nonce (4 bytes, little-endian)
      0x39, 0x30, 0x00, 0x00
    ]);

    // Act
    const serialized = serializeBlockHeader(blockHeader, nonce);
    const hash = await doubleSha256BlockHeader(blockHeader, nonce);

    // Assert
    expect(serialized).toEqual(expectedSerialization);
    expect(hash).toBe("bf20bb2d4fc9ff40f1e99e14321c79ccabeafa258976051d7265f07cfb4e24b9");
  });

  it('should handle different nonce values correctly', async () => {
    // Arrange
    const blockHeader: NoncelessBlockHeader = {
      version: [1, 0, 0, 0],
      previous_block_hash: new Array(32).fill(0),
      merkle_root: new Array(32).fill(0),
      timestamp: [0x00, 0x72, 0xf5, 0x65],  // 1709953200 in little-endian
      compact_target: [0xff, 0xff, 0x00, 0x1d],  // 0x1d00ffff in little-endian
    };

    // Act & Assert
    // Test with different nonce values
    const nonces = [0, 1, 0xFFFFFFFF, 12345];
    for (const nonce of nonces) {
      const serialized = serializeBlockHeader(blockHeader, nonce);

      // Check that the nonce appears in the last 4 bytes in little-endian order
      const expectedNonceBytes = new Uint8Array([
        nonce & 0xFF,
        (nonce >> 8) & 0xFF,
        (nonce >> 16) & 0xFF,
        (nonce >> 24) & 0xFF
      ]);

      expect(serialized.slice(76, 80)).toEqual(expectedNonceBytes);
    }
  });

  it('should handle different timestamps correctly', async () => {
    // Arrange
    const blockHeader: NoncelessBlockHeader = {
      version: [1, 0, 0, 0],
      previous_block_hash: new Array(32).fill(0),
      merkle_root: new Array(32).fill(0),
      timestamp: [0x00, 0x72, 0xf5, 0x65],  // 1709953200 in little-endian
      compact_target: [0xff, 0xff, 0x00, 0x1d],  // 0x1d00ffff in little-endian
    };
    const nonce = 0;

    // Act
    const serialized = serializeBlockHeader(blockHeader, nonce);

    // Assert
    // Check that timestamp appears in bytes 68-71 in little-endian order
    const expectedTimestampBytes = new Uint8Array([
      0x00, 0x72, 0xf5, 0x65  // 1709953200 in little-endian
    ]);
    expect(serialized.slice(68, 72)).toEqual(expectedTimestampBytes);
  });
});