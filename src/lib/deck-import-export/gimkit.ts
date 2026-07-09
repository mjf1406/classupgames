import { sanitizeFilename } from "./download";
import { getMcExportRows } from "./mc-export";
import type { DeckExportData, ExportFile, ImportedDeck, ImportedQuestion } from "./types";

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function findGimkitHeaderRow(rows: string[][]): number {
  for (let i = 0; i < rows.length; i++) {
    const first = String(rows[i][0] ?? "").toLowerCase();
    if (first === "question") return i;
  }
  return -1;
}

export function exportGimkitCsv(deck: DeckExportData): ExportFile {
  const rows = getMcExportRows(deck);
  const lines = [
    "Gimkit Spreadsheet Import Template,,,,",
    "Question,Correct Answer,Incorrect Answer 1,Incorrect Answer 2 (Optional),Incorrect Answer 3 (Optional)",
  ];

  for (const row of rows) {
    const correctIndex = row.correctIndices[0] ?? 0;
    const correctAnswer = row.options[correctIndex] ?? "";
    const incorrect = row.options
      .filter((_, index) => index !== correctIndex)
      .slice(0, 3);

    lines.push(
      [
        escapeCsvCell(row.text),
        escapeCsvCell(correctAnswer),
        escapeCsvCell(incorrect[0] ?? ""),
        escapeCsvCell(incorrect[1] ?? ""),
        escapeCsvCell(incorrect[2] ?? ""),
      ].join(","),
    );
  }

  return {
    blob: new Blob([lines.join("\n")], { type: "text/csv" }),
    filename: `${sanitizeFilename(deck.title)}.gimkit.csv`,
  };
}

export function parseGimkit(text: string): ImportedDeck {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const rows = lines.map(parseCsvLine);
  const headerRow = findGimkitHeaderRow(rows);
  if (headerRow < 0) {
    throw new Error("Could not find Gimkit header row.");
  }

  const questions: ImportedQuestion[] = [];
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    const questionText = String(row[0] ?? "").trim();
    const correctAnswer = String(row[1] ?? "").trim();
    if (!questionText || !correctAnswer) continue;

    const incorrect = [row[2], row[3], row[4]]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);

    const options = [correctAnswer, ...incorrect];
    if (options.length < 2) continue;

    questions.push({
      text: questionText,
      options,
      correctIndex: 0,
      questionType: "mc",
      order: questions.length,
    });
  }

  if (questions.length === 0) {
    throw new Error("No valid questions found in Gimkit file.");
  }

  return {
    title: "Imported Gimkit deck",
    questions,
  };
}

export function isGimkitCsv(text: string): boolean {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return false;
  const first = lines[0].toLowerCase();
  const second = lines[1].toLowerCase();
  return (
    first.includes("gimkit") &&
    second.startsWith("question,") &&
    second.includes("correct answer")
  );
}
