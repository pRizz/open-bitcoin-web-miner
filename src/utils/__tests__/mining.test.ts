import { describe, it, expect } from 'vitest';
import { calculateExpectedBlockTime } from '../mining';
import { 
  expectedTimeToFindHash1, 
  expectedTimeToFindHash2 
} from '../mining';

describe('calculateExpectedBlockTime', () => {
  it('should return Infinity when hash rate is 0', () => {
    const result = calculateExpectedBlockTime(0, 10, 0.5);
    expect(result).toBe(Infinity);
  });

  it('should return Infinity when hash rate is negative', () => {
    const result = calculateExpectedBlockTime(-1, 10, 0.5);
    expect(result).toBe(Infinity);
  });

  it('should calculate expected time for 50% confidence', () => {
    const hashRate = 1000; // 1 KH/s
    const requiredZeroes = 10;
    const confidence = 0.5;
    
    const result = calculateExpectedBlockTime(hashRate, requiredZeroes, confidence);
    
    // With 10 required zeroes, probability is 1/2^10
    // For 50% confidence, we need ln(0.5)/ln(1-1/2^10) hashes
    // Then divide by hash rate for time
    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('should scale inversely with hash rate', () => {
    const baseTime = calculateExpectedBlockTime(1000, 10, 0.5);
    const doubleHashRateTime = calculateExpectedBlockTime(2000, 10, 0.5);
    
    // Double hash rate should take half the time
    expect(doubleHashRateTime).toBeCloseTo(baseTime / 2);
  });

  it('should increase with more required zeroes', () => {
    const timeFor10Zeroes = calculateExpectedBlockTime(1000, 10, 0.5);
    const timeFor11Zeroes = calculateExpectedBlockTime(1000, 11, 0.5);
    
    // One more zero should roughly double the time
    expect(timeFor11Zeroes).toBeCloseTo(timeFor10Zeroes * 2);
  });

  it('should handle different confidence levels', () => {
    const time50 = calculateExpectedBlockTime(1000, 10, 0.5);
    const time95 = calculateExpectedBlockTime(1000, 10, 0.95);
    
    // Higher confidence should take longer
    expect(time95).toBeGreaterThan(time50);
  });
});

describe('expectedTimeToFindHash1', () => {
  it('should return Infinity when probability is effectively zero', () => {
    const result = expectedTimeToFindHash1(1000, 1024, 0.95);
    expect(result).toBe(Infinity);
  });

  it('should calculate expected time correctly for reasonable values', () => {
    const result = expectedTimeToFindHash1(1000, 10, 0.95);
    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('should return larger times for higher confidence levels', () => {
    const timeAt95 = expectedTimeToFindHash1(1000, 10, 0.95);
    const timeAt99 = expectedTimeToFindHash1(1000, 10, 0.99);
    console.log(`timeAt99: ${timeAt99}, timeAt95: ${timeAt95}`);
    expect(timeAt99).toBeGreaterThan(timeAt95);
  });

  it('should return larger times for more zeroes', () => {
    const timeFor10 = expectedTimeToFindHash1(1000, 10, 0.95);
    const timeFor11 = expectedTimeToFindHash1(1000, 11, 0.95);
    console.log(`timeFor11: ${timeFor11}, timeFor10: ${timeFor10}`);
    expect(timeFor11).toBeGreaterThan(timeFor10);
  });

  it('should return smaller times for higher hash rates', () => {
    const timeLowRate = expectedTimeToFindHash1(1000, 10, 0.95);
    const timeHighRate = expectedTimeToFindHash1(2000, 10, 0.95);
    console.log(`timeHighRate: ${timeHighRate}, timeLowRate: ${timeLowRate}`);
    expect(timeHighRate).toBeLessThan(timeLowRate);
  });
});

describe('expectedTimeToFindHash2', () => {
  // fails; FIXME
  it('should return Infinity for extremely small probabilities', () => {
    const result = expectedTimeToFindHash2(1000, 1024, 0.95);
    expect(result).toBe(Infinity);
  });

  it('should calculate expected time correctly for reasonable values', () => {
    const result = expectedTimeToFindHash2(1000, 10, 0.95);
    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('should return larger times for higher confidence levels', () => {
    const timeAt95 = expectedTimeToFindHash2(1000, 10, 0.95);
    const timeAt99 = expectedTimeToFindHash2(1000, 10, 0.99);
    expect(timeAt99).toBeGreaterThan(timeAt95);
  });

  it('should return larger times for more zeroes', () => {
    const timeFor10 = expectedTimeToFindHash2(1000, 10, 0.95);
    const timeFor11 = expectedTimeToFindHash2(1000, 11, 0.95);
    expect(timeFor11).toBeGreaterThan(timeFor10);
  });

  it('should return smaller times for higher hash rates', () => {
    const timeLowRate = expectedTimeToFindHash2(1000, 10, 0.95);
    const timeHighRate = expectedTimeToFindHash2(2000, 10, 0.95);
    expect(timeHighRate).toBeLessThan(timeLowRate);
  });

  it('both implementations should give similar results', () => {
    const time1 = expectedTimeToFindHash1(1000, 10, 0.95);
    const time2 = expectedTimeToFindHash2(1000, 10, 0.95);
    const relativeError = Math.abs(time1 - time2) / time1;
    expect(relativeError).toBeLessThan(0.01); // Less than 1% difference
  });
});