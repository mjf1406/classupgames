import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlayGameLayout } from "@/components/layouts/PlayGameLayout";
import { GamePlayScreen } from "@/components/game/GamePlayScreen";
import { getStoredPlayerId } from "@/lib/auth";
import { useGameSession } from "@/lib/useGameSession";

export const Route = createFileRoute("/_game/g/$code/play")({
  component: PlayRoute,
});

function PlayRoute() {
  const { code } = Route.useParams();
  const playerId = getStoredPlayerId(code);
  const navigate = useNavigate();
  const { upperCode, isLoading, game } = useGameSession(code, playerId);

  useEffect(() => {
    if (isLoading || !game) return;
    if (game.status !== "playing") {
      void navigate({
        to: "/g/$code",
        params: { code: upperCode },
      });
    }
  }, [game, isLoading, navigate, upperCode]);

  if (isLoading || !game || game.status !== "playing") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">Loading game...</p>
      </main>
    );
  }

  return (
    <PlayGameLayout code={code} playerId={playerId}>
      <GamePlayScreen code={code} playerId={playerId} />
    </PlayGameLayout>
  );
}
