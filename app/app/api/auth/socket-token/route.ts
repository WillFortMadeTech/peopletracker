import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { verifySession } from "@/lib/auth";
import { JWT_SECRET } from "@/lib/constants";

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await new SignJWT({ userId: session.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(JWT_SECRET);

  return NextResponse.json({ token });
}
