# FINISH MVP Design

**Status:** Approved for implementation by the user with “좋아 바로해”.

## Product promise

FINISH turns messy everyday input into a short, honest path toward completion.

The user can paste a note, email, or document. FINISH identifies concrete actions, deadlines, the safest next step, and any action that needs human approval. It never pretends that a payment, booking, message, or submission happened when it did not.

## Problem

People do not need another task list. They need help moving from an incoming piece of life to a finished outcome. Important work is often hidden inside an email, bill, school notice, return instruction, or text message. Existing task tools make the user extract and manage the work manually.

## MVP user experience

1. The user provides plain text directly or points FINISH at a local text or Markdown file.
2. FINISH creates a deterministic plan with a plain-language title, actionable items, deadlines when explicitly present, and approval boundaries.
3. FINISH prints the most useful next action first.
4. The user can save the plan as JSON, Markdown, or a self-contained HTML report.
5. Irreversible actions are marked `approval_required`; FINISH does not send, pay, book, delete, purchase, or submit anything in this release.

## CLI contract

```text
finish analyze --text "Electric bill: pay $83.20 by 2026-08-28"
finish analyze --input ./inbox/bill.md --format markdown --output ./out/bill.md
finish render ./out/bill.json --format html --output ./out/bill.html
finish demo --output ./out/demo.html
```

The CLI must work without a network connection after installation. `analyze` writes a JSON plan by default and can also print a human-readable summary. `render` accepts a plan JSON file and produces Markdown or dependency-free HTML. `demo` creates a representative return-and-bill example so a new user can see the product in seconds.

## Domain model

```ts
type ActionKind = "reply" | "pay" | "book" | "return" | "submit" | "prepare" | "other";
type PlanStage = "prepare" | "approval_required" | "complete";

interface FinishItem {
  id: string;
  label: string;
  kind: ActionKind;
  stage: PlanStage;
  approvalRequired: boolean;
  suggestedNextStep: string;
  deadline?: { raw: string; isoDate?: string };
  evidence: string;
}

interface ExtractedSignal {
  kind: ActionKind;
  label: string;
  evidence: string;
  deadline?: { raw: string; isoDate?: string };
}

interface FinishPlan {
  schemaVersion: "0.1";
  title: string;
  sourceText: string;
  items: FinishItem[];
  summary: { total: number; approvalRequired: number; deadlines: number };
}
```

Extraction is intentionally transparent and deterministic in the MVP. It recognizes a small set of common English and Korean action phrases, explicit ISO dates, common month/day dates, and direct deadline wording. It preserves the source evidence beside every extracted item so users can review why an item exists.

## Safety boundaries

- Read only user-provided text files; never execute repository scripts or shell commands.
- Reject input paths that escape the selected workspace.
- Do not make network calls, use an account, call a model, or transmit user text.
- Do not perform irreversible actions; show approval requirements instead.
- Do not claim completion unless the input explicitly states that the action is complete.
- Keep generated output deterministic and reviewable.

## Non-goals for v0.1

- OCR, speech recognition, email/calendar integrations, browser automation, payments, bookings, sending messages, and cloud synchronization.
- General-purpose natural-language understanding.
- Automatic claims that a task is done.
- A hosted dashboard or account system.

## Acceptance criteria

- A bill example yields a `pay` item, an explicit deadline, and `approval_required` stage.
- A return example yields a `return` item and a preparation step without pretending a label was created.
- Korean action phrases produce the same safe item categories as their English equivalents.
- A plan can be rendered to readable Markdown and dependency-free HTML.
- Unsafe input paths are rejected.
- CLI failures use stable non-zero exit codes and actionable messages.
- All behavior is covered by tests that were observed failing before implementation.

## Architecture

The core is a pure TypeScript pipeline: input normalization, deterministic extraction, plan derivation, and rendering. The CLI is a thin adapter around those pure functions. This keeps the MVP easy to run locally, test without mocks, and extend later with optional connectors without putting external side effects in the core.
