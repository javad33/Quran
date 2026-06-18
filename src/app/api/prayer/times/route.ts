import { NextResponse } from "next/server";
import { getPrayerTimes } from "@/lib/prayer-api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");
  const method = parseInt(searchParams.get("method") || "0", 10);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      { ok: false, error: "Invalid coordinates" },
      { status: 400 }
    );
  }
  try {
    const data = await getPrayerTimes(lat, lng, method);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
