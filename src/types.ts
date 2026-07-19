import type { ConsoleMessage, Page, Request, Response } from '@playwright/test';

export type ConsoleLevel = ReturnType<ConsoleMessage['type']>;

export type GuardIssueKind = 'console' | 'page-error' | 'request-failure' | 'http-error';

export interface GuardIssue {
  readonly kind: GuardIssueKind;
  readonly message: string;
  readonly timestamp: string;
  readonly url?: string;
  readonly method?: string;
  readonly resourceType?: string;
  readonly status?: number;
  readonly details?: Readonly<Record<string, unknown>>;
}

export type GuardMatcher = string | RegExp | ((issue: GuardIssue) => boolean);

export interface ConsoleGuardOptions {
  /** Console levels that should create an issue. Defaults to `['error']`. */
  readonly levels?: readonly ConsoleLevel[];
  /** Matching issues are treated as expected and ignored. */
  readonly allow?: readonly GuardMatcher[];
}

export interface PageErrorGuardOptions {
  /** Matching uncaught page errors are treated as expected and ignored. */
  readonly allow?: readonly GuardMatcher[];
}

export interface NetworkGuardOptions {
  /** Capture transport-level failures such as DNS errors and timeouts. Defaults to true. */
  readonly requestFailures?: boolean;
  /** Lowest HTTP status that should fail the test. Defaults to 500. */
  readonly minStatus?: number;
  /** Highest HTTP status that should fail the test. Defaults to 599. */
  readonly maxStatus?: number;
  /** Resource types to ignore, for example `image` or `font`. */
  readonly ignoreResourceTypes?: readonly string[];
  /** Matching request failures or HTTP responses are treated as expected and ignored. */
  readonly allow?: readonly GuardMatcher[];
}

export interface PlaywrightGuardOptions {
  /** Console monitoring, or false to disable it. */
  readonly console?: ConsoleGuardOptions | false;
  /** Uncaught browser exception monitoring, or false to disable it. */
  readonly pageErrors?: PageErrorGuardOptions | false;
  /** Request and response monitoring, or false to disable it. */
  readonly network?: NetworkGuardOptions | false;
  /** Stop retaining new issues after this limit. Defaults to 50. */
  readonly maxIssues?: number;
  /** Collapse identical issues. Defaults to true. */
  readonly deduplicate?: boolean;
  /** Attach a JSON report to the Playwright test result. Defaults to true. */
  readonly attachReport?: boolean;
  /** Throw after the test when issues exist. Defaults to true. */
  readonly failOnIssues?: boolean;
}

export interface GuardReport {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly issueCount: number;
  readonly truncatedCount: number;
  readonly issues: readonly GuardIssue[];
}

export interface GuardFixtures {
  /** The active guard, useful when a test needs to inspect issues before teardown. */
  readonly playwrightGuard: RuntimeGuardApi;
}

export interface RuntimeGuardApi {
  readonly issues: readonly GuardIssue[];
  readonly truncatedCount: number;
  start(): RuntimeGuardApi;
  stop(): RuntimeGuardApi;
  report(): GuardReport;
  assertNoIssues(): void;
}

export interface PlaywrightEventSources {
  readonly page: Page;
  readonly request?: Request;
  readonly response?: Response;
}
