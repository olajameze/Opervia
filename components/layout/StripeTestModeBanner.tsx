"use client";

export function StripeTestModeBanner() {
  const isTestMode =
    process.env.NEXT_PUBLIC_STRIPE_TEST_MODE === "true" ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_");

  if (!isTestMode) return null;

  return (
    <div
      role="status"
      className="fixed top-0 inset-x-0 z-[60] bg-amber-500 text-amber-950 text-center text-xs font-medium py-1.5 px-4"
    >
      Stripe test mode — no real charges will be processed.
    </div>
  );
}
