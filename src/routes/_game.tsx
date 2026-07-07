import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_game")({
  component: GameGroupLayout,
});

function GameGroupLayout() {
  return <Outlet />;
}