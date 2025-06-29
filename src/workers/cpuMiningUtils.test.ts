import { doubleSha256, doubleSha256BlockHeaderU8Array } from './cpuMiningUtils';
import { serializeNonceLE } from '@/types/websocket';
import { describe, it, expect } from 'vitest';

describe('cpuMiningUtils', () => {
  describe('doubleSha256', () => {
    it('should perform double SHA-256 hash on input data', async () => {
      // Arrange
      const inputData = new Uint8Array([1, 2, 3, 4, 5]);

      // Act
      const result = await doubleSha256(inputData);

      // Assert
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBe(32); // SHA-256 produces 32 bytes

      // Convert to hex for easier comparison
      const resultArray = new Uint8Array(result);
      const resultHex = Array.from(resultArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const expectedHex = 'a26baf5a9a07d9eb7ba10f43924dcdf3f75f0abf066cd9f0c76f983121302e01';
      expect(resultHex).toBe(expectedHex);
    });
  });

  describe('doubleSha256BlockHeaderU8ArrayBytesOf0', () => {
    it('should update nonce and perform double SHA-256 hash on block header', async () => {
      // Arrange
      const blockHeaderAsU8Array = new Uint8Array(80).fill(0); // 80 bytes for block header
      // const nonce = 12345;

      // Act
      const result = await doubleSha256BlockHeaderU8Array(blockHeaderAsU8Array, 0);

      // Assert
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32); // SHA-256 produces 32 bytes

      // Verify that the nonce was updated in the block header
      const nonceBytes = blockHeaderAsU8Array.slice(76, 80);
      const expectedNonceBytes = serializeNonceLE(0);
      expect(nonceBytes).toEqual(expectedNonceBytes);

      // Convert to hex for easier comparison
      const resultHex = Array.from(result)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const expectedHex = '14508459b221041eab257d2baaa7459775ba748246c8403609eb708f0e57e74b';
      expect(resultHex).toBe(expectedHex);
    });
  });

  describe('doubleSha256BlockHeaderU8ArrayBytesOf1', () => {
    it('should update nonce and perform double SHA-256 hash on block header', async () => {
      // Arrange
      const blockHeaderAsU8Array = new Uint8Array(80).fill(0); // 80 bytes for block header
      blockHeaderAsU8Array[0] = 1;
      console.log("blockHeaderAsU8Array", blockHeaderAsU8Array);
      // const nonce = 12345;

      // Act
      const result = await doubleSha256BlockHeaderU8Array(blockHeaderAsU8Array, 0);

      // Assert
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32); // SHA-256 produces 32 bytes

      // Verify that the nonce was updated in the block header
      const nonceBytes = blockHeaderAsU8Array.slice(76, 80);
      const expectedNonceBytes = serializeNonceLE(0);
      expect(nonceBytes).toEqual(expectedNonceBytes);

      // Convert to hex for easier comparison
      const resultHex = Array.from(result)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const expectedHex = '4ddd9f0855d58a375be5a763e5f51ece853d30525fcd9a3e477c2194fedb549f';
      expect(resultHex).toBe(expectedHex);
    });
  });

  describe('doubleSha256BlockHeaderU8Array', () => {
    it('should update nonce and perform double SHA-256 hash on block header', async () => {
      // Arrange
      const blockHeaderAsU8Array = new Uint8Array(80); // 80 bytes for block header
      const nonce = 12345;

      // Act
      const result = await doubleSha256BlockHeaderU8Array(blockHeaderAsU8Array, nonce);

      // Assert
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32); // SHA-256 produces 32 bytes

      // Verify that the nonce was updated in the block header
      const nonceBytes = blockHeaderAsU8Array.slice(76, 80);
      const expectedNonceBytes = serializeNonceLE(nonce);
      expect(nonceBytes).toEqual(expectedNonceBytes);

      // Convert to hex for easier comparison
      const resultHex = Array.from(result)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const expectedHex = '3332e044a659d82c261a4cdedb8bada5bb6531dd3a1807a1a5cb6e0fdd801fdd';
      expect(resultHex).toBe(expectedHex);
    });
  });

});
