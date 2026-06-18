import { NextResponse } from "next/server";
import { getSurahBundle } from "@/lib/quran-api";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;
  const num = parseInt(number, 10);
  if (!num || num < 1 || num > 114) {
    return NextResponse.json(
      { ok: false, error: "Invalid surah number" },
      { status: 400 }
    );
  }
  try {
    const bundle = await getSurahBundle(num);
    return NextResponse.json({ ok: true, data: bundle });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
