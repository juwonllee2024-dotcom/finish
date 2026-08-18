export type ActionKind =
  | "reply"
  | "pay"
  | "book"
  | "return"
  | "submit"
  | "prepare"
  | "other";

export type PlanStage = "prepare" | "approval_required" | "complete";

export interface ExtractedSignal {
  kind: ActionKind;
  label: string;
  evidence: string;
  deadline?: { raw: string; isoDate?: string };
}

export interface FinishItem {
  id: string;
  label: string;
  kind: ActionKind;
  stage: PlanStage;
  approvalRequired: boolean;
  suggestedNextStep: string;
  deadline?: { raw: string; isoDate?: string };
  evidence: string;
}

export interface FinishPlan {
  schemaVersion: "0.1";
  title: string;
  sourceText: string;
  items: FinishItem[];
  summary: { total: number; approvalRequired: number; deadlines: number };
}
