/** Hidden field bots often fill in. Must stay empty for legitimate users. */
export const HONEYPOT_FIELD = "_website";

export function isHoneypotTriggered(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  return String(value).trim().length > 0;
}
