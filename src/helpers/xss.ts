import type { ApiSafeHand } from "../components/HandComponent";

export const sanitizeDisplayName = (name: string): string =>
  name
    .trim()
    .slice(0, 32)
    .replace(/[^a-zA-Z0-9 _.-]/g, "");

export const sanitizeAvatarUrl = (url: string): string => {
    return isSafeAvatarUrl(url ?? "") ? url : "";
}

const isSafeAvatarUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.length > 0 &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
};

export const sanitizePeer = (h: ApiSafeHand): ApiSafeHand => ({
  ...h,
  name: sanitizeDisplayName(h.name ?? ""),
  avatarUrl: sanitizeAvatarUrl(h.avatarUrl ?? "")
});
