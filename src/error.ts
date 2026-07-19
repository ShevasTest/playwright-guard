import type { GuardIssue, GuardReport } from './types.js';

function issueLine(issue: GuardIssue): string {
  const metadata = [
    issue.status === undefined ? undefined : `HTTP ${issue.status}`,
    issue.method,
    issue.resourceType,
    issue.url,
  ]
    .filter(Boolean)
    .join(' · ');

  return `- [${issue.kind}] ${issue.message}${metadata ? ` (${metadata})` : ''}`;
}

export function formatGuardFailure(report: GuardReport): string {
  const shown = report.issues.slice(0, 10);
  const hidden = report.issueCount - shown.length + report.truncatedCount;
  const suffix = hidden > 0 ? `\n… and ${hidden} additional issue${hidden === 1 ? '' : 's'}.` : '';

  return (
    [
      `Playwright Guard found ${report.issueCount + report.truncatedCount} unexpected browser issue${
        report.issueCount + report.truncatedCount === 1 ? '' : 's'
      }:`,
      ...shown.map(issueLine),
    ].join('\n') + suffix
  );
}

export class PlaywrightGuardError extends Error {
  public readonly report: GuardReport;

  public constructor(report: GuardReport) {
    super(formatGuardFailure(report));
    this.name = 'PlaywrightGuardError';
    this.report = report;
  }
}
