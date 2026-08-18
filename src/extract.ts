import type { ActionKind, ExtractedSignal } from "./domain.js";

interface ActionRule {
  kind: ActionKind;
  label: string;
  pattern: RegExp;
}

const ACTION_RULES: ActionRule[] = [
  { kind: "pay", label: "Pay the bill", pattern: /\b(?:pay|payment|bill)\b|결제|납부/i },
  { kind: "book", label: "Book the appointment", pattern: /\b(?:book|schedule|appointment)\b|예약|일정/i },
  { kind: "return", label: "Return the item", pattern: /\breturn\b|반품/i },
  { kind: "reply", label: "Reply to the message", pattern: /\breply\b|답장|회신/i },
  { kind: "submit", label: "Submit the form", pattern: /\bsubmit\b|제출/i },
  { kind: "prepare", label: "Prepare the receipt", pattern: /\bprepare\b|준비/i }
];

const ISO_DATE = /\b(20\d{2}-\d{2}-\d{2})\b/;
const MONTH_DATE = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:,\s*(20\d{2}))?\b/i;

function findDeadline(sourceText: string): { raw: string; isoDate?: string } | undefined {
  const isoMatch = sourceText.match(ISO_DATE);
  if (isoMatch?.[1]) {
    return { raw: isoMatch[1], isoDate: isoMatch[1] };
  }

  const monthMatch = sourceText.match(MONTH_DATE);
  if (monthMatch?.[0]) {
    return { raw: monthMatch[0] };
  }

  return undefined;
}

export function extractSignals(sourceText: string): ExtractedSignal[] {
  const source = sourceText.trim();
  if (!source) {
    return [];
  }

  const sourceLines = source.split(/\r?\n/u);

  return ACTION_RULES.filter((rule) => rule.pattern.test(source)).map((rule) => {
    const evidenceLine = sourceLines.find((line) => rule.pattern.test(line)) ?? source;
    const deadline = findDeadline(evidenceLine);
    const signal: ExtractedSignal = {
      kind: rule.kind,
      label: rule.label,
      evidence: source
    };

    if (deadline) {
      signal.deadline = deadline;
    }

    return signal;
  });
}
