export function generateTitle(message: string): string {
  const maxLength = 50;
  const cleaned = message.trim().replace(/\s+/g, " ");
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength) + "...";
}
