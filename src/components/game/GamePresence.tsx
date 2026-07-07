import { useEffect } from "react";
import { db } from "@/lib/db";

type GamePlayerPresenceProps = {
  gameId: string;
  playerId: string;
  nickname: string;
};

export function GamePlayerPresence({
  gameId,
  playerId,
  nickname,
}: GamePlayerPresenceProps) {
  const room = db.room("game", gameId);
  const { publishPresence } = db.rooms.usePresence(room, {
    initialPresence: { nickname, playerId },
  });

  useEffect(() => {
    publishPresence({ nickname, playerId });
  }, [nickname, playerId, publishPresence]);

  return null;
}

type GameHostPresenceProps = {
  gameId: string;
};

export function GameHostPresence({ gameId }: GameHostPresenceProps) {
  const room = db.room("game", gameId);
  const { publishPresence } = db.rooms.usePresence(room, {
    initialPresence: { isHost: true },
  });

  useEffect(() => {
    publishPresence({ isHost: true });
  }, [publishPresence]);

  return null;
}
