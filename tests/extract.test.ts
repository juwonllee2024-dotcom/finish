import { describe, expect, it } from "vitest";
import { extractSignals } from "../src/extract.js";

describe("extractSignals", () => {
  it("extracts a bill payment and explicit ISO deadline", () => {
    const source = "Electric bill: pay $83.20 by 2026-08-28";

    const signals = extractSignals(source);

    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({
      kind: "pay",
      label: "Pay the bill",
      deadline: { raw: "2026-08-28", isoDate: "2026-08-28" }
    });
    expect(signals[0]?.evidence).toBe(source);
  });

  it("extracts a Korean return action and deadline", () => {
    const source = "상품을 2026-08-30까지 반품하고 영수증을 준비하세요";

    const signals = extractSignals(source);

    expect(signals).toHaveLength(2);
    expect(signals[0]).toMatchObject({
      kind: "return",
      label: "Return the item",
      deadline: { raw: "2026-08-30", isoDate: "2026-08-30" }
    });
    expect(signals[1]).toMatchObject({
      kind: "prepare",
      label: "Prepare the receipt"
    });
  });

  it("keeps separate deadlines attached to their source lines", () => {
    const source = [
      "Electric bill: pay $83.20 by 2026-08-28",
      "Online order: return the item by 2026-08-30"
    ].join("\n");

    const signals = extractSignals(source);

    expect(signals).toHaveLength(2);
    expect(signals[0]).toMatchObject({ kind: "pay", deadline: { raw: "2026-08-28" } });
    expect(signals[1]).toMatchObject({ kind: "return", deadline: { raw: "2026-08-30" } });
  });
});
