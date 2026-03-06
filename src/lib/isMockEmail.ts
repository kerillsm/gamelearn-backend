export function isMockEmail(email: string | undefined): boolean {
  if (!email) return false;
  return /^mock\+.+\@example\.com$/.test(email);
}
