import { id } from "@instantdb/react";
import { RobotGame, SubmarineGame } from "@/components/game/GameVisuals";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/db";
import { STARTING_LIVES } from "@/lib/game";
import { useGameSession } from "@/lib/useGameSession";
import { useHostGameEngine } from "@/lib/useHostGameEngine";
import { cn } from "@/lib/utils";
const ANSWER_COLORS = [
  "bg-red-500 hover:bg-red-600",
  "bg-blue-500 hover:bg-blue-600",
  "bg-amber-500 hover:bg-amber-600",
  "bg-emerald-500 hover:bg-emerald-600",
];

type GamePlayScreenProps = {
  code: string;
  playerId: string | null;
};

function submitAnswer({
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

export function GamePlayScreen({ code, playerId }: GamePlayScreenProps) {
  const {
    game,
    players,
    answers,
    isHost,
    currentPlayer,
    gameMeta,
    currentQuestion,
    currentAnswers,
    myAnswer,
  } = useGameSession(code, playerId);

  const { revealing, revealAnswer, timeRemaining } = useHostGameEngine(
    isHost ? game : null,
    players,
    answers,
  );

  const handleAnswer = (choiceIndex: number) => {
    if (!game || !currentPlayer || !currentQuestion || myAnswer) return;
    if (game.status !== "playing" || revealing) return;

    void submitAnswer({
      gameId: game.id,
      playerId: currentPlayer.id,
      questionIndex: game.currentQuestionIndex,
      choiceIndex,
      correctIndex: currentQuestion.correctIndex,
    });
  };

  if (!game) return null;

  const GameVisual = game.gameType === "robot" ? RobotGame : SubmarineGame;

  return (
    <div className="space-y-6 p-6">
      <GameVisual
        progress={game.progress}
        lives={game.lives}
        maxLives={STARTING_LIVES}
        resourceLabel={gameMeta?.resource ?? "Resource"}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg leading-snug">
              {currentQuestion?.text ?? "Loading question..."}
            </CardTitle>
            <span className="shrink-0 font-mono text-2xl font-bold tabular-nums text-primary">
              {Math.ceil(timeRemaining)}
            </span>
          </div>
          <Progress
            value={(timeRemaining / game.questionTimeSeconds) * 100}
            className="h-1.5"
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {revealing && revealAnswer !== null ? (
            <p className="text-center text-sm text-muted-foreground">
              Correct answer:{" "}
              <span className="font-medium text-foreground">
                {currentQuestion?.options[revealAnswer]}
              </span>
            </p>
          ) : null}

          {isHost ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {currentQuestion?.options.map((option, index) => (
                <div
                  key={index}
                  className={cn(
                    "rounded-lg px-4 py-3 text-sm font-medium text-white",
                    ANSWER_COLORS[index],
                    revealAnswer === index && "ring-4 ring-white/50",
                  )}
                >
                  {option}
                </div>
              ))}
              <p className="col-span-full text-center text-sm text-muted-foreground">
                {currentAnswers.length}/{players.length} players answered
              </p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {currentQuestion?.options.map((option, index) => (
                <Button
                  key={index}
                  className={cn(
                    "h-auto min-h-14 justify-start px-4 py-3 text-left text-white",
                    ANSWER_COLORS[index],
                  )}
                  disabled={Boolean(myAnswer) || revealing}
                  onClick={() => void handleAnswer(index)}
                >
                  {option}
                </Button>
              ))}
              {myAnswer ? (
                <p className="col-span-full text-center text-sm text-muted-foreground">
                  Answer submitted — waiting for the squad...
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
