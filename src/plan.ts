import type { ActionKind, ExtractedSignal, FinishItem, FinishPlan } from "./domain.js";

const APPROVAL_KINDS = new Set<ActionKind>(["pay", "book", "reply", "submit"]);

export function suggestNextStep(kind: ActionKind): string {
  switch (kind) {
    case "pay":
      return "Verify the amount and recipient before paying.";
    case "book":
      return "Choose a time and review the booking details before confirming.";
    case "reply":
      return "Review the draft before sending.";
    case "submit":
      return "Check the form and attachments before submitting.";
    case "return":
      return "Check the return window and gather the receipt.";
    case "prepare":
      return "Gather the needed materials.";
    case "other":
      return "Review this item and choose the next action.";
  }
}

function titleFromSource(sourceText: string): string {
  const firstLine = sourceText.split(/\r?\n/u)[0]?.trim() ?? "";
  const beforeColon = firstLine.split(/[:：]/u)[0]?.trim() ?? "";
  return (beforeColon || firstLine || "Untitled item").slice(0, 120);
}

function toItem(signal: ExtractedSignal, index: number): FinishItem {
  const approvalRequired = APPROVAL_KINDS.has(signal.kind);
  const item: FinishItem = {
    id: `item-${index + 1}`,
    label: signal.label,
    kind: signal.kind,
    stage: approvalRequired ? "approval_required" : "prepare",
    approvalRequired,
    suggestedNextStep: suggestNextStep(signal.kind),
    evidence: signal.evidence
  };

  if (signal.deadline) {
    item.deadline = signal.deadline;
  }

  return item;
}

export function createPlan(sourceText: string, signals: ExtractedSignal[]): FinishPlan {
  const source = sourceText.trim();
  const effectiveSignals = signals.length > 0
    ? signals
    : source
      ? [{ kind: "other" as const, label: "Review this item", evidence: source }]
      : [];
  const items = effectiveSignals.map(toItem);

  return {
    schemaVersion: "0.1",
    title: titleFromSource(source),
    sourceText: source,
    items,
    summary: {
      total: items.length,
      approvalRequired: items.filter((item) => item.approvalRequired).length,
      deadlines: items.filter((item) => item.deadline !== undefined).length
    }
  };
}
