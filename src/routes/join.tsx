import { createFileRoute, Navigate } from "@tanstack/react-router";
import { JoinPage } from "@/components/JoinPage";
import { clearStoredPlayerId, getStoredPlayerId } from "@/lib/auth";
import { CODE_LENGTH, sanitizeCodeInput } from "@/lib/game";
import { lookupJoinableGame, playerExists } from "@/lib/join";

export const Route = createFileRoute("/join")({
  validateSearch: (search: Record<string, unknown>) => {
    const rawCode = typeof search.code === "string" ? search.code : "";
    return {
      code: sanitizeCodeInput(rawCode).slice(0, CODE_LENGTH),
    };
  },
  loaderDeps: ({ search }) => ({ code: search.code }),
  loader: async ({ deps }) => {
    const { game, error } = await lookupJoinableGame(deps.code);
    let canRejoin = false;

    if (game) {
      const existingPlayerId = getStoredPlayerId(game.code);
      if (existingPlayerId) {
        canRejoin = await playerExists(existingPlayerId);
        if (!canRejoin) {
          clearStoredPlayerId(game.code);
        }
      }
    }

    return { preloadedGame: game, preloadError: error, canRejoin };
  },
  component: JoinRoute,
});

function JoinRoute() {
  const { code } = Route.useSearch();
  const { preloadedGame, preloadError, canRejoin } = Route.useLoaderData();

  if (preloadedGame && canRejoin) {
    return (
      <Navigate to="/g/$code" params={{ code: preloadedGame.code }} replace />
    );
  }

  return (
    <JoinPage
      initialCode={code}
      preloadedGame={preloadedGame}
      preloadError={preloadError}
    />
  );
}
