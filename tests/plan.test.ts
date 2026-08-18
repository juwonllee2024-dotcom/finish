import { describe, expect, it } from "vitest";
import { extractSignals } from "../src/extract.js";
import { createPlan } from "../src/plan.js";

describe("createPlan", () => {
  it("marks payment actions as requiring approval", () => {
    const source = "Electric bill: pay $83.20 by 2026-08-28";

    const plan = createPlan(source, extractSignals(source));

    expect(plan.title).toBe("Electric bill");
    expect(plan.items[0]).toMatchObject({
      kind: "pay",
      stage: "approval_required",
      approvalRequired: true,
      suggestedNextStep: "Verify the amount and recipient before paying.",
      deadline: { isoDate: "2026-08-28" }
    });
    expect(plan.summary).toEqual({ total: 1, approvalRequired: 1, deadlines: 1 });
  });

  it("keeps return preparation safe and explicit", () => {
    const source = "Return the item by 2026-08-30 and prepare the receipt";

    const plan = createPlan(source, extractSignals(source));

    expect(plan.items).toHaveLength(2);
    expect(plan.items[0]).toMatchObject({
      kind: "return",
      stage: "prepare",
      approvalRequired: false,
      suggestedNextStep: "Check the return window and gather the receipt."
    });
    expect(plan.items[1]).toMatchObject({
      kind: "prepare",
      stage: "prepare",
      approvalRequired: false
    });
  });

  it("keeps unrecognized input reviewable instead of dropping it", () => {
    const source = "Remember the family picnic on Sunday";

    const plan = createPlan(source, extractSignals(source));

    expect(plan.items).toHaveLength(1);
    expect(plan.items[0]).toMatchObject({
      kind: "other",
      label: "Review this item",
      stage: "prepare",
      approvalRequired: false
    });
  });
});
