import { Link, Outlet } from "@tanstack/react-router";
import { Gamepad2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { joinSearchDefaults } from "@/lib/routes";

export function GameLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/join"
            search={joinSearchDefaults}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <Gamepad2 className="size-4 text-primary" />
            <span className="hidden sm:inline">Squad Games</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <Outlet />
    </div>
  );
}
