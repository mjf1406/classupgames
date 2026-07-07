import { useEffect, type RefObject } from "react";
import { clearStoredPlayerId } from "@/lib/auth";
import { leaveGame } from "@/lib/useHostGameEngine";

export function useAutoLeaveOnClose({
  code,
  playerId,
  enabled,
  hasLeftRef,
}: {
  code: string;
  playerId: string | null;
  enabled: boolean;
  hasLeftRef: RefObject<boolean>;
}) {
  useEffect(() => {
    if (!enabled || !playerId) return;

    const handlePageHide = (event: PageTransitionEvent) => {
      if (event.persisted || hasLeftRef.current) return;
      void leaveGame(playerId);
      clearStoredPlayerId(code);
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [code, enabled, hasLeftRef, playerId]);
}
