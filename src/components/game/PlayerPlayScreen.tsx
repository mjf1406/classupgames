import { AnswerStatusFooter } from "@/components/game/AnswerOption";
import { QuestionAnswerInput } from "@/components/game/QuestionAnswerInput";
import { QuestionImageSlot } from "@/components/game/QuestionImageSlot";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { formatDistance, getQuestionTypeLabel } from "@/lib/game";
import type { PlayerAnswerInput } from "@/lib/game";
import type { AnswerRecord, GameRecord, QuestionSnapshot } from "@/lib/types";

type PlayerPlayScreenProps = {
  game: GameRecord;
  currentQuestion: QuestionSnapshot | null;
  myAnswer: AnswerRecord | null;
  myStreak: number;
  myStreakMultiplier: number;
  myDistance: number;
  totalDistance: number;
  questionStartedAt?: number | null;
  onAnswer: (input: PlayerAnswerInput) => void;
};

export function PlayerPlayScreen({
  game,
  currentQuestion,
  myAnswer,
  myStreak,
  myStreakMultiplier,
  myDistance,
  totalDistance,
  questionStartedAt,
  onAnswer,
}: PlayerPlayScreenProps) {
  const timeRemaining = useQuestionTimer(
    questionStartedAt,
    game.questionTimeSeconds,
    game.status === "playing" && !myAnswer,
  );

  return (
    <div className="flex min-h-dvh w-full flex-col p-4 md:p-6">
      <header className="mx-auto w-full max-w-4xl shrink-0 border-b border-border/60 pb-4">
        <div className="flex w-full flex-col items-center">
          <div className="font-mono text-5xl font-bold tabular-nums text-primary md:text-6xl">
            {Math.ceil(timeRemaining)}
          </div>
          <Progress
            value={(timeRemaining / game.questionTimeSeconds) * 100}
            className="mt-3 h-1.5 w-full"
          />
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-4xl shrink-0 flex-col items-center pt-4">
        {currentQuestion ? (
          <Badge variant="outline" className="mb-3">
            {getQuestionTypeLabel(currentQuestion.questionType)}
          </Badge>
        ) : null}

        <h1 className="w-full text-center text-2xl font-semibold leading-snug md:text-3xl">
          {currentQuestion?.text ?? "Loading question..."}
        </h1>
      </section>

      <QuestionImageSlot className="mx-auto min-h-0 w-full max-w-4xl flex-1" />

      <footer className="mx-auto mt-auto w-full max-w-4xl shrink-0 flex flex-col gap-3 pt-4">
        {currentQuestion ? (
          <QuestionAnswerInput
            key={`${currentQuestion.text}-${currentQuestion.questionType}`}
            question={currentQuestion}
            disabled={Boolean(myAnswer)}
            onSubmit={onAnswer}
          />
        ) : null}

        <AnswerStatusFooter
          message={
            myAnswer
              ? myAnswer.isCorrect
                ? `+${myAnswer.distanceGained} m — keep the streak going!`
                : "Wrong — streak reset. Next question..."
              : null
          }
        />

        <div className="flex w-full flex-wrap items-center justify-center gap-2 text-sm">
          <Badge variant="secondary">
            Squad: {formatDistance(totalDistance)}
          </Badge>
          <Badge variant="outline">You: {formatDistance(myDistance)}</Badge>
          {myStreak > 0 ? (
            <Badge>Streak x{myStreakMultiplier} on next correct</Badge>
          ) : (
            <Badge variant="outline">Next correct: 1 m</Badge>
          )}
        </div>
      </footer>
    </div>
  );
}
