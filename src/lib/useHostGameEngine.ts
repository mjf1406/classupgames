import { useEffect, useRef, useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import {
  REVEAL_DELAY_MS,
  STARTING_LIVES,
  getTimeRemaining,
  isQuestionExpired,
  resolveQuestion,
} from "@/lib/game";
import type { AnswerRecord, GameRecord, PlayerRecord } from "@/lib/types";

export function useHostGameEngine(
  game: GameRecord | null,
  players: PlayerRecord[],
  answers: AnswerRecord[],
) {
  const isResolvingRef = useRef(false);
  const [revealing, setRevealing] = useState(false);
  const [revealAnswer, setRevealAnswer] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!game || game.status !== "playing") return;

    const interval = window.setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);

      if (revealing || isResolvingRef.current) return;
      if (!game.questionStartedAt) return;
      if (players.length === 0) return;

      const questionIndex = game.currentQuestionIndex;
      const currentAnswers = answers.filter(
        (answer) => answer.questionIndex === questionIndex,
      );
      const allAnswered = currentAnswers.length >= players.length;
      const expired = isQuestionExpired(
        game.questionStartedAt,
        game.questionTimeSeconds,
        currentNow,
      );

      if (!allAnswered && !expired) return;

      isResolvingRef.current = true;
      window.setTimeout(() => {
        setRevealing(true);
        setRevealAnswer(
          game.questionsSnapshot[questionIndex]?.correctIndex ?? null,
        );

        const correctCount = currentAnswers.filter(
          (answer) => answer.isCorrect,
        ).length;
        const { progressGain, livesLost } = resolveQuestion({
          correctCount,
          playerCount: players.length,
          questionCount: game.questionsSnapshot.length,
        });

        const nextProgress = Math.min(100, game.progress + progressGain);
        const nextLives = game.lives - livesLost;
        const isLastQuestion =
          questionIndex >= game.questionsSnapshot.length - 1;

        window.setTimeout(() => {
          if (nextLives <= 0) {
            void db.transact(
              db.tx.games[game.id].update({
                status: "lost",
                progress: nextProgress,
                lives: 0,
              }),
            );
          } else if (isLastQuestion) {
            void db.transact(
              db.tx.games[game.id].update({
                status: nextLives > 0 ? "won" : "lost",
                progress: nextProgress,
                lives: Math.max(0, nextLives),
              }),
            );
          } else {
            void db.transact(
              db.tx.games[game.id].update({
                currentQuestionIndex: questionIndex + 1,
                questionStartedAt: Date.now(),
                progress: nextProgress,
                lives: nextLives,
              }),
            );
          }

          setRevealing(false);
          setRevealAnswer(null);
          isResolvingRef.current = false;
        }, REVEAL_DELAY_MS);
      }, 0);
    }, 250);

    return () => window.clearInterval(interval);
  }, [answers, game, players.length, revealing]);

  const timeRemaining = game
    ? getTimeRemaining(game.questionStartedAt, game.questionTimeSeconds, now)
    : 0;

  return { revealing, revealAnswer, timeRemaining };
}

export async function startGame(gameId: string) {
  await db.transact(
    db.tx.games[gameId].update({
      status: "playing",
      currentQuestionIndex: 0,
      questionStartedAt: Date.now(),
      progress: 0,
      lives: STARTING_LIVES,
    }),
  );
}

export async function launchGame({
  hostId,
  code,
  gameType,
  questionsSnapshot,
  questionTimeSeconds,
}: {
  hostId: string;
  code: string;
  gameType: string;
  questionsSnapshot: unknown;
  questionTimeSeconds: number;
}) {
  const gameId = id();
  await db.transact(
    db.tx.games[gameId]
      .update({
        code,
        gameType,
        status: "lobby",
        currentQuestionIndex: 0,
        progress: 0,
        lives: STARTING_LIVES,
        questionTimeSeconds,
        questionsSnapshot,
        createdAt: Date.now(),
      })
      .link({ host: hostId }),
  );
  return { gameId, code };
}

export async function joinGame({
  gameId,
  userId,
  nickname,
}: {
  gameId: string;
  userId: string;
  nickname: string;
}) {
  const playerId = id();
  await db.transact(
    db.tx.players[playerId]
      .update({
        nickname: nickname.trim(),
        joinedAt: Date.now(),
      })
      .link({ game: gameId, user: userId }),
  );
  return playerId;
}

export async function leaveGame(playerId: string) {
  await db.transact(db.tx.players[playerId].delete());
}

export async function cancelGame(gameId: string, playerIds: string[]) {
  await db.transact([
    ...playerIds.map((playerId) => db.tx.players[playerId].delete()),
    db.tx.games[gameId].delete(),
  ]);
}
