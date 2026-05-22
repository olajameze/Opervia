/**
 * Send a test email via Resend using values from .env
 *
 * Usage:
 *   npm run email:test
 *
 * Required in .env:
 *   RESEND_API_KEY=re_xxxxxxxxx   ← replace with your real key
 *
 * Optional:
 *   RESEND_FROM=onboarding@resend.dev
 *   RESEND_TEST_TO=opervia@gmail.com
 */
import { getResend } from "../lib/resend-client";

async function main() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || apiKey === "re_xxxxxxxxx") {
    console.error("Set RESEND_API_KEY in .env to your real Resend API key (re_...).");
    process.exit(1);
  }

  const from = process.env.RESEND_FROM?.trim() || "onboarding@resend.dev";
  const to = process.env.RESEND_TEST_TO?.trim() || "opervia@gmail.com";

  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: "Hello World",
    html: "<p>Congrats on sending your <strong>first email</strong> from Opervia!</p>",
    text: "Congrats on sending your first email from Opervia!",
  });

  if (error) {
    console.error("Resend error:", error.message);
    process.exit(1);
  }

  console.log("Email sent:", data?.id);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
