import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token: body.token },
  });

  if (!record || !record.identifier.startsWith("password-reset:")) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: body.token } }).catch(() => null);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  const email = record.identifier.slice("password-reset:".length);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (user.frozenAt) {
    return NextResponse.json({ error: "Account is suspended" }, { status: 403 });
  }

  const passwordHash = await bcrypt.hash(body.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.verificationToken.delete({ where: { token: body.token } }),
  ]);

  return NextResponse.json({ ok: true });
}
