import { NextResponse } from "next/server";
import { getAllSurahs } from "@/lib/quran-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const surahs = await getAllSurahs();
    return NextResponse.json({ ok: true, data: surahs });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
