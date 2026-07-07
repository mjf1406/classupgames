import { db } from "@/lib/db";

export function isGoogleUser(
  user: { email?: string | null; isGuest?: boolean } | null | undefined,
) {
  return Boolean(user?.email && !user.isGuest);
}

export async function signInAsGuest() {
  const response = await db.auth.signInAsGuest();
  if (!response.user?.id) {
    throw new Error("Guest sign-in failed");
  }
  return { id: response.user.id };
}

export function getPlayerSessionKey(code: string) {
  return `player:${code.toUpperCase()}`;
}

export function getStoredPlayerId(code: string): string | null {
  return sessionStorage.getItem(getPlayerSessionKey(code));
}

export function storePlayerId(code: string, playerId: string) {
  sessionStorage.setItem(getPlayerSessionKey(code), playerId);
}

export function clearStoredPlayerId(code: string) {
  sessionStorage.removeItem(getPlayerSessionKey(code));
}

export function getNicknameSessionKey(code: string) {
  return `nickname:${code.toUpperCase()}`;
}

export function getStoredNickname(code: string): string | null {
  return sessionStorage.getItem(getNicknameSessionKey(code));
}

export function storeNickname(code: string, nickname: string) {
  sessionStorage.setItem(getNicknameSessionKey(code), nickname);
}

export function clearStoredNickname(code: string) {
  sessionStorage.removeItem(getNicknameSessionKey(code));
}
