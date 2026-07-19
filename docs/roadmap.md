# Roadmap

The roadmap is outcome-focused. Items move only when there is user evidence and a maintainer willing to support them.

## 0.1 — Foundation

- [x] Runtime event collector.
- [x] Automatic Playwright fixture.
- [x] Typed configuration and allowlists.
- [x] Versioned JSON attachment.
- [x] Unit tests, strict build, CI, security policy, and governance.
- [ ] First npm release with provenance.
- [x] Browser-backed integration tests in CI.

## 0.2 — CI ergonomics

- [ ] Optional GitHub Actions annotations.
- [ ] Stable issue fingerprints for historical comparison.
- [ ] Documented reporter integration examples.
- [ ] Test against the oldest and newest supported Playwright versions.

## 0.3 — Multiple pages and contexts

- [ ] Evaluate opt-in BrowserContext monitoring for popup and multi-page flows.
- [ ] Evaluate worker-level configuration without weakening fixture composition.
- [ ] Add practical examples from external adopters.

## 1.0 readiness

- Public API used by independent projects.
- Configuration names validated through user feedback.
- Compatibility policy and deprecation process documented.
- Reproducible releases with provenance and signed tags.
- No known high-severity security issues.

## Non-goals

The project will not become a general website crawler, accessibility engine, performance benchmark, cloud dashboard, or AI remediation service. Integrations with focused tools are preferred to duplicating them.
