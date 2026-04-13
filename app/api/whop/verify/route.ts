import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.WHOP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "WHOP_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch("https://api.whop.com/api/v5/me", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "Whop API returned " + res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      ok: true,
      app_id: process.env.NEXT_PUBLIC_WHOP_APP_ID,
      whop_connected: true,
      account: data.username || data.id || "connected",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not reach Whop API" },
      { status: 502 }
    );
  }
}
