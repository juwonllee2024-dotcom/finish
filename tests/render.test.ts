import { describe, expect, it } from "vitest";
import { extractSignals } from "../src/extract.js";
import { createPlan } from "../src/plan.js";
import { renderHtml, renderMarkdown } from "../src/render.js";

describe("renderers", () => {
  it("renders a readable Markdown plan", () => {
    const source = "Electric bill: pay $83.20 by 2026-08-28";
    const plan = createPlan(source, extractSignals(source));

    const markdown = renderMarkdown(plan);

    expect(markdown).toContain("# Electric bill");
    expect(markdown).toContain("## Next action");
    expect(markdown).toContain("Verify the amount and recipient before paying.");
    expect(markdown).toContain("Approval required");
    expect(markdown).toContain("2026-08-28");
    expect(markdown).toContain(source);
  });

  it("renders escaped self-contained HTML with an approval banner", () => {
    const source = "Pay the bill <script>alert('x')</script> by 2026-08-28";
    const plan = createPlan(source, extractSignals("Pay the bill by 2026-08-28"));
    plan.sourceText = source;

    const html = renderHtml(plan);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Approval required");
    expect(html).toContain("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toMatch(/https?:\/\//u);
  });
});
