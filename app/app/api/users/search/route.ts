import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { searchUsersByUsername } from "@/lib/users";

export async function GET(request: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const users = await searchUsersByUsername(query, session.userId);
  return NextResponse.json({ users });
}
