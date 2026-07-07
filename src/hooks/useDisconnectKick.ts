import { useEffect, useRef } from "react";
import { db } from "@/lib/db";
import {
  DISCONNECT_GRACE_MS,
  PRESENCE_BOOTSTRAP_MS,
  getOnlinePlayerIds,
  type GamePresenceData,
} from "@/lib/presence";
import type { GameRecord, PlayerRecord } from "@/lib/types";

export function useDisconnectKick({
  game,
  players,
  peers,
  isHost,
  enabled,
}: {
  game: GameRecord | null;
  players: PlayerRecord[];
  peers: Record<string, GamePresenceData>;
  isHost: boolean;
  enabled: boolean;
}) {
  const missingSinceRef = useRef(new Map<string, number>());
  const seenOnlineRef = useRef(new Set<string>());
  const kickedRef = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || !isHost) return;

    const evaluate = () => {
      if (!game) return;
      if (game.status !== "lobby" && game.status !== "playing") {
        return;
      }

      const now = Date.now();
      const onlinePlayerIds = getOnlinePlayerIds(peers);

      for (const player of players) {
        if (kickedRef.current.has(player.id)) continue;

        if (onlinePlayerIds.has(player.id)) {
          seenOnlineRef.current.add(player.id);
          missingSinceRef.current.delete(player.id);
          continue;
        }

        const joinedAt = player.joinedAt ?? 0;
        const bootstrapExpired = now - joinedAt >= PRESENCE_BOOTSTRAP_MS;
        const wasOnline = seenOnlineRef.current.has(player.id);

        if (!wasOnline && !bootstrapExpired) {
          continue;
        }

        const missingSince = missingSinceRef.current.get(player.id);
        if (missingSince == null) {
          missingSinceRef.current.set(player.id, now);
          continue;
        }

        if (now - missingSince < DISCONNECT_GRACE_MS) {
          continue;
        }

        kickedRef.current.add(player.id);
        missingSinceRef.current.delete(player.id);
        seenOnlineRef.current.delete(player.id);
        void db.transact(db.tx.players[player.id].delete());
      }
    };

    evaluate();
    const interval = window.setInterval(evaluate, 5_000);
    return () => window.clearInterval(interval);
  }, [enabled, game, isHost, peers, players]);
}
