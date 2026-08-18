import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

function pathError(target: string): Error {
  return new Error(`Path is outside the selected workspace: ${target}`);
}

function assertInside(root: string, target: string): void {
  const relativeTarget = relative(root, target);
  if (relativeTarget === ".." || relativeTarget.startsWith(`..${sep}`) || isAbsolute(relativeTarget)) {
    throw pathError(target);
  }
}

function resolveRoot(root: string): string {
  return realpathSync(resolve(root));
}

function pathExists(target: string): boolean {
  try {
    lstatSync(target);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function assertExistingPathInside(root: string, target: string): string {
  const actualTarget = realpathSync(target);
  assertInside(root, actualTarget);
  return actualTarget;
}

function nearestExistingAncestor(target: string): string {
  let ancestor = target;
  while (!pathExists(ancestor)) {
    const parent = dirname(ancestor);
    if (parent === ancestor) {
      break;
    }
    ancestor = parent;
  }
  return ancestor;
}

export function readWorkspaceText(root: string, inputPath: string): string {
  const workspace = resolveRoot(root);
  const candidate = resolve(workspace, inputPath);
  assertInside(workspace, candidate);
  const target = assertExistingPathInside(workspace, candidate);
  return readFileSync(target, "utf8");
}

export function writeWorkspaceFile(root: string, outputPath: string, contents: string): void {
  const workspace = resolveRoot(root);
  const candidate = resolve(workspace, outputPath);
  assertInside(workspace, candidate);

  const parent = dirname(candidate);
  const existingAncestor = nearestExistingAncestor(parent);
  assertExistingPathInside(workspace, existingAncestor);

  mkdirSync(parent, { recursive: true });
  const actualParent = assertExistingPathInside(workspace, parent);

  if (pathExists(candidate)) {
    assertExistingPathInside(workspace, candidate);
  }

  writeFileSync(resolve(actualParent, candidate.slice(parent.length + 1)), contents, "utf8");
}
