import { useEffect } from "react";
import { db } from "@/lib/db";
import type { GamePresenceData } from "@/lib/presence";

export function useGameRoomPeers(gameId: string) {
  const room = db.room("game", gameId);
  const presence: GamePresenceData = { isHost: true };
  const { peers, publishPresence } = db.rooms.usePresence(room, {
    initialPresence: presence,
  });

  useEffect(() => {
    publishPresence({ isHost: true });
  }, [publishPresence]);

  return peers;
}
