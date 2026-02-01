import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/users";
import { verifyPassword, createSession } from "@/lib/auth";
import { logLoginAttempt } from "@/lib/loginLogs";

export async function POST(request: NextRequest) {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);

    if (!user) {
      await logLoginAttempt(email, null, false, ipAddress, userAgent);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      await logLoginAttempt(email, user.id, false, ipAddress, userAgent);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    await logLoginAttempt(email, user.id, true, ipAddress, userAgent);
    await createSession(user.id);

    return NextResponse.json({
      success: true,
      userId: user.id,
      hasUsername: !!user.username,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
