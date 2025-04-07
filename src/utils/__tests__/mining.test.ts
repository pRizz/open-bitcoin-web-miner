import { describe, it, expect } from 'vitest';
import { calculateSecondsToFindBlock, nBitsToTarget, requiredLeadingZeroesToDifficulty, calculateRequiredLeadingBinaryZeroes } from '../mining';

describe('calculateSecondsToFindBlock', () => {
  it('should return Infinity when hash rate is 0', () => {
    const result = calculateSecondsToFindBlock(0, 10, 0.5);
    expect(result).toBe(Infinity);
  });

  it('should return Infinity when hash rate is negative', () => {
    const result = calculateSecondsToFindBlock(-1, 10, 0.5);
    expect(result).toBe(Infinity);
  });

  it('should calculate expected time for 50% confidence', () => {
    const hashRate = 1000; // 1 KH/s
    const requiredZeroes = 10;
    const confidence = 0.5;

    const result = calculateSecondsToFindBlock(hashRate, requiredZeroes, confidence);

    // With 10 required zeroes, probability is 1/2^10
    // For 50% confidence, we need ln(0.5)/ln(1-1/2^10) hashes
    // Then divide by hash rate for time
    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('should scale inversely with hash rate', () => {
    const baseTime = calculateSecondsToFindBlock(1000, 10, 0.5);
    const doubleHashRateTime = calculateSecondsToFindBlock(2000, 10, 0.5);

    // Double hash rate should take half the time
    expect(doubleHashRateTime).toBeCloseTo(baseTime / 2);
  });

  it('should increase with more required zeroes', () => {
    const timeFor10Zeroes = calculateSecondsToFindBlock(1000, 10, 0.5);
    const timeFor11Zeroes = calculateSecondsToFindBlock(1000, 11, 0.5);

    // One more zero should roughly double the time
    expect(timeFor11Zeroes).toBeCloseTo(timeFor10Zeroes * 2);
  });

  it('should handle different confidence levels', () => {
    const time50 = calculateSecondsToFindBlock(1000, 10, 0.5);
    const time95 = calculateSecondsToFindBlock(1000, 10, 0.95);

    // Higher confidence should take longer
    expect(time95).toBeGreaterThan(time50);
  });

  it('should handle extremely large number of zeroes', () => {
    const result = calculateSecondsToFindBlock(1000, 1024, 0.95);
    expect(Number.isFinite(result)).toBe(false);
  });
});

describe('nBitsToTarget', () => {
  it('should convert genesis nBits to correct target', () => {
    // Arrange
    const genesisNBits = 0x1d00ffff;
    
    // Act
    const target = nBitsToTarget(genesisNBits);
    
    // Assert
    expect(target).toBe(BigInt('0x00000000ffff0000000000000000000000000000000000000000000000000000'));
  });
  
  it('should throw error for negative targets', () => {
    // Arrange
    const negativeNBits = 0x1d808000; // Has sign bit set
    
    // Act & Assert
    expect(() => nBitsToTarget(negativeNBits)).toThrow('Negative targets are not allowed.');
  });
  
  // it('should handle different exponent values', () => {
  //   // Arrange
  //   const nBits1 = 0x1d00ffff; // Standard case
  //   const nBits2 = 0x1c00ffff; // One less in exponent
    
  //   // Act
  //   const target1 = nBitsToTarget(nBits1);
  //   const target2 = nBitsToTarget(nBits2);
    
  //   // Assert
  //   expect(target2).toBe(target1 * BigInt(256)); // One less in exponent means 2^8 times larger
  // });
});

// describe('bitsToDifficulty', () => {
//   it('should convert genesis nBits to difficulty of 1', () => {
//     // Arrange
//     const genesisNBits = 0x1d00ffff;
    
//     // Act
//     const difficulty = bitsToDifficulty(genesisNBits);
    
//     // Assert
//     expect(difficulty).toBeCloseTo(1, 10);
//   });
  
//   it('should calculate higher difficulty for smaller targets', () => {
//     // Arrange
//     const genesisNBits = 0x1d00ffff;
//     const harderNBits = 0x1d00ff00; // Smaller coefficient
    
//     // Act
//     const genesisDifficulty = bitsToDifficulty(genesisNBits);
//     const harderDifficulty = bitsToDifficulty(harderNBits);
//     console.log(`genesisDifficulty: ${genesisDifficulty}, harderDifficulty: ${harderDifficulty}`);
    
//     // Assert
//     expect(harderDifficulty).toBeGreaterThan(genesisDifficulty);
//   });
// });

describe('requiredLeadingZeroesToDifficulty', () => {
  it('should convert genesis zero bits to difficulty of 1', () => {
    // Arrange
    const genesisLeadingBinaryZeroes = calculateRequiredLeadingBinaryZeroes(1);
    
    // Act
    const difficulty = requiredLeadingZeroesToDifficulty(genesisLeadingBinaryZeroes);
    
    // Assert
    expect(difficulty).toBeCloseTo(1, 10);
  });
  
  it('should increase difficulty exponentially with more zero bits', () => {
    // Arrange
    const genesisLeadingBinaryZeroes = calculateRequiredLeadingBinaryZeroes(1);
    const moreLeadingBinaryZeroes = genesisLeadingBinaryZeroes + 1;
    
    // Act
    const baseDifficulty = requiredLeadingZeroesToDifficulty(genesisLeadingBinaryZeroes);
    const higherDifficulty = requiredLeadingZeroesToDifficulty(moreLeadingBinaryZeroes);
    
    // Assert
    expect(higherDifficulty).toBeCloseTo(baseDifficulty << 1, 10);
  });
});

describe('calculateRequiredLeadingBinaryZeroes', () => {
  it('should return correct zero bits for difficulty of 1', () => {
    // Arrange
    const difficulty = 1;
    
    // Act
    const requiredLeadingBinaryZeroes = calculateRequiredLeadingBinaryZeroes(difficulty);
    
    // Assert
    expect(requiredLeadingBinaryZeroes).toBeGreaterThan(0);
    expect(requiredLeadingBinaryZeroes).toBeLessThan(256);
  });
  
  it('should increase zero bits with higher difficulty', () => {
    // Arrange
    const difficulty1 = 1;
    const difficulty2 = 2;
    
    // Act
    const zeroBits1 = calculateRequiredLeadingBinaryZeroes(difficulty1);
    const zeroBits2 = calculateRequiredLeadingBinaryZeroes(difficulty2);
    
    // Assert
    expect(zeroBits2).toBeGreaterThan(zeroBits1);
  });
  
  it('should handle very high difficulty values', () => {
    // Arrange
    const highDifficulty = 1e10;
    
    // Act
    const zeroBits = calculateRequiredLeadingBinaryZeroes(highDifficulty);
    
    // Assert
    expect(zeroBits).toBeGreaterThan(0);
    expect(zeroBits).toBeLessThan(256);
  });
});