import { useCallback, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { clearStoredPlayerId } from "@/lib/auth";
import { joinSearchDefaults } from "@/lib/routes";
import { leaveGame } from "@/lib/useHostGameEngine";

export function useLeaveGame(code: string) {
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);
  const hasLeftRef = useRef(false);

  const markLeft = useCallback(() => {
    hasLeftRef.current = true;
  }, []);

  const leave = useCallback(
    async (playerId: string) => {
      markLeft();
      setIsLeaving(true);
      try {
        await leaveGame(playerId);
        clearStoredPlayerId(code);
        toast.success("You left the game.");
        await navigate({ to: "/join", search: joinSearchDefaults });
      } catch {
        toast.error("Could not leave the game. Try again.");
      } finally {
        setIsLeaving(false);
      }
    },
    [code, markLeft, navigate],
  );

  return { leave, isLeaving, hasLeftRef, markLeft };
}
