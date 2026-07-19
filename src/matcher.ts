import type { GuardIssue, GuardMatcher } from './types.js';

function searchableText(issue: GuardIssue): string {
  return [issue.kind, issue.message, issue.url, issue.method, issue.resourceType, issue.status]
    .filter((value) => value !== undefined)
    .join(' ');
}

export function matches(issue: GuardIssue, matcher: GuardMatcher): boolean {
  if (typeof matcher === 'function') {
    return matcher(issue);
  }

  const text = searchableText(issue);

  if (typeof matcher === 'string') {
    return text.toLocaleLowerCase().includes(matcher.toLocaleLowerCase());
  }

  matcher.lastIndex = 0;
  return matcher.test(text);
}

export function isAllowed(issue: GuardIssue, allow: readonly GuardMatcher[] | undefined): boolean {
  return allow?.some((matcher) => matches(issue, matcher)) ?? false;
}
