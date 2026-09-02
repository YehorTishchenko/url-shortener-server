import { describe, it, expect, vi } from 'vitest';
import { createShortCode, CodeGenerationError } from './create-short-code.ts';

describe('createShortCode', () => {
  it('returns the generated code on the first successful insert', async () => {
    const insert = vi.fn().mockResolvedValue(undefined);
    const isCollision = vi.fn().mockReturnValue(false);

    const code = await createShortCode(insert, isCollision);

    expect(typeof code).toBe('string');
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith(code);
  });

  it('retries with a new code when insert reports a collision', async () => {
    const insert = vi.fn()
      .mockRejectedValueOnce(new Error('collision'))
      .mockResolvedValueOnce(undefined);
    const isCollision = vi.fn().mockReturnValue(true);

    const code = await createShortCode(insert, isCollision);

    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert).toHaveBeenLastCalledWith(code);
  });

  it('rethrows immediately on a non-collision error', async () => {
    const boom = new Error('connection lost');
    const insert = vi.fn().mockRejectedValue(boom);
    const isCollision = vi.fn().mockReturnValue(false);

    await expect(createShortCode(insert, isCollision)).rejects.toBe(boom);
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('gives up after maxAttempts collisions', async () => {
    const insert = vi.fn().mockRejectedValue(new Error('collision'));
    const isCollision = vi.fn().mockReturnValue(true);

    await expect(createShortCode(insert, isCollision, 3)).rejects.toBeInstanceOf(CodeGenerationError);
    expect(insert).toHaveBeenCalledTimes(3);
  });
});
