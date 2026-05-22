"use client";

import { HONEYPOT_FIELD } from "@/lib/security/honeypot";

/** Visually hidden honeypot input — bots fill this; humans should not. */
export function HoneypotField() {
  return (
    <div
      aria-hidden="true"
      className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden"
    >
      <label htmlFor={HONEYPOT_FIELD}>Website</label>
      <input
        id={HONEYPOT_FIELD}
        name={HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}

export { HONEYPOT_FIELD };
