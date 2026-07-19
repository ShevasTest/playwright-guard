import { describe, expect, it, vi } from 'vitest';

import { PlaywrightGuardError } from '../src/error.js';
import { RuntimeGuard } from '../src/runtime-guard.js';
import { consoleMessage, FakePage, request, response } from './fakes.js';

describe('RuntimeGuard', () => {
  it('captures console errors but ignores other console levels by default', () => {
    const page = new FakePage();
    const guard = new RuntimeGuard(page.asPage()).start();

    page.emit('console', consoleMessage('informational', 'info'));
    page.emit('console', consoleMessage('broken application'));

    expect(guard.issues).toHaveLength(1);
    expect(guard.issues[0]).toMatchObject({
      kind: 'console',
      message: 'broken application',
      url: 'https://example.test/app.js',
    });
  });

  it('captures uncaught page errors', () => {
    const page = new FakePage();
    const guard = new RuntimeGuard(page.asPage()).start();

    page.emit('pageerror', new Error('hydration crashed'));

    expect(guard.issues[0]).toMatchObject({
      kind: 'page-error',
      message: 'hydration crashed',
      url: page.currentUrl,
    });
  });

  it('captures request failures and server errors', () => {
    const page = new FakePage();
    const guard = new RuntimeGuard(page.asPage()).start();

    page.emit('requestfailed', request());
    page.emit('response', response(503));
    page.emit('response', response(404));

    expect(guard.issues).toHaveLength(2);
    expect(guard.issues.map((issue) => issue.kind)).toEqual(['request-failure', 'http-error']);
  });

  it('uses safe fallback messages when Playwright omits optional error details', () => {
    const page = new FakePage();
    const guard = new RuntimeGuard(page.asPage()).start();

    page.emit('requestfailed', request('https://example.test/no-detail', 'fetch', null));
    page.emit('response', response(500, 'https://example.test/no-status-text', 'fetch', 'GET', ''));

    expect(guard.issues[0]?.message).toBe('Request failed without an error message');
    expect(guard.issues[1]?.message).toBe('HTTP 500');
  });

  it('records page errors even when the page URL is unavailable', () => {
    const page = new FakePage();
    vi.spyOn(page, 'url').mockImplementation(() => {
      throw new Error('page is closed');
    });
    const guard = new RuntimeGuard(page.asPage()).start();

    page.emit('pageerror', new Error('late page error'));

    expect(guard.issues[0]).toMatchObject({ kind: 'page-error', message: 'late page error' });
    expect(guard.issues[0]).not.toHaveProperty('url');
  });

  it('supports 4xx monitoring and resource-type exclusions', () => {
    const page = new FakePage();
    const guard = new RuntimeGuard(page.asPage(), {
      network: { minStatus: 400, ignoreResourceTypes: ['image'] },
    }).start();

    page.emit('response', response(404, 'https://example.test/missing', 'document'));
    page.emit('response', response(500, 'https://example.test/logo.png', 'image'));

    expect(guard.issues).toHaveLength(1);
    expect(guard.issues[0]).toMatchObject({ status: 404, resourceType: 'document' });
  });

  it('supports string, regular-expression, and predicate allowlists', () => {
    const page = new FakePage();
    const guard = new RuntimeGuard(page.asPage(), {
      console: { levels: ['error', 'warning'], allow: ['ResizeObserver', /third-party/u] },
      pageErrors: { allow: [(issue) => issue.message === 'expected crash'] },
      network: { allow: ['/health'] },
    }).start();

    page.emit('console', consoleMessage('ResizeObserver loop completed'));
    page.emit('console', consoleMessage('third-party warning', 'warning'));
    page.emit('pageerror', new Error('expected crash'));
    page.emit('response', response(503, 'https://example.test/health'));

    expect(guard.issues).toHaveLength(0);
  });

  it('deduplicates identical issues by default and can retain duplicates', () => {
    const page = new FakePage();
    const deduplicated = new RuntimeGuard(page.asPage()).start();

    page.emit('console', consoleMessage('same error'));
    page.emit('console', consoleMessage('same error'));
    expect(deduplicated.issues).toHaveLength(1);
    deduplicated.stop();

    const all = new RuntimeGuard(page.asPage(), { deduplicate: false }).start();
    page.emit('console', consoleMessage('same error'));
    page.emit('console', consoleMessage('same error'));
    expect(all.issues).toHaveLength(2);
  });

  it('limits retained issues and reports truncation', () => {
    const page = new FakePage();
    const guard = new RuntimeGuard(page.asPage(), {
      maxIssues: 1,
      deduplicate: false,
    }).start();

    page.emit('console', consoleMessage('first'));
    page.emit('console', consoleMessage('second'));

    expect(guard.issues).toHaveLength(1);
    expect(guard.truncatedCount).toBe(1);
    expect(guard.report()).toMatchObject({ issueCount: 1, truncatedCount: 1, schemaVersion: 1 });
  });

  it('stops monitoring cleanly and is idempotent', () => {
    const page = new FakePage();
    const guard = new RuntimeGuard(page.asPage()).start().start().stop().stop();

    page.emit('console', consoleMessage('too late'));

    expect(guard.issues).toHaveLength(0);
  });

  it('throws a structured error when issues exist', () => {
    const page = new FakePage();
    const guard = new RuntimeGuard(page.asPage()).start();
    page.emit('response', response(500, 'https://example.test/api/checkout'));

    expect(() => guard.assertNoIssues()).toThrowError(PlaywrightGuardError);

    try {
      guard.assertNoIssues();
    } catch (error) {
      expect(error).toBeInstanceOf(PlaywrightGuardError);
      expect((error as PlaywrightGuardError).message).toContain('HTTP 500');
      expect((error as PlaywrightGuardError).report.issueCount).toBe(1);
    }
  });

  it('supports observation-only mode', () => {
    const page = new FakePage();
    const guard = new RuntimeGuard(page.asPage(), { failOnIssues: false }).start();
    page.emit('console', consoleMessage('recorded but tolerated'));

    expect(() => guard.assertNoIssues()).not.toThrow();
    expect(guard.issues).toHaveLength(1);
  });
});
