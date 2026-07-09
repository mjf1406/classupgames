import { id } from "@instantdb/react";
import {
  DEFAULT_QUESTION_TIME,
  DEFAULT_SETTING_SCOPE,
  DEFAULT_SHUFFLE_MODE,
} from "@/lib/game";
import { db } from "@/lib/db";
import type { ImportedDeck } from "./types";

export async function createDeckFromImport(
  imported: ImportedDeck,
  ownerId: string,
  title: string,
): Promise<string> {
  if (imported.questions.length === 0) {
    throw new Error("Import file has no questions.");
  }

  const deckId = id();
  const txes = [
    db.tx.decks[deckId]
      .update({
        title,
        description: imported.description ?? "",
        isBuiltIn: false,
        createdAt: Date.now(),
        answerShuffleMode:
          imported.answerShuffleMode ?? DEFAULT_SHUFFLE_MODE,
        questionShuffleMode:
          imported.questionShuffleMode ?? DEFAULT_SHUFFLE_MODE,
        answerShuffleScope:
          imported.answerShuffleScope ?? DEFAULT_SETTING_SCOPE,
        questionShuffleScope:
          imported.questionShuffleScope ?? DEFAULT_SETTING_SCOPE,
        questionTimeSeconds:
          imported.questionTimeSeconds ?? DEFAULT_QUESTION_TIME,
      })
      .link({ owner: ownerId }),
    ...imported.questions.map((question, index) => {
      const questionId = id();
      return db.tx.questions[questionId]
        .update({
          text: question.text,
          options: question.options,
          correctIndex: question.correctIndex,
          questionType: question.questionType,
          answerConfig: question.answerConfig ?? undefined,
          order: index,
        })
        .link({ deck: deckId });
    }),
  ];

  await db.transact(txes);
  return deckId;
}
