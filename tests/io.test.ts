import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readWorkspaceText, writeWorkspaceFile } from "../src/io.js";

const temporaryRoots: string[] = [];

async function createWorkspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "finish-io-"));
  await mkdir(join(root, "inbox"));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("guarded workspace I/O", () => {
  it("reads inputs and writes outputs inside the workspace", async () => {
    const root = await createWorkspace();
    await writeFile(join(root, "inbox", "note.txt"), "pay the bill", "utf8");

    expect(readWorkspaceText(root, "inbox/note.txt")).toBe("pay the bill");

    writeWorkspaceFile(root, "out/report.json", "{}");
    expect(readWorkspaceText(root, "out/report.json")).toBe("{}");
  });

  it("rejects traversal and absolute paths outside the workspace", async () => {
    const root = await createWorkspace();
    const outside = await mkdtemp(join(tmpdir(), "finish-outside-"));
    temporaryRoots.push(outside);
    await writeFile(join(outside, "secret.txt"), "private", "utf8");

    expect(() => readWorkspaceText(root, join("..", basename(outside), "secret.txt"))).toThrow(/outside|workspace/i);
    expect(() => readWorkspaceText(root, join(outside, "secret.txt"))).toThrow(/outside|workspace/i);
    expect(() => writeWorkspaceFile(root, join(outside, "report.json"), "{}"))
      .toThrow(/outside|workspace/i);
  });

  it("rejects a symlink that escapes the workspace", async () => {
    const root = await createWorkspace();
    const outside = await mkdtemp(join(tmpdir(), "finish-symlink-outside-"));
    temporaryRoots.push(outside);
    await writeFile(join(outside, "secret.txt"), "private", "utf8");

    try {
      await symlink(outside, join(root, "inbox", "linked"), "junction");
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EPERM" || code === "EACCES" || code === "UNKNOWN") {
        return;
      }
      throw error;
    }

    expect(() => readWorkspaceText(root, "inbox/linked/secret.txt")).toThrow(/outside|workspace|symlink/i);
  });
});
