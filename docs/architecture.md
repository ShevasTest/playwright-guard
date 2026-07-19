# Architecture

Playwright Guard deliberately has a small architecture.

## Data flow

```text
Playwright Page events
        │
        ▼
  RuntimeGuard listeners
        │
        ├── normalize into GuardIssue
        ├── apply resource filters and allowlists
        ├── deduplicate and limit retention
        ▼
     GuardReport
        │
        ├── JSON attachment
        └── PlaywrightGuardError at fixture teardown
```

## Modules

- `runtime-guard.ts` owns event listeners and issue retention.
- `matcher.ts` implements allowlist matching without external dependencies.
- `options.ts` validates and resolves conservative defaults.
- `fixture.ts` integrates the runtime guard as an automatic Playwright fixture.
- `error.ts` produces a compact failure and exposes a structured error object.

## Design choices

### Fail at teardown

Browser events are asynchronous. Failing immediately inside an event listener can create unhandled errors and hide the original test result. The guard records issues and asserts during fixture teardown, when Playwright can associate the error and attachment with the correct test.

### HTTP 5xx by default

Tests commonly exercise expected 4xx responses. Server errors are a safer zero-configuration signal. Projects that need a stricter gate can set `minStatus: 400` and add narrow allowlist predicates.

### No runtime utility dependencies

Matching, deduplication, and formatting are intentionally implemented in the package. This reduces install size and supply-chain exposure. `@playwright/test` remains a peer dependency so consumers control the browser-testing version.

### Versioned report schema

The JSON report includes `schemaVersion`. Future reporters can reject or adapt incompatible schemas instead of silently misreading output.
