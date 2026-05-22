export function isPlaceholderResendApiKey(apiKey: string) {
  const normalized = apiKey.trim().toLowerCase();
  if (!normalized.startsWith("re_")) return false;
  return /^re_[x.*_\-]+$/.test(normalized);
}

export function getResendApiKey() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || isPlaceholderResendApiKey(apiKey)) return null;
  return apiKey;
}
