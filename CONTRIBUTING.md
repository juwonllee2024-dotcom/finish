# Contributing to FINISH 🤝

Thanks for helping make unfinished work easier to finish.

## Before you start

Read the [README](README.md) and [SECURITY.md](SECURITY.md). The v0.1 boundary matters: no network clients, accounts, model calls, shell execution, silent installs, or irreversible integrations.

## Local workflow

```bash
npm install
npm test
npm run typecheck
npm run build
```

Use a focused test while developing:

```bash
npm test -- tests/extract.test.ts
```

## Adding a phrase rule

1. Add a failing test with the exact input and expected signal.
2. Keep the rule explicit and deterministic.
3. Preserve the original evidence; do not invent a completion claim.
4. Add or update the next-step safety wording.
5. Run the full test, typecheck, and build commands.

## Pull requests

- Explain the user problem in plain language.
- Include tests for behavior and safety boundaries.
- Keep commits small enough to review.
- Do not include real personal data in fixtures or screenshots.
- Update the README or changelog when the user-facing contract changes.

## Design principle

Every feature should make an unfinished loop smaller without taking control away from the person who owns it.
