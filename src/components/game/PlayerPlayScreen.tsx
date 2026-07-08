import { id } from "@instantdb/react";
import {
  AnswerOption,
  AnswerOptionGrid,
  AnswerStatusFooter,
} from "@/components/game/AnswerOption";
import { Progress } from "@/components/ui/progress";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { db } from "@/lib/db";
import type {
  AnswerRecord,
  GameRecord,
  QuestionSnapshot,
} from "@/lib/types";

type PlayerPlayScreenProps = {
  game: GameRecord;
  currentQuestion: QuestionSnapshot | null;
  myAnswer: AnswerRecord | null;
  revealing: boolean;
  gameMeta?: { resource?: string };
  onAnswer: (choiceIndex: number) => void;
};

export function PlayerPlayScreen({
  game,
  currentQuestion,
  myAnswer,
  revealing,
  onAnswer,
}: PlayerPlayScreenProps) {
  const timeRemaining = useQuestionTimer(
    game.questionStartedAt,
    game.questionTimeSeconds,
    game.status === "playing",
  );

  const options = (currentQuestion?.options ?? []).slice(0, 8);
  const optionCount = options.length;

  return (
    <div className="flex min-h-0 h-full flex-col gap-4 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold leading-snug md:text-3xl">
            {currentQuestion?.text ?? "Loading question..."}
          </h1>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-mono text-4xl font-bold tabular-nums text-primary">
            {Math.ceil(timeRemaining)}
          </div>
          <Progress
            value={(timeRemaining / game.questionTimeSeconds) * 100}
            className="mt-2 h-1.5 w-56 max-w-[48vw]"
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <AnswerOptionGrid
          optionCount={optionCount}
          className="h-full auto-rows-fr"
        >
          {options.map((option, index) => (
            <AnswerOption
              key={index}
              index={index}
              text={option}
              variant="interactive"
              fullHeight
              disabled={Boolean(myAnswer) || revealing}
              onClick={() => onAnswer(index)}
            />
          ))}
        </AnswerOptionGrid>

        <AnswerStatusFooter
          className="mt-4"
          message={
            myAnswer ? "Answer submitted — waiting for the squad..." : null
          }
        />
      </div>
    </div>
  );
}

export function submitAnswer({
  gameId,
  playerId,
  questionIndex,
  choiceIndex,
  correctIndex,
}: {
  gameId: string;
  playerId: string;
  questionIndex: number;
  choiceIndex: number;
  correctIndex: number;
}) {
  const answerId = id();
  return db.transact(
    db.tx.answers[answerId]
      .update({
        questionIndex,
        choiceIndex,
        isCorrect: choiceIndex === correctIndex,
        answeredAt: Date.now(),
      })
      .link({ game: gameId, player: playerId }),
  );
}
