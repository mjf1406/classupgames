import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { cancelGame } from "@/lib/useHostGameEngine";

export function useCancelGame() {
  const navigate = useNavigate();
  const [isCancelling, setIsCancelling] = useState(false);

  const cancel = useCallback(
    async (gameId: string, playerIds: string[]) => {
      setIsCancelling(true);
      try {
        await cancelGame(gameId, playerIds);
        toast.success("Game cancelled.");
        await navigate({ to: "/" });
      } catch {
        toast.error("Could not cancel the game. Try again.");
      } finally {
        setIsCancelling(false);
      }
    },
    [navigate],
  );

  return { cancel, isCancelling };
}
