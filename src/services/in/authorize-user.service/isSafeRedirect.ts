export const isSafeRedirect = (url: unknown): boolean => {
  if (typeof url !== "string") return false;

  if (!url.startsWith("/")) return false;
  if (url.startsWith("//")) return false;
  if (url.includes("\\")) return false;
  if (url.includes("\r") || url.includes("\n")) return false;

  return true;
};
