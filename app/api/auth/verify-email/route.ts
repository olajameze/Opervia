import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailWithToken } from "@/lib/registration-emails";
import { ipRateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  token: z.string().min(1),
});

export async function POST(req: Request) {
  const rateLimited = ipRateLimit(req, "verify-email", 30, 60 * 60 * 1000);
  if (rateLimited) return rateLimited;
  let token: string;
  try {
    token = schema.parse(await req.json()).token;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const result = await verifyEmailWithToken(token);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    email: result.email,
    name: result.name,
  });
}
