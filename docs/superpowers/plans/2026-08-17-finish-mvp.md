# FINISH MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first CLI that turns everyday text into a reviewable completion plan with next actions, deadlines, approval boundaries, and shareable reports.

**Architecture:** Pure TypeScript pipeline for extraction, planning, and rendering; thin CLI adapter; no runtime network or side effects. JSON is the canonical format, Markdown and self-contained HTML are views.

**Tech Stack:** Node.js 20+, TypeScript, Vitest, tsup, Commander-free argument parsing, zero runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-08-17-finish-mvp-design.md`

## Global Constraints

- Node.js version floor: `>=20`.
- Runtime dependencies: none.
- Input: user-provided text or Markdown only.
- Network, accounts, models, shell execution, payments, bookings, messages, and submissions: prohibited in v0.1.
- Irreversible actions: always represented as `approval_required`.
- Workspace path traversal and symlink escapes: reject.
- Every production behavior: test-first, with a verified RED run before implementation.
- Generated output: deterministic, reviewable, and free of user secrets in logs.

## File map

- Create: `package.json`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`, `.gitignore`
- Create: `src/domain.ts` — shared plan and extraction types
- Create: `src/extract.ts` — deterministic action and deadline extraction
- Create: `src/plan.ts` — safe plan derivation and summaries
- Create: `src/render.ts` — Markdown and dependency-free HTML rendering
- Create: `src/io.ts` — guarded local input/output helpers
- Create: `src/cli.ts` — command-line adapter and exit codes
- Create: `tests/extract.test.ts`, `tests/plan.test.ts`, `tests/render.test.ts`, `tests/io.test.ts`, `tests/cli.test.ts`
- Create: `README.md`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`
- Create: `examples/bill-and-return.txt`, `examples/demo-plan.json`
- Create: `.github/workflows/ci.yml`
- Create: `docs/verification/v0.1-smoke.md`

### Task 1: Scaffold a clean TypeScript package

**Files:** package metadata and TypeScript/Vitest configuration listed in the file map.

**Interfaces:** Produces `npm test`, `npm run typecheck`, `npm run build`, and `finish --help` entry points for later tasks.

- [ ] **Step 1: Create package metadata and configuration.** Use package name `finish`, version `0.1.0`, Node engine `>=20`, `bin.finish = ./dist/cli.js`, scripts `typecheck`, `test`, `build`, and `lint`.
- [ ] **Step 2: Install development dependencies and verify configuration.** Run `npm install`, `npm run typecheck`, and `npm run build`; `npm test` may report no test files at this stage and must not be treated as the feature test.
- [ ] **Step 3: Commit the scaffold.** Commit with `build: scaffold finish cli`.

### Task 2: Extract actions and deadlines with TDD

**Files:** `src/domain.ts`, `src/extract.ts`, `tests/extract.test.ts`.

**Interfaces:** `extractSignals(sourceText: string): ExtractedSignal[]` returns the `ExtractedSignal` shape defined in the spec: action kind, evidence, label, and optional raw deadline.

- [ ] **Step 1: Write a failing bill extraction test.** Use `Electric bill: pay $83.20 by 2026-08-28`; assert one `pay` signal, evidence containing the source sentence, and raw deadline `2026-08-28`.
- [ ] **Step 2: Run the focused test and verify the expected missing-function failure.** Run `npm test -- tests/extract.test.ts`; confirm failure is caused by absent extraction behavior, not a test typo.
- [ ] **Step 3: Implement the smallest deterministic English extractor.** Match explicit verbs and deadline phrases; preserve evidence exactly.
- [ ] **Step 4: Run the focused test and verify GREEN.** Confirm bill extraction passes with no warnings.
- [ ] **Step 5: Write a failing Korean and return extraction test.** Use `상품을 2026-08-30까지 반품하고 영수증을 준비하세요`; assert `return` kind and the same deadline.
- [ ] **Step 6: Implement the Korean phrase table and return handling.** Keep phrase matching explicit and case-insensitive where applicable.
- [ ] **Step 7: Run focused tests, then commit.** Run `npm test -- tests/extract.test.ts`; commit `feat: extract everyday actions and deadlines`.

### Task 3: Derive safe completion plans with TDD

**Files:** `src/plan.ts`, `tests/plan.test.ts`.

**Interfaces:** `createPlan(sourceText: string, signals: ExtractedSignal[]): FinishPlan` and `suggestNextStep(kind: ActionKind): string`.

- [ ] **Step 1: Write a failing safety plan test.** Assert a `pay` signal becomes `approval_required`, has a next step asking the user to verify amount and recipient, and increments the approval summary.
- [ ] **Step 2: Run the focused test and verify RED.** Run `npm test -- tests/plan.test.ts`; confirm the plan function is missing.
- [ ] **Step 3: Implement action-to-stage mapping.** Map pay, book, reply, submit, return, prepare, and other actions to safe preparation or approval stages.
- [ ] **Step 4: Write a failing return preparation test.** Assert a return item says to check the return window and gather the receipt, without claiming a label was created.
- [ ] **Step 5: Implement evidence-preserving item creation and summary counts.** Use stable item IDs based on order, not random values.
- [ ] **Step 6: Run all plan tests, then commit.** Run `npm test -- tests/plan.test.ts`; commit `feat: create safe completion plans`.

### Task 4: Render reviewable Markdown and HTML with TDD

**Files:** `src/render.ts`, `tests/render.test.ts`.

**Interfaces:** `renderMarkdown(plan: FinishPlan): string` and `renderHtml(plan: FinishPlan): string`.

- [ ] **Step 1: Write failing renderer tests.** Assert Markdown includes title, next actions, deadline, approval label, and source evidence; assert HTML includes escaped user text, an approval banner, and no external stylesheet or script URL.
- [ ] **Step 2: Run focused renderer tests and verify RED.** Run `npm test -- tests/render.test.ts`.
- [ ] **Step 3: Implement Markdown rendering.** Keep headings and labels readable in a terminal and GitHub comment.
- [ ] **Step 4: Implement escaped self-contained HTML rendering.** Use inline CSS only; escape `&`, `<`, `>`, `"`, and `'` before inserting user text.
- [ ] **Step 5: Run renderer tests and commit.** Run `npm test -- tests/render.test.ts`; commit `feat: render finish plans`.

### Task 5: Add guarded file I/O and CLI commands with TDD

**Files:** `src/io.ts`, `src/cli.ts`, `tests/io.test.ts`, `tests/cli.test.ts`.

**Interfaces:** `readWorkspaceText(root: string, inputPath: string): string`, `writeWorkspaceFile(root: string, outputPath: string, contents: string): void`, `runCli(argv: string[], cwd: string): Promise<number>`, and CLI commands `analyze`, `render`, `demo`.

- [ ] **Step 1: Write failing path-guard tests.** Assert a relative file inside the workspace is accepted and `..`, absolute outside paths, and symlink escapes are rejected.
- [ ] **Step 2: Run I/O tests and verify RED.** Run `npm test -- tests/io.test.ts`.
- [ ] **Step 3: Implement resolved-path containment checks.** Resolve both root and target, reject targets outside root, and create no directories outside the selected root.
- [ ] **Step 4: Write failing CLI integration tests.** Call the exported `runCli` against `examples/bill-and-return.txt`; assert exit code 0, JSON output, approval count, and HTML output for `demo`.
- [ ] **Step 5: Implement CLI parsing and stable exit codes.** Support `--text`, `--input`, `--format`, `--output`, and `--root`; print the next action before the full report; keep the executable wrapper limited to calling `runCli(process.argv.slice(2), process.cwd())`.
- [ ] **Step 6: Run CLI tests and commit.** Run `npm test -- tests/cli.test.ts`; commit `feat: add finish command line workflow`.

### Task 6: Package the user-facing open-source MVP

**Files:** `README.md`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, examples, CI, and verification record.

**Interfaces:** A new user can install the package, run the one-minute demo, inspect the report, and understand the safety boundary without reading source code.

- [ ] **Step 1: Add README hero copy and one-minute demo.** Lead with “You do not need another task list. You need fewer unfinished things.” Include exact commands and sample output.
- [ ] **Step 2: Add safety and contribution documents.** State no network, no accounts, no silent actions, path guards, and how to add deterministic phrase rules.
- [ ] **Step 3: Add a CI matrix.** Run typecheck, tests, build, and package smoke checks on Node 20 and 22 across Ubuntu, macOS, and Windows.
- [ ] **Step 4: Run the full verification suite.** Run `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, `npm pack`, clean-package demo smoke, and `git diff --check`.
- [ ] **Step 5: Record exact evidence.** Write command results, test counts, package file list, and archive hash to `docs/verification/v0.1-smoke.md`.
- [ ] **Step 6: Commit the release-ready MVP.** Commit `docs: package finish mvp`; do not publish until the full verification output is reviewed.

## Final verification checklist

- [ ] All tests pass with zero failures.
- [ ] Every new production function has a test that was observed failing first.
- [ ] Typecheck and build pass.
- [ ] CLI works from a clean packed package.
- [ ] HTML output contains no external network dependency.
- [ ] Path traversal and symlink escape tests pass.
- [ ] README commands work exactly as written.
- [ ] Verification record contains fresh outputs and archive hash.
