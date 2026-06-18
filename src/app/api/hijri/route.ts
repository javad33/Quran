import { NextResponse } from "next/server";
import { gregorianToHijri } from "@/lib/prayer-api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const dateStr = searchParams.get("date"); // YYYY-MM-DD
  const date = dateStr ? new Date(dateStr) : new Date();
  const lat = latParam ? parseFloat(latParam) : undefined;
  const lng = lngParam ? parseFloat(lngParam) : undefined;
  try {
    const g = await gregorianToHijri(date, lat, lng);
    // Normalize to the same shape as /api/prayer/times so consumers can use data.date.hijri
    return NextResponse.json({
      ok: true,
      data: {
        date: { hijri: g.hijri, gregorian: g.gregorian },
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
