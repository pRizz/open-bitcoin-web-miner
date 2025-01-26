import { describe, it, expect } from 'vitest';
import { calculateExpectedBlockTime } from '../mining';

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