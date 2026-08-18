import type { FinishItem, FinishPlan } from "./domain.js";

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => HTML_ENTITIES[character] ?? character);
}

function itemStatus(item: FinishItem): string {
  if (item.approvalRequired) {
    return "Approval required";
  }
  if (item.stage === "complete") {
    return "Complete";
  }
  return "Prepare first";
}

function renderItemMarkdown(item: FinishItem): string[] {
  const lines = [
    `### ${item.label}`,
    `- Status: ${itemStatus(item)}`,
    `- Next: ${item.suggestedNextStep}`
  ];

  if (item.deadline) {
    lines.push(`- Deadline: ${item.deadline.raw}`);
  }

  lines.push(`- Evidence: ${item.evidence}`, "");
  return lines;
}

export function renderMarkdown(plan: FinishPlan): string {
  const nextAction = plan.items[0]?.suggestedNextStep ?? "Review this item and choose the next action.";
  const lines = [
    `# ${plan.title}`,
    "",
    "## Next action",
    nextAction,
    "",
    "## Summary",
    `- Items: ${plan.summary.total}`,
    `- Approval required: ${plan.summary.approvalRequired}`,
    `- Deadlines: ${plan.summary.deadlines}`,
    "",
    "## Items",
    ...plan.items.flatMap(renderItemMarkdown),
    "## Source",
    plan.sourceText,
    ""
  ];

  return lines.join("\n");
}

function renderItemHtml(item: FinishItem): string {
  const deadline = item.deadline
    ? `<div class="detail"><strong>Deadline</strong><span>${escapeHtml(item.deadline.raw)}</span></div>`
    : "";

  return `<article class="item ${item.approvalRequired ? "needs-approval" : "ready"}">
  <h2>${escapeHtml(item.label)}</h2>
  <div class="status">${escapeHtml(itemStatus(item))}</div>
  <div class="detail"><strong>Next</strong><span>${escapeHtml(item.suggestedNextStep)}</span></div>
  ${deadline}
  <div class="evidence"><strong>Evidence</strong><blockquote>${escapeHtml(item.evidence)}</blockquote></div>
</article>`;
}

export function renderHtml(plan: FinishPlan): string {
  const approvalBanner = plan.summary.approvalRequired > 0
    ? `<div class="banner warning"><strong>Approval required</strong><span>FINISH prepared the next step. It did not send, pay, book, or submit anything.</span></div>`
    : `<div class="banner safe"><strong>Preparation ready</strong><span>Review the next step before you act.</span></div>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(plan.title)} — FINISH</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #f5f7fb; color: #172033; }
    body { margin: 0; padding: 32px 20px 56px; }
    main { max-width: 820px; margin: 0 auto; }
    .eyebrow { color: #5b6b88; font-size: 12px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
    h1 { font-size: clamp(32px, 6vw, 56px); line-height: 1; margin: 10px 0 24px; }
    .banner { border-radius: 18px; display: grid; gap: 6px; padding: 18px 20px; margin-bottom: 24px; }
    .banner strong { font-size: 18px; }
    .warning { background: #fff1d6; border: 1px solid #f0c46b; }
    .safe { background: #e5f8ee; border: 1px solid #88d4a9; }
    .summary, .item, .source { background: white; border: 1px solid #dfe5ef; border-radius: 18px; box-shadow: 0 8px 24px #24395e0d; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 16px; margin-bottom: 24px; }
    .metric { display: grid; gap: 4px; padding: 12px; background: #f5f7fb; border-radius: 12px; }
    .metric strong { font-size: 24px; }
    .metric span { color: #5b6b88; font-size: 12px; }
    .item { padding: 20px; margin: 14px 0; }
    .item.needs-approval { border-left: 5px solid #e39a21; }
    .item.ready { border-left: 5px solid #45aa70; }
    .item h2 { margin: 0 0 10px; }
    .status { display: inline-block; border-radius: 999px; padding: 6px 10px; background: #eef2f8; color: #41516d; font-size: 12px; font-weight: 800; margin-bottom: 16px; }
    .detail { display: grid; grid-template-columns: 120px 1fr; gap: 8px; padding: 8px 0; border-top: 1px solid #edf0f5; }
    .detail strong, .evidence strong { color: #5b6b88; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    blockquote, .source pre { white-space: pre-wrap; margin: 8px 0 0; color: #3e4c65; }
    .source { padding: 20px; margin-top: 24px; }
    .source pre { font: inherit; }
    @media (max-width: 560px) { .summary { grid-template-columns: 1fr; } .detail { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">FINISH · fewer unfinished things</div>
    <h1>${escapeHtml(plan.title)}</h1>
    ${approvalBanner}
    <section class="summary" aria-label="Summary">
      <div class="metric"><strong>${plan.summary.total}</strong><span>items</span></div>
      <div class="metric"><strong>${plan.summary.approvalRequired}</strong><span>need approval</span></div>
      <div class="metric"><strong>${plan.summary.deadlines}</strong><span>deadlines</span></div>
    </section>
    <section aria-label="Items">
      ${plan.items.map(renderItemHtml).join("\n")}
    </section>
    <section class="source" aria-label="Source">
      <strong>Source</strong>
      <pre>${escapeHtml(plan.sourceText)}</pre>
    </section>
  </main>
</body>
</html>
`;
}
