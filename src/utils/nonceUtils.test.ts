import { describe, it, expect } from 'vitest';
import { nonceToU8Array, u8ArrayToNonce } from './nonceUtils';

describe('nonceToU8Array', () => {
  it('should convert 0 to four zero bytes', () => {
    // Arrange
    const nonce = 0;

    // Act
    const result = nonceToU8Array(nonce);

    // Assert
    expect(Array.from(result)).toEqual([0, 0, 0, 0]);
  });

  it('should convert max u32 to correct byte array', () => {
    // Arrange
    const nonce = 0xFFFFFFFF;

    // Act
    const result = nonceToU8Array(nonce);

    // Assert
    expect(Array.from(result)).toEqual([255, 255, 255, 255]);
  });

  it('should convert a typical value correctly in big-endian', () => {
    // Arrange
    const nonce = 0x12345678;

    // Act
    const result = nonceToU8Array(nonce);

    // Assert
    expect(Array.from(result)).toEqual([0x12, 0x34, 0x56, 0x78]);
  });

  it('should throw error for negative numbers', () => {
    // Arrange
    const nonce = -1;

    // Act & Assert
    expect(() => nonceToU8Array(nonce)).toThrow('Nonce must be a positive integer between 0 and 2^32-1');
  });

  it('should throw error for numbers above u32 max', () => {
    // Arrange
    const nonce = 0xFFFFFFFF + 1;

    // Act & Assert
    expect(() => nonceToU8Array(nonce)).toThrow('Nonce must be a positive integer between 0 and 2^32-1');
  });
});

describe('u8ArrayToNonce', () => {
  it('should convert four zero bytes to 0', () => {
    // Arrange
    const bytes = new Uint8Array([0, 0, 0, 0]);

    // Act
    const result = u8ArrayToNonce(bytes);

    // Assert
    expect(result).toBe(0);
  });

  it('should convert max value bytes correctly', () => {
    // Arrange
    const bytes = new Uint8Array([255, 255, 255, 255]);

    // Act
    const result = u8ArrayToNonce(bytes);

    // Assert
    expect(result).toBe(0xFFFFFFFF);
  });

  it('should convert a typical value correctly in big-endian', () => {
    // Arrange
    const bytes = new Uint8Array([0x12, 0x34, 0x56, 0x78]);

    // Act
    const result = u8ArrayToNonce(bytes);

    // Assert
    expect(result).toBe(0x12345678);
  });

  it('should throw error for wrong array length', () => {
    // Arrange
    const bytes = new Uint8Array([1, 2, 3]);

    // Act & Assert
    expect(() => u8ArrayToNonce(bytes)).toThrow('Input must be exactly 4 bytes');
  });
});

describe('roundtrip conversion', () => {
  it('should preserve value when converting back and forth', () => {
    // Arrange
    const originalNonce = 0x12345678;

    // Act
    const bytes = nonceToU8Array(originalNonce);
    const resultNonce = u8ArrayToNonce(bytes);

    // Assert
    expect(resultNonce).toBe(originalNonce);
  });
});