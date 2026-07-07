import { createFileRoute } from "@tanstack/react-router";
import { RequireGoogleAuth } from "@/components/RequireGoogleAuth";
import { DeckBuilder } from "@/components/host/DeckBuilder";

export const Route = createFileRoute("/_host/d/$deckId")({
  component: DeckRoute,
});

function DeckRoute() {
  return (
    <RequireGoogleAuth>
      <DeckBuilder />
    </RequireGoogleAuth>
  );
}
