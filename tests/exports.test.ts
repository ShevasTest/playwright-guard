import { describe, expect, it } from 'vitest';

import { createGuardedTest, createRuntimeGuard, PlaywrightGuardError, test } from '../src/index.js';

describe('public exports', () => {
  it('exposes the fixture and runtime APIs', () => {
    expect(createGuardedTest).toBeTypeOf('function');
    expect(createRuntimeGuard).toBeTypeOf('function');
    expect(PlaywrightGuardError).toBeTypeOf('function');
    expect(test).toBeTypeOf('function');
  });
});
