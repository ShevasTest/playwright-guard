# Playwright Guard

[![CI](https://github.com/ShevasTest/playwright-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/ShevasTest/playwright-guard/actions/workflows/ci.yml)
[![CodeQL](https://github.com/ShevasTest/playwright-guard/actions/workflows/codeql.yml/badge.svg)](https://github.com/ShevasTest/playwright-guard/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/ShevasTest/playwright-guard/badge)](https://securityscorecards.dev/viewer/?uri=github.com/ShevasTest/playwright-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Make invisible browser failures fail the test.**

Playwright Guard is a small, typed Playwright fixture that catches failures a normal UI assertion can miss:

- unexpected `console.error` messages;
- uncaught browser exceptions (`pageerror`);
- transport failures such as DNS errors, refused connections, and timeouts;
- unexpected HTTP error responses;
- duplicate error storms, without flooding the test report.

It fails the current Playwright test at teardown and attaches a structured JSON report for CI systems and debugging.

## Why

A page can render its heading and still be broken. A background request may return 500, hydration may throw after the first paint, or the browser console may contain an error that no assertion observes. Teams often copy event-listener snippets into every test suite; those snippets vary, miss cleanup, and produce inconsistent reports.

Playwright Guard turns that repeated setup into one reusable dependency with conservative defaults and explicit allowlists.

## Status

The project is in public preview (`0.x`). The API is tested and usable, but minor releases may refine configuration names before `1.0.0`. The first npm publication is tracked in the project roadmap. Until then, install the verified package artifact from the GitHub release.

## Quick start

Public preview release:

```bash
npm install --save-dev https://github.com/ShevasTest/playwright-guard/releases/download/v0.1.0/playwright-guard-0.1.0.tgz
```

After the first npm publication, the shorter command will be:

```bash
npm install --save-dev playwright-guard
```

Use the preconfigured `test` export:

```ts
import { expect, test } from 'playwright-guard';

test('checkout is healthy', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
});
```

With no configuration, the test fails on:

- console messages with level `error`;
- uncaught page exceptions;
- transport-level request failures;
- HTTP responses from 500 through 599.

HTTP 4xx responses are not failures by default because many applications intentionally exercise authentication, validation, and not-found paths.

## Add Guard to an existing fixture stack

```ts
// tests/fixtures.ts
import { test as base } from '@playwright/test';
import { createGuardedTest } from 'playwright-guard';

export const test = createGuardedTest(base, {
  console: {
    levels: ['error', 'warning'],
    allow: [/ResizeObserver loop/u],
  },
  network: {
    minStatus: 400,
    ignoreResourceTypes: ['image', 'font'],
    allow: [(issue) => issue.status === 404 && issue.url?.endsWith('/optional-feature') === true],
  },
});

export { expect } from 'playwright-guard';
```

Import that `test` object in your specs. The guard is an automatic boxed fixture, so test bodies do not need to request it explicitly.

## Configuration

```ts
export interface PlaywrightGuardOptions {
  console?:
    | false
    | {
        levels?: ConsoleLevel[]; // default: ['error']
        allow?: GuardMatcher[];
      };
  pageErrors?:
    | false
    | {
        allow?: GuardMatcher[];
      };
  network?:
    | false
    | {
        requestFailures?: boolean; // default: true
        minStatus?: number; // default: 500
        maxStatus?: number; // default: 599
        ignoreResourceTypes?: string[];
        allow?: GuardMatcher[];
      };
  maxIssues?: number; // default: 50
  deduplicate?: boolean; // default: true
  attachReport?: boolean; // default: true
  failOnIssues?: boolean; // default: true
}
```

Each matcher can be:

- a case-insensitive substring matched against the issue fields;
- a regular expression;
- a predicate `(issue) => boolean` for precise decisions.

Keep allowlists narrow. Prefer a URL plus status predicate to a broad string such as `404`.

## Runtime API

The fixture is the recommended integration, but library authors can monitor a `Page` directly:

```ts
import { createRuntimeGuard } from 'playwright-guard';

const guard = createRuntimeGuard(page, { failOnIssues: false }).start();

// Drive the page with Playwright.

guard.stop();
console.log(guard.report());
guard.assertNoIssues(); // no-op here because failOnIssues is false
```

## JSON report

When a test records an issue, the fixture attaches `playwright-guard.json`:

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-07-19T12:00:00.000Z",
  "issueCount": 1,
  "truncatedCount": 0,
  "issues": [
    {
      "kind": "http-error",
      "message": "Internal Server Error",
      "timestamp": "2026-07-19T11:59:59.000Z",
      "url": "https://example.com/api/orders",
      "method": "POST",
      "resourceType": "fetch",
      "status": 500
    }
  ]
}
```

The schema is versioned so reporters and CI integrations can consume it safely.

## What this project does not do

Playwright Guard does not replace assertions, accessibility auditing, visual comparison, Lighthouse, or a full observability platform. It provides one focused primitive: detecting browser runtime failures during tests and reporting them consistently.

## Project quality

- strict TypeScript and dual ESM/CommonJS builds;
- unit tests with enforced coverage thresholds;
- pinned GitHub Actions dependencies;
- CodeQL, Dependabot, and OpenSSF Scorecard workflows;
- documented security reporting and governance;
- small runtime surface with no production dependency besides the Playwright peer.

See [Architecture](docs/architecture.md), [Roadmap](docs/roadmap.md), and [Contributing](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2026 ShevasTest contributors.
