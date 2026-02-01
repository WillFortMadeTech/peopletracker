import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getLocationsByUser } from "@/lib/locations";

// Web dashboard endpoint - uses session auth
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const locations = await getLocationsByUser(
      session.userId,
      Math.min(limit, 1000)
    );

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Location fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
