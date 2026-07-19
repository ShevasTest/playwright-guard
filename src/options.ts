import type { PlaywrightGuardOptions } from './types.js';

export interface ResolvedGuardOptions {
  readonly console:
    | false
    | {
        readonly levels: readonly string[];
        readonly allow: NonNullable<Exclude<PlaywrightGuardOptions['console'], false>>['allow'];
      };
  readonly pageErrors:
    | false
    | {
        readonly allow: NonNullable<Exclude<PlaywrightGuardOptions['pageErrors'], false>>['allow'];
      };
  readonly network:
    | false
    | {
        readonly requestFailures: boolean;
        readonly minStatus: number;
        readonly maxStatus: number;
        readonly ignoreResourceTypes: readonly string[];
        readonly allow: NonNullable<Exclude<PlaywrightGuardOptions['network'], false>>['allow'];
      };
  readonly maxIssues: number;
  readonly deduplicate: boolean;
  readonly attachReport: boolean;
  readonly failOnIssues: boolean;
}

export function resolveOptions(options: PlaywrightGuardOptions = {}): ResolvedGuardOptions {
  if (
    options.maxIssues !== undefined &&
    (!Number.isInteger(options.maxIssues) || options.maxIssues < 1)
  ) {
    throw new RangeError('playwright-guard: maxIssues must be a positive integer.');
  }

  const minStatus = options.network === false ? 500 : (options.network?.minStatus ?? 500);
  const maxStatus = options.network === false ? 599 : (options.network?.maxStatus ?? 599);

  if (minStatus < 100 || maxStatus > 599 || minStatus > maxStatus) {
    throw new RangeError(
      'playwright-guard: network status range must be between 100 and 599, with minStatus <= maxStatus.',
    );
  }

  return {
    console:
      options.console === false
        ? false
        : {
            levels: options.console?.levels ?? ['error'],
            allow: options.console?.allow,
          },
    pageErrors:
      options.pageErrors === false
        ? false
        : {
            allow: options.pageErrors?.allow,
          },
    network:
      options.network === false
        ? false
        : {
            requestFailures: options.network?.requestFailures ?? true,
            minStatus,
            maxStatus,
            ignoreResourceTypes: options.network?.ignoreResourceTypes ?? [],
            allow: options.network?.allow,
          },
    maxIssues: options.maxIssues ?? 50,
    deduplicate: options.deduplicate ?? true,
    attachReport: options.attachReport ?? true,
    failOnIssues: options.failOnIssues ?? true,
  };
}
