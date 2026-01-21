export function isValidSlug(slug: string): boolean {
  // Allows a-z, 0-9, hyphen and underscore
  const slugRegex = /^[a-z0-9_-]+$/i;
  return slugRegex.test(slug);
}
