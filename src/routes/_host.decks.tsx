import { createFileRoute } from "@tanstack/react-router";
import { RequireGoogleAuth } from "@/components/RequireGoogleAuth";
import { HostDashboard } from "@/components/host/HostDashboard";

export const Route = createFileRoute("/_host/decks")({
  component: DecksRoute,
});

function DecksRoute() {
  return (
    <RequireGoogleAuth>
      <HostDashboard />
    </RequireGoogleAuth>
  );
}
