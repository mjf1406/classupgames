import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_game/g/$code")({
  component: GameCodeLayout,
});

function GameCodeLayout() {
  return <Outlet />;
}
