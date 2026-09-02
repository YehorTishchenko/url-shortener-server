import { describe, it, expect } from 'vitest';
import { generateCode } from './generate-code.ts';

describe('generateCode', () => {
  it('generates an 8-character code by default', () => {
    expect(generateCode()).toHaveLength(8);
  });

  it('only uses alphanumeric characters', () => {
    expect(generateCode(50)).toMatch(/^[0-9A-Za-z]+$/);
  });

  it('supports a custom length', () => {
    expect(generateCode(15)).toHaveLength(15);
  });

  it('generates different codes on each call', () => {
    const codes = new Set(Array.from({ length: 1000 }, () => generateCode()));
    expect(codes.size).toBe(1000);
  });
});
