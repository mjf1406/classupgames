import { getQuestionTypeLabel, parseQuestionType } from "@/lib/game";
import type { QuestionType } from "@/lib/game";
import type { DeckExportData, DeckExportQuestion, ExportPreview } from "./types";

export type McExportRow = {
  text: string;
  options: string[];
  correctIndices: number[];
  questionType: "mc" | "tf";
};

const EXPORTABLE_TYPES = new Set<QuestionType>(["mc", "tf"]);

export function isExportableMcType(type: QuestionType): boolean {
  return EXPORTABLE_TYPES.has(type);
}

export function getExportPreview(deck: DeckExportData): ExportPreview {
  const skippedByType: Partial<Record<QuestionType, number>> = {};
  let exportableCount = 0;
  let invalidMcCount = 0;

  for (const question of deck.questions) {
    const type = parseQuestionType(question.questionType);
    if (!isExportableMcType(type)) {
      skippedByType[type] = (skippedByType[type] ?? 0) + 1;
      continue;
    }

    const row = toMcExportRow(question);
    if (!row) {
      invalidMcCount += 1;
      continue;
    }

    exportableCount += 1;
  }

  return {
    totalQuestions: deck.questions.length,
    exportableCount,
    skippedByType,
    invalidMcCount,
  };
}

export function getMcExportRows(deck: DeckExportData): McExportRow[] {
  const rows: McExportRow[] = [];

  for (const question of deck.questions) {
    const type = parseQuestionType(question.questionType);
    if (!isExportableMcType(type)) continue;
    const row = toMcExportRow(question);
    if (row) rows.push(row);
  }

  return rows;
}

function toMcExportRow(question: DeckExportQuestion): McExportRow | null {
  const type = parseQuestionType(question.questionType);

  if (type === "tf") {
    const options =
      Array.isArray(question.options) && question.options.length >= 2
        ? [String(question.options[0]), String(question.options[1])]
        : ["True", "False"];
    const correctIndex =
      typeof question.correctIndex === "number" ? question.correctIndex : 0;
    return {
      text: question.text,
      options,
      correctIndices: [correctIndex],
      questionType: "tf",
    };
  }

  const options = (Array.isArray(question.options) ? question.options : [])
    .map((option) => String(option).trim())
    .filter(Boolean);

  if (options.length < 2) return null;

  const correctIndex =
    typeof question.correctIndex === "number" ? question.correctIndex : 0;
  if (correctIndex < 0 || correctIndex >= options.length) return null;

  return {
    text: question.text,
    options: options.slice(0, 4),
    correctIndices: [correctIndex],
    questionType: "mc",
  };
}

export function formatSkippedTypeSummary(
  skippedByType: Partial<Record<QuestionType, number>>,
): string[] {
  return Object.entries(skippedByType)
    .filter(([, count]) => (count ?? 0) > 0)
    .map(([type, count]) => `${getQuestionTypeLabel(type as QuestionType)} (${count})`);
}

export function clampKahootTime(seconds: number): number {
  const allowed = [5, 10, 20, 30, 60, 90, 120, 240];
  const clamped = Math.min(240, Math.max(5, Math.round(seconds)));
  let closest = allowed[0];
  let minDiff = Math.abs(clamped - closest);
  for (const value of allowed) {
    const diff = Math.abs(clamped - value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = value;
    }
  }
  return closest;
}

export function clampBlooketTime(seconds: number): number {
  return Math.min(300, Math.max(1, Math.round(seconds)));
}
