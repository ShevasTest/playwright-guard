import { describe, expect, it } from 'vitest';

import { resolveOptions } from '../src/options.js';

describe('resolveOptions', () => {
  it('provides conservative defaults', () => {
    const options = resolveOptions();

    expect(options.console).toMatchObject({ levels: ['error'] });
    expect(options.pageErrors).not.toBe(false);
    expect(options.network).toMatchObject({
      requestFailures: true,
      minStatus: 500,
      maxStatus: 599,
    });
    expect(options).toMatchObject({
      maxIssues: 50,
      deduplicate: true,
      attachReport: true,
      failOnIssues: true,
    });
  });

  it('allows monitors to be disabled', () => {
    const options = resolveOptions({ console: false, pageErrors: false, network: false });

    expect(options.console).toBe(false);
    expect(options.pageErrors).toBe(false);
    expect(options.network).toBe(false);
  });

  it.each([
    [{ maxIssues: 0 }, 'maxIssues'],
    [{ maxIssues: 1.5 }, 'maxIssues'],
    [{ network: { minStatus: 99 } }, 'status range'],
    [{ network: { maxStatus: 600 } }, 'status range'],
    [{ network: { minStatus: 500, maxStatus: 400 } }, 'status range'],
  ] as const)('rejects invalid configuration %#', (input, message) => {
    expect(() => resolveOptions(input)).toThrow(message);
  });
});
