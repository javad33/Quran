import { NextResponse } from "next/server";
import { searchQuranPersian } from "@/lib/quran-api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  if (!q.trim()) {
    return NextResponse.json({ ok: true, data: [] });
  }
  try {
    const results = await searchQuranPersian(q);
    return NextResponse.json({ ok: true, data: results });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
