import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runCli } from "../src/cli.js";

const temporaryRoots: string[] = [];

async function createCliWorkspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "finish-cli-"));
  await mkdir(join(root, "examples"));
  await writeFile(
    join(root, "examples", "bill-and-return.txt"),
    "Electric bill: pay $83.20 by 2026-08-28\nOnline order: return the item by 2026-08-30",
    "utf8"
  );
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("finish CLI workflow", () => {
  it("analyzes an input file into canonical JSON and prints the next action first", async () => {
    const root = await createCliWorkspace();
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const exitCode = await runCli(
      [
        "analyze",
        "--input",
        "examples/bill-and-return.txt",
        "--format",
        "json",
        "--output",
        "out/plan.json",
        "--root",
        root
      ],
      root
    );

    expect(exitCode).toBe(0);
    const plan = JSON.parse(await readFile(join(root, "out", "plan.json"), "utf8")) as {
      summary: { total: number; approvalRequired: number };
      items: Array<{ kind: string }>;
    };
    expect(plan.summary.total).toBe(2);
    expect(plan.summary.approvalRequired).toBe(1);
    expect(plan.items.map((item) => item.kind)).toEqual(["pay", "return"]);
    expect(log.mock.calls[0]?.[0]).toContain("Next action:");
  });

  it("renders the built-in demo as a self-contained HTML report", async () => {
    const root = await createCliWorkspace();

    const exitCode = await runCli(["demo", "--output", "out/demo.html", "--root", root], root);

    expect(exitCode).toBe(0);
    const html = await readFile(join(root, "out", "demo.html"), "utf8");
    expect(html).toContain("FINISH");
    expect(html).toContain("Approval required");
    expect(html).not.toContain("http://");
    expect(html).not.toContain("https://");
  });
});
