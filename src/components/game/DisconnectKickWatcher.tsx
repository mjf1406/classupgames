import { useGameRoomPeers } from "@/hooks/useGameRoomPeers";
import { useDisconnectKick } from "@/hooks/useDisconnectKick";
import type { GameRecord, PlayerRecord } from "@/lib/types";

type DisconnectKickWatcherProps = {
  game: GameRecord;
  players: PlayerRecord[];
  isHost: boolean;
};

export function DisconnectKickWatcher({
  game,
  players,
  isHost,
}: DisconnectKickWatcherProps) {
  const peers = useGameRoomPeers(game.id);

  useDisconnectKick({
    game,
    players,
    peers,
    isHost,
    enabled: isHost,
  });

  return null;
}
