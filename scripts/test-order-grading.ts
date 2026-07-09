import assert from "node:assert/strict";
import {
  gradeAnswer,
  parseAnswerConfig,
  reshuffleForRepetition,
  shuffleQuestionOptions,
} from "../src/lib/game";
import type { DeckShuffleConfig, QuestionSnapshot } from "../src/lib/game";
import type { PlayerAnswerInput } from "../src/lib/game";

function randomAlwaysZero(): () => number {
  return () => 0;
}

function randomAlwaysHalf(): () => number {
  return () => 0.5;
}

function computeSubmittedOrder(question: QuestionSnapshot, authored: string[]) {
  const config = parseAnswerConfig("order", question.answerConfig);
  const originalIndices =
    (config as { originalIndices?: number[] } | undefined)?.originalIndices ??
    question.options.map((_, index) => index);

  const displayOrder = authored.map((text) => {
    const displayIndex = question.options.indexOf(text);
    assert.ok(displayIndex >= 0, `Missing option "${text}" in snapshot`);
    return displayIndex;
  });

  return displayOrder.map(
    (displayIndex) => originalIndices[displayIndex] ?? displayIndex,
  );
}

function assertOrderGradesCorrectly(
  question: QuestionSnapshot,
  authored: string[],
) {
  const order = computeSubmittedOrder(question, authored);
  const expected = authored.map((_, i) => i);
  assert.deepEqual(order, expected, "Submitted order should be authored indices");

  const input: PlayerAnswerInput = { kind: "order", order };
  assert.equal(
    gradeAnswer(question, input),
    true,
    "gradeAnswer should accept correct order",
  );
}

const authoredOptions = ["I", "am", "a", "monkey"];

const authoredQuestion: QuestionSnapshot = {
  text: "Arrange the words",
  questionType: "order",
  options: authoredOptions,
  answerConfig: {},
};

// 1) Single shuffle should still grade correctly.
const onceShuffled = shuffleQuestionOptions(authoredQuestion, randomAlwaysZero());
assertOrderGradesCorrectly(onceShuffled, authoredOptions);

// 2) Double shuffle should still grade correctly (composition is required).
const twiceShuffled = shuffleQuestionOptions(onceShuffled, randomAlwaysHalf());
assertOrderGradesCorrectly(twiceShuffled, authoredOptions);

// 3) eachRepetition reshuffle path should still grade correctly.
const settings: DeckShuffleConfig = {
  answerShuffleMode: "eachRepetition",
  answerShuffleScope: "everyone",
  questionShuffleMode: "none",
  questionShuffleScope: "everyone",
};
const reshuffled = reshuffleForRepetition([onceShuffled], settings, "everyone", "seed");
assert.equal(reshuffled.length, 1);
assertOrderGradesCorrectly(reshuffled[0]!, authoredOptions);

console.log("✅ order question grading regression passed");

