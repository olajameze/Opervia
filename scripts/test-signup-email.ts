/**
 * Send a signup admin notification email (same path as real registrations).
 *
 * Usage:
 *   npm run email:test-signup
 */
import { sendNewSignupAdminNotification } from "../lib/registration-emails";
import { getSignupNotifyEmail } from "../lib/registration-emails";
import { getEmailConfigError } from "../lib/email";

async function main() {
  const configError = getEmailConfigError();
  if (configError) {
    console.error(`Email not configured: ${configError}`);
    console.error("Set RESEND_API_KEY and RESEND_FROM in .env before running this test.");
    process.exit(1);
  }

  const notifyEmail = getSignupNotifyEmail();
  const sample = {
    email: "launch-test@example.com",
    name: "Launch Test User",
    method: "credentials" as const,
  };

  const result = await sendNewSignupAdminNotification(sample);

  if (!result.ok) {
    console.error("Signup notification failed:", result.error);
    process.exit(1);
  }

  console.log(`Signup admin notification sent to ${notifyEmail}`);
  if (result.dev) {
    console.log("(Dev mode — logged to console instead of Resend)");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
