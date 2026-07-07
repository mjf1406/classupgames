import { createFileRoute } from "@tanstack/react-router";
import { GameLobbyScreen } from "@/components/game/GameLobbyScreen";
import { getStoredPlayerId } from "@/lib/auth";

export const Route = createFileRoute("/_game/g/$code/")({
  component: GameLobbyRoute,
});

function GameLobbyRoute() {
  const { code } = Route.useParams();
  const playerId = getStoredPlayerId(code);

  return <GameLobbyScreen code={code} playerId={playerId} />;
}
