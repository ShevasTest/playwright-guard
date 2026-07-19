# Contributing

Thank you for helping make Playwright Guard more reliable.

## Before opening a change

- Search existing issues and discussions.
- For a behavior change or new public API, open an issue first so the design can be agreed before implementation.
- Keep changes focused. Unrelated refactors make review and release notes harder.

## Local development

Requirements: Node.js 20 or newer and npm 10 or newer.

```bash
git clone https://github.com/ShevasTest/playwright-guard.git
cd playwright-guard
npm ci
npm run validate
```

Useful commands:

```bash
npm run test:watch
npm run typecheck
npm run lint
npm run format
npm run build
```

## Pull requests

- Add or update tests for every behavior change.
- Keep the public API typed and documented.
- Add an entry under `Unreleased` in `CHANGELOG.md` for user-visible changes.
- Do not lower test coverage thresholds to make a change pass.
- Avoid adding runtime dependencies unless the benefit clearly justifies supply-chain cost.
- Confirm `npm run validate` passes before requesting review.

Maintainers may ask to split a large pull request. Reviews focus on correctness, compatibility, security, maintenance cost, and whether the behavior belongs in this focused library.

## Commits

Clear, imperative commit subjects are preferred, for example:

```text
Add allowlist matcher for resource type
Fix duplicate response fingerprints
Document HTTP 4xx configuration
```

## Reporting security issues

Do not open public issues for vulnerabilities. Follow [SECURITY.md](SECURITY.md).
