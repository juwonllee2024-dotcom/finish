import { extractSignals } from "./extract.js";
import { readWorkspaceText, writeWorkspaceFile } from "./io.js";
import { createPlan } from "./plan.js";
import type { FinishPlan } from "./domain.js";
import { renderHtml, renderMarkdown } from "./render.js";

type OutputFormat = "json" | "markdown" | "html";

interface ParsedArguments {
  options: Record<string, string | boolean>;
  positional: string[];
}

const VALUE_OPTIONS = new Set(["format", "input", "output", "root", "text"]);
const DEMO_SOURCE = [
  "Electric bill: pay $83.20 by 2026-08-28",
  "Online order: return the item by 2026-08-30"
].join("\n");

export const HELP_TEXT = `FINISH — fewer unfinished things

Usage:
  finish analyze --text "Electric bill: pay $83.20 by 2026-08-28"
  finish analyze --input ./inbox/note.md --format html --output ./out/note.html
  finish render ./out/note.json --format markdown --output ./out/note.md
  finish demo --output ./out/demo.html

Options:
  --text <text>       Analyze text directly
  --input <path>      Read text from a workspace file
  --format <format>   json, markdown, or html
  --output <path>     Write the report inside the workspace
  --root <path>       Select the workspace root (default: current directory)
  --help              Show this help
`;

class CliError extends Error {
  readonly exitCode = 2;
}

function parseArguments(args: string[]): ParsedArguments {
  const options: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument) {
      continue;
    }

    if (!argument.startsWith("--")) {
      positional.push(argument);
      continue;
    }

    const rawOption = argument.slice(2);
    const equalsIndex = rawOption.indexOf("=");
    const name = equalsIndex === -1 ? rawOption : rawOption.slice(0, equalsIndex);
    const inlineValue = equalsIndex === -1 ? undefined : rawOption.slice(equalsIndex + 1);

    if (name === "help") {
      options.help = true;
      continue;
    }

    if (!VALUE_OPTIONS.has(name)) {
      throw new CliError(`Unknown option: --${name}`);
    }

    const value = inlineValue ?? args[index + 1];
    if (value === undefined || (inlineValue === undefined && value.startsWith("--"))) {
      throw new CliError(`Missing value for --${name}`);
    }
    if (inlineValue === undefined) {
      index += 1;
    }
    options[name] = value;
  }

  return { options, positional };
}

function optionValue(parsed: ParsedArguments, name: string): string | undefined {
  const value = parsed.options[name];
  return typeof value === "string" ? value : undefined;
}

function rootFor(parsed: ParsedArguments, cwd: string): string {
  return optionValue(parsed, "root") ?? cwd;
}

function formatValue(parsed: ParsedArguments, fallback: OutputFormat): OutputFormat {
  const format = optionValue(parsed, "format") ?? fallback;
  if (format !== "json" && format !== "markdown" && format !== "html") {
    throw new CliError(`Unsupported format: ${format}`);
  }
  return format;
}

function formatFromOutput(parsed: ParsedArguments, fallback: OutputFormat): OutputFormat {
  const explicitFormat = optionValue(parsed, "format");
  if (explicitFormat) {
    return formatValue(parsed, fallback);
  }

  const output = optionValue(parsed, "output")?.toLowerCase();
  if (output?.endsWith(".html") || output?.endsWith(".htm")) {
    return "html";
  }
  if (output?.endsWith(".md") || output?.endsWith(".markdown")) {
    return "markdown";
  }
  if (output?.endsWith(".json")) {
    return "json";
  }
  return fallback;
}

function renderPlan(plan: FinishPlan, format: OutputFormat): string {
  switch (format) {
    case "json":
      return `${JSON.stringify(plan, null, 2)}\n`;
    case "markdown":
      return renderMarkdown(plan);
    case "html":
      return renderHtml(plan);
  }
}

function nextAction(plan: FinishPlan): string {
  return plan.items[0]?.suggestedNextStep ?? "Review this item and choose the next action.";
}

function readPlan(root: string, inputPath: string): FinishPlan {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readWorkspaceText(root, inputPath)) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new CliError(`Invalid plan JSON: ${error.message}`);
    }
    throw error;
  }

  if (!parsed || typeof parsed !== "object" || (parsed as { schemaVersion?: unknown }).schemaVersion !== "0.1") {
    throw new CliError("Input is not a FINISH 0.1 plan");
  }
  return parsed as FinishPlan;
}

function outputReport(root: string, outputPath: string | undefined, report: string): void {
  if (outputPath) {
    writeWorkspaceFile(root, outputPath, report);
    console.log(`Wrote ${outputPath}`);
    return;
  }
  console.log(report);
}

async function analyze(args: string[], cwd: string): Promise<number> {
  const parsed = parseArguments(args);
  const root = rootFor(parsed, cwd);
  const text = optionValue(parsed, "text");
  const input = optionValue(parsed, "input");

  if (text !== undefined && input !== undefined) {
    throw new CliError("Choose either --text or --input, not both");
  }
  if (text === undefined && input === undefined) {
    throw new CliError("analyze requires --text or --input");
  }

  const source = text ?? readWorkspaceText(root, input as string);
  const plan = createPlan(source, extractSignals(source));
  console.log(`Next action: ${nextAction(plan)}`);
  outputReport(root, optionValue(parsed, "output"), renderPlan(plan, formatFromOutput(parsed, "json")));
  return 0;
}

async function render(args: string[], cwd: string): Promise<number> {
  const parsed = parseArguments(args);
  const input = parsed.positional[0] ?? optionValue(parsed, "input");
  if (!input) {
    throw new CliError("render requires a plan JSON path");
  }

  const root = rootFor(parsed, cwd);
  const plan = readPlan(root, input);
  console.log(`Next action: ${nextAction(plan)}`);
  outputReport(root, optionValue(parsed, "output"), renderPlan(plan, formatFromOutput(parsed, "markdown")));
  return 0;
}

async function demo(args: string[], cwd: string): Promise<number> {
  const parsed = parseArguments(args);
  const root = rootFor(parsed, cwd);
  const plan = createPlan(DEMO_SOURCE, extractSignals(DEMO_SOURCE));
  console.log(`Next action: ${nextAction(plan)}`);
  outputReport(root, optionValue(parsed, "output"), renderPlan(plan, formatFromOutput(parsed, "html")));
  return 0;
}

export async function runCli(argv: string[], cwd: string): Promise<number> {
  try {
    const [command, ...args] = argv;
    if (!command || command === "--help" || command === "help") {
      console.log(HELP_TEXT);
      return 0;
    }

    switch (command) {
      case "analyze":
        return await analyze(args, cwd);
      case "render":
        return await render(args, cwd);
      case "demo":
        return await demo(args, cwd);
      default:
        throw new CliError(`Unknown command: ${command}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`finish: ${message}`);
    return error instanceof CliError ? error.exitCode : 1;
  }
}
