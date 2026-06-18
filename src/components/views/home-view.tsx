"use client";

import * as React from "react";
import {
  BookOpen,
  Clock,
  Compass,
  CircleDot,
  HeartHandshake,
  Calendar,
  ArrowLeft,
  Sparkles,
  Quote,
  Sunrise,
  MapPin,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { useLocation } from "@/lib/use-location";
import { useAppStore } from "@/lib/store";
import {
  formatTime,
  getNextPrayer,
  type PrayerTimings,
} from "@/lib/prayer-api";
import type { ViewId } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface HomeViewProps {
  onNavigate: (v: ViewId) => void;
  hijriLabel?: string | null;
}

interface AyahEntry {
  ref: string;
  ar: string;
  fa: string;
}

/** Curated list of beautiful ayahs — picked deterministically per day. */
const AYAHS: AyahEntry[] = [
  {
    ref: "البقرة · ۱۵۳",
    ar: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    fa: "ای کسانی که ایمان آورده‌اید! از صبر و نماز یاری بجویید؛ همانا خدا با صابران است.",
  },
  {
    ref: "الرعد · ۲۸",
    ar: "الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    fa: "همان کسانی که ایمان آورده‌اند و دل‌هایشان به یاد خدا آرام می‌گیرد. آگاه باشید که تنها با یاد خدا دل‌ها آرام می‌گیرد.",
  },
  {
    ref: "الزمر · ۵۳",
    ar: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا",
    fa: "بگو: ای بندگان من که بر خود اسراف کرده‌اید! از رحمت خدا نومید نشوید؛ همانا خدا همهٔ گناهان را می‌آمرزد.",
  },
  {
    ref: "البقرة · ۱۵۲",
    ar: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
    fa: "پس مرا یاد کنید تا شما را یاد کنم و شکر مرا بجا آورید و ناسپاسی نکنید.",
  },
  {
    ref: "آل عمران · ۱۳۹",
    ar: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ",
    fa: "و سست نشوید و غمگین نباشید، در حالی که شما برترید اگر ایمان داشته باشید.",
  },
  {
    ref: "الإسراء · ۸۰",
    ar: "وَقُل رَّبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ وَأَخْرِجْنِي مُخْرَجَ صِدْقٍ وَاجْعَل لِّي مِن لَّدُنكَ سُلْطَانًا نَّصِيرًا",
    fa: "و بگو: پروردگارا! مرا با راستی داخل کن و با راستی خارج گردان و از نزد خود قدرتی یار و یاور قرار ده.",
  },
  {
    ref: "الطلاق · ۲-۳",
    ar: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ",
    fa: "و هر کس از خدا بترسد، برای او راه خروجی قرار می‌دهد و از جایی که گمان نمی‌برد روزی‌اش می‌دهد.",
  },
  {
    ref: "هود · ۸۸",
    ar: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ ۚ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ",
    fa: "و توفیق من جز به خدا نیست؛ بر او توکل کرده‌ام و به سوی او بازمی‌گردم.",
  },
  {
    ref: "غافر · ۶۰",
    ar: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ",
    fa: "و پروردگارتان گفت: مرا بخوانید تا شما را اجابت کنم.",
  },
  {
    ref: "الفرقان · ۷۴",
    ar: "وَالَّذِينَ يَقُولُونَ رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ",
    fa: "و همان کسانی که می‌گویند: پروردگارا! از همسران و فرزندانمان مایهٔ روشنی چشم به ما عطا فرما.",
  },
  {
    ref: "الشعراء · ۷۸-۸۰",
    ar: "الَّذِي خَلَقَنِي فَهُوَ يَهْدِينِ ۝ وَالَّذِي هُوَ يُطْعِمُنِي وَيَسْقِينِ ۝ وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ",
    fa: "همان کسی که مرا آفرید، پس مرا هدایت می‌کند. و همان کسی که به من طعام می‌دهد و آب می‌نوشاند. و چون بیمار شوم، اوست که شفایم می‌دهد.",
  },
  {
    ref: "الأنفال · ۲۴",
    ar: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَجِيبُوا لِلَّهِ وَلِلرَّسُولِ إِذَا دَعَاكُمْ لِمَا يُحْيِيكُمْ",
    fa: "ای کسانی که ایمان آورده‌اید! به خدا و فرستادهٔ او لبیک گویید آن‌گاه که شما را به آنچه حیات می‌بخشد، فرامی‌خواند.",
  },
];

const DHIKR_OF_DAY: string[] = [
  "لَا حَوْلَ وَلَا قُوَّةَ اِلَّا بِاللّٰه",
  "سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ",
  "اَسْتَغْفِرُ اللّٰهَ وَاَتُوبُ اِلَيْهِ",
  "اَلْحَمْدُ لِلّٰهِ رَبِّ الْعٰالَمِينَ",
  "حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكِيلُ",
  "لَا اِلٰهَ اِلَّا اَنْتَ سُبْحَانَكَ اِنِّي كُنْتُ مِنَ الظّٰالِمِينَ",
];

function toPersianDigits(s: string | number): string {
  const fa = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(s).replace(/\d/g, (d) => fa[Number(d)]);
}

function pickDaily<T>(arr: T[]): T {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return arr[dayOfYear % arr.length];
}

function formatRemaining(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${toPersianDigits(pad(h))}:${toPersianDigits(pad(m))}:${toPersianDigits(pad(s))}`;
}

interface QuickTileProps {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
}

function QuickTile({ icon: Icon, label, description, onClick }: QuickTileProps) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start gap-2 rounded-2xl border border-border/60 bg-card p-4 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-semibold leading-tight">{label}</span>
      <span className="text-[11px] leading-tight text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

interface PrayerApiResponse {
  ok: boolean;
  data?: {
    timings: PrayerTimings;
  };
  error?: string;
}

function PrayerSummary({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { coords, city, status } = useLocation();
  const userLocation = useAppStore((s) => s.userLocation);
  const [timings, setTimings] = React.useState<PrayerTimings | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [now, setNow] = React.useState(() => Date.now());

  // Refresh "now" every second for the countdown
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Only fetch when the user has explicitly set a location.
  const hasLocation = Boolean(userLocation) || status === "granted" || status === "manual";

  React.useEffect(() => {
    if (!hasLocation) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(
      `/api/prayer/times?lat=${coords.lat}&lng=${coords.lng}&method=0`
    )
      .then((r) => r.json())
      .then((j: PrayerApiResponse) => {
        if (cancelled) return;
        if (j.ok && j.data?.timings) {
          setTimings(j.data.timings);
        } else {
          setError(j.error || "خطا در دریافت اوقات شرعی");
        }
      })
      .catch(() => {
        if (!cancelled) setError("خطا در ارتباط با سرور");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lng, hasLocation]);

  if (!hasLocation) {
    return (
      <Card className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold leading-tight">اوقات شرعی</p>
            <p className="text-[11px] text-muted-foreground">برای نمایش اوقات نماز</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          موقعیت خود را تنظیم کنید تا اوقات شرعی و نماز بعدی نمایش داده شود.
        </p>
        <Button
          onClick={() => onNavigate("prayer")}
          size="sm"
          className="w-fit rounded-xl"
        >
          تنظیم موقعیت
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Card>
    );
  }

  const next = timings ? getNextPrayer(timings) : null;
  const remaining = next ? next.remainingMs - (Date.now() - now) : 0;

  return (
    <Card className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sunrise className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold leading-tight">اوقات شرعی</p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{city}</span>
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("prayer")}
          className="text-muted-foreground hover:text-primary"
        >
          جزئیات
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-16 w-full" />
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : next && timings ? (
        <div className="rounded-xl bg-primary/5 p-3">
          <p className="text-xs text-muted-foreground">نماز بعدی</p>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="font-arabic text-lg font-bold text-primary">
              {next.label}
            </span>
            <span className="text-sm tabular-nums text-foreground">
              {next.time}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>تا اذان:</span>
            <span className="font-mono text-sm font-semibold text-primary tabular-nums">
              {formatRemaining(remaining)}
            </span>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

export function HomeView({ onNavigate, hijriLabel }: HomeViewProps) {
  // Pick deterministic ayah & dhikr of the day — memoized once per mount.
  const ayah = React.useMemo(() => pickDaily(AYAHS), []);
  const dhikr = React.useMemo(() => pickDaily(DHIKR_OF_DAY), []);

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <Card className="relative overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-primary via-primary to-emerald-700 p-6 text-primary-foreground shadow-md sm:p-8">
        <div className="absolute -left-10 -top-10 opacity-10">
          <Sparkles className="h-44 w-44" />
        </div>
        <div className="absolute -bottom-12 -right-8 opacity-10">
          <BookOpen className="h-40 w-40" />
        </div>
        <div className="relative flex flex-col items-center gap-3 text-center">
          <p className="font-quran text-2xl leading-loose sm:text-3xl">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <div className="divider-ornament w-full max-w-xs text-primary-foreground/50">
            <Sparkles className="h-4 w-4 fill-current" />
          </div>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">نور</h1>
          <p className="text-sm text-primary-foreground/80 sm:text-base">
            خوش آمدید — قرآن و یاد خدا همراه شماست
          </p>
          {hijriLabel && (
            <Badge className="mt-1 border-primary-foreground/30 bg-primary-foreground/15 px-3 py-1 text-xs text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="font-arabic">{hijriLabel}</span>
            </Badge>
          )}
        </div>
      </Card>

      {/* Ayah of the day */}
      <Card className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Quote className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold leading-tight">آیهٔ روز</p>
              <p className="text-[11px] text-muted-foreground">از قرآن کریم</p>
            </div>
          </div>
          <Badge variant="outline" className="font-arabic text-xs">
            {ayah.ref}
          </Badge>
        </div>
        <p
          className="font-quran text-right text-xl leading-loose sm:text-2xl"
          dir="rtl"
        >
          {ayah.ar}
        </p>
        <p
          className="text-justify text-sm leading-7 text-muted-foreground"
          dir="rtl"
        >
          {ayah.fa}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate("quran")}
          className="mt-1 w-fit rounded-xl"
        >
          خواندن در قرآن
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Card>

      {/* Prayer + Dhikr row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PrayerSummary onNavigate={onNavigate} />

        {/* Dhikr of the day */}
        <Card className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-transparent to-transparent p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <CircleDot className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold leading-tight">ذکر روز</p>
              <p className="text-[11px] text-muted-foreground">تسبیح و یاد خدا</p>
            </div>
          </div>
          <p
            className="font-arabic text-center text-2xl leading-loose text-primary"
            dir="rtl"
          >
            {dhikr}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("tasbih")}
            className="w-fit rounded-xl"
          >
            شمارش
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Card>
      </div>

      {/* Quick access */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-muted-foreground">
            دسترسی سریع
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <QuickTile
            icon={BookOpen}
            label="قرآن کریم"
            description="تلاوت و ترجمه"
            onClick={() => onNavigate("quran")}
          />
          <QuickTile
            icon={Clock}
            label="اوقات شرعی"
            description="نمازهای روزانه"
            onClick={() => onNavigate("prayer")}
          />
          <QuickTile
            icon={Compass}
            label="قبله‌نما"
            description="جهت قبله"
            onClick={() => onNavigate("qibla")}
          />
          <QuickTile
            icon={CircleDot}
            label="تسبیح‌شمار"
            description="شمارش ذکر"
            onClick={() => onNavigate("tasbih")}
          />
          <QuickTile
            icon={HeartHandshake}
            label="مفاتیح الجنان"
            description="ادعیه و زیارات"
            onClick={() => onNavigate("mafatih")}
          />
          <QuickTile
            icon={Calendar}
            label="تقویم هجری"
            description="مناسبت‌ها"
            onClick={() => onNavigate("calendar")}
          />
        </div>
      </div>
    </div>
  );
}
