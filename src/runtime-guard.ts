import type { ConsoleMessage, Page, Request, Response } from '@playwright/test';

import { PlaywrightGuardError } from './error.js';
import { isAllowed } from './matcher.js';
import { resolveOptions, type ResolvedGuardOptions } from './options.js';
import type { GuardIssue, GuardReport, PlaywrightGuardOptions, RuntimeGuardApi } from './types.js';

function safePageUrl(page: Page): string | undefined {
  try {
    const url = page.url();
    return url || undefined;
  } catch {
    return undefined;
  }
}

function fingerprint(issue: GuardIssue): string {
  return [
    issue.kind,
    issue.message,
    issue.url,
    issue.method,
    issue.resourceType,
    issue.status,
  ].join('|');
}

export class RuntimeGuard implements RuntimeGuardApi {
  readonly #page: Page;
  readonly #options: ResolvedGuardOptions;
  readonly #issues: GuardIssue[] = [];
  readonly #fingerprints = new Set<string>();
  #truncatedCount = 0;
  #started = false;

  public constructor(page: Page, options: PlaywrightGuardOptions = {}) {
    this.#page = page;
    this.#options = resolveOptions(options);
  }

  public get issues(): readonly GuardIssue[] {
    return this.#issues;
  }

  public get truncatedCount(): number {
    return this.#truncatedCount;
  }

  public start(): this {
    if (this.#started) return this;

    if (this.#options.console !== false) this.#page.on('console', this.#onConsole);
    if (this.#options.pageErrors !== false) this.#page.on('pageerror', this.#onPageError);
    if (this.#options.network !== false) {
      if (this.#options.network.requestFailures) {
        this.#page.on('requestfailed', this.#onRequestFailed);
      }
      this.#page.on('response', this.#onResponse);
    }

    this.#started = true;
    return this;
  }

  public stop(): this {
    if (!this.#started) return this;

    if (this.#options.console !== false) this.#page.off('console', this.#onConsole);
    if (this.#options.pageErrors !== false) this.#page.off('pageerror', this.#onPageError);
    if (this.#options.network !== false) {
      if (this.#options.network.requestFailures) {
        this.#page.off('requestfailed', this.#onRequestFailed);
      }
      this.#page.off('response', this.#onResponse);
    }

    this.#started = false;
    return this;
  }

  public report(): GuardReport {
    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      issueCount: this.#issues.length,
      truncatedCount: this.#truncatedCount,
      issues: [...this.#issues],
    };
  }

  public assertNoIssues(): void {
    if (this.#options.failOnIssues && (this.#issues.length > 0 || this.#truncatedCount > 0)) {
      throw new PlaywrightGuardError(this.report());
    }
  }

  readonly #onConsole = (message: ConsoleMessage): void => {
    const config = this.#options.console;
    if (config === false || !config.levels.includes(message.type())) return;

    const location = message.location();
    const issue: GuardIssue = {
      kind: 'console',
      message: message.text(),
      timestamp: new Date().toISOString(),
      ...(location.url ? { url: location.url } : {}),
      details: {
        level: message.type(),
        lineNumber: location.lineNumber,
        columnNumber: location.columnNumber,
      },
    };

    if (!isAllowed(issue, config.allow)) this.#record(issue);
  };

  readonly #onPageError = (error: Error): void => {
    const config = this.#options.pageErrors;
    if (config === false) return;

    const url = safePageUrl(this.#page);
    const issue: GuardIssue = {
      kind: 'page-error',
      message: error.message,
      timestamp: new Date().toISOString(),
      ...(url ? { url } : {}),
      ...(error.stack ? { details: { stack: error.stack } } : {}),
    };

    if (!isAllowed(issue, config.allow)) this.#record(issue);
  };

  readonly #onRequestFailed = (request: Request): void => {
    const config = this.#options.network;
    if (config === false) return;

    const resourceType = request.resourceType();
    if (config.ignoreResourceTypes.includes(resourceType)) return;

    const failure = request.failure();
    const issue: GuardIssue = {
      kind: 'request-failure',
      message: failure?.errorText ?? 'Request failed without an error message',
      timestamp: new Date().toISOString(),
      url: request.url(),
      method: request.method(),
      resourceType,
    };

    if (!isAllowed(issue, config.allow)) this.#record(issue);
  };

  readonly #onResponse = (response: Response): void => {
    const config = this.#options.network;
    if (config === false) return;

    const status = response.status();
    if (status < config.minStatus || status > config.maxStatus) return;

    const request = response.request();
    const resourceType = request.resourceType();
    if (config.ignoreResourceTypes.includes(resourceType)) return;

    const issue: GuardIssue = {
      kind: 'http-error',
      message: response.statusText() || `HTTP ${status}`,
      timestamp: new Date().toISOString(),
      url: response.url(),
      method: request.method(),
      resourceType,
      status,
    };

    if (!isAllowed(issue, config.allow)) this.#record(issue);
  };

  #record(issue: GuardIssue): void {
    const key = fingerprint(issue);
    if (this.#options.deduplicate && this.#fingerprints.has(key)) return;

    if (this.#issues.length >= this.#options.maxIssues) {
      this.#truncatedCount += 1;
      return;
    }

    this.#fingerprints.add(key);
    this.#issues.push(issue);
  }
}

export function createRuntimeGuard(page: Page, options: PlaywrightGuardOptions = {}): RuntimeGuard {
  return new RuntimeGuard(page, options);
}
