export const DISCONNECT_GRACE_MS = 30_000;
export const PRESENCE_BOOTSTRAP_MS = 30_000;

export type GamePresenceData = {
  nickname?: string;
  playerId?: string;
  isHost?: boolean;
};

export function getOnlinePlayerIds(
  peers: Record<string, GamePresenceData>,
): Set<string> {
  const ids = new Set<string>();
  for (const peer of Object.values(peers)) {
    if (peer.playerId && !peer.isHost) {
      ids.add(peer.playerId);
    }
  }
  return ids;
}
