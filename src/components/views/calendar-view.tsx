"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  Moon,
  Sun,
  Star,
  Sparkles,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface CalendarViewProps {
  hijriLabel?: string | null;
}

interface HijriData {
  date: string;
  day: string;
  month: { number: number; en: string; ar: string };
  year: string;
  weekday: { en: string; ar: string };
  holidays: string[];
}

interface ApiResponse {
  ok: boolean;
  data?: {
    date: {
      hijri: HijriData;
      gregorian: {
        date: string;
        day: string;
        month: { number: number; en: string };
        year: string;
        weekday: { en: string };
      };
    };
  };
  error?: string;
}

interface IslamicOccasion {
  day: number;
  month: number; // 1-12
  label: string;
  emoji?: string;
}

/** Hardcoded list of major Islamic occasions (Hijri lunar). */
const OCCASIONS: IslamicOccasion[] = [
  { day: 1, month: 1, label: "آغاز سال هجری قمری" },
  { day: 9, month: 1, label: "تاسوعای حسینی" },
  { day: 10, month: 1, label: "عاشورای حسینی" },
  { day: 20, month: 2, label: "اربعین حسینی" },
  { day: 28, month: 2, label: "رحلت پیامبر اکرم (ص) و شهادت امام حسن (ع)" },
  { day: 8, month: 3, label: "شهادت امام حسن عسکری (ع)" },
  { day: 17, month: 3, label: "میلاد پیامبر (ص) و امام صادق (ع)" },
  { day: 13, month: 7, label: "میلاد امیرالمؤمنین (ع)" },
  { day: 27, month: 7, label: "مبعث پیامبر اکرم (ص)" },
  { day: 15, month: 8, label: "میلاد امام زمان (عج)" },
  { day: 21, month: 9, label: "شهادت امام علی (ع)" },
  { day: 1, month: 10, label: "عید سعید فطر" },
  { day: 25, month: 11, label: "میلاد امام جواد (ع)" },
  { day: 9, month: 12, label: "روز عرفه" },
  { day: 10, month: 12, label: "عید سعید قربان" },
  { day: 18, month: 12, label: "عید سعید غدیر خم" },
];

const HIJRI_YEAR_DAYS = 354.367;
const AVG_MONTH_DAYS = 29.53;

/** Approximate day-of-year in the hijri calendar for (month, day). */
function hijriDayOfYear(month: number, day: number): number {
  return (month - 1) * AVG_MONTH_DAYS + day;
}

/** Find the next upcoming occasion from today's hijri month/day. */
function findNextOccasion(
  todayMonth: number,
  todayDay: number
): { occasion: IslamicOccasion; daysLeft: number } | null {
  if (OCCASIONS.length === 0) return null;
  const todayDoy = hijriDayOfYear(todayMonth, todayDay);
  let best: { occasion: IslamicOccasion; daysLeft: number } | null = null;
  for (const occ of OCCASIONS) {
    let diff = hijriDayOfYear(occ.month, occ.day) - todayDoy;
    if (diff < 0.5) diff += HIJRI_YEAR_DAYS;
    if (!best || diff < best.daysLeft) {
      best = { occasion: occ, daysLeft: diff };
    }
  }
  return best;
}

function toPersianDigits(s: string | number): string {
  const fa = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(s).replace(/\d/g, (d) => fa[Number(d)]);
}

function useHijriData() {
  const [data, setData] = React.useState<HijriData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/hijri")
      .then((r) => r.json())
      .then((j: ApiResponse) => {
        if (cancelled) return;
        if (j.ok && j.data?.date?.hijri) {
          setData(j.data.date.hijri);
        } else {
          setError(j.error || "خطا در دریافت تاریخ هجری");
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
  }, []);

  return { data, loading, error };
}

function useJalaliString() {
  return React.useMemo(() => {
    try {
      const fmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return fmt.format(new Date());
    } catch {
      return "";
    }
  }, []);
}

function useGregorianString() {
  return React.useMemo(() => {
    try {
      const fmt = new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return fmt.format(new Date());
    } catch {
      return "";
    }
  }, []);
}

export function CalendarView({ hijriLabel }: CalendarViewProps) {
  const { data: hijri, loading, error } = useHijriData();
  const jalaliStr = useJalaliString();
  const gregorianStr = useGregorianString();

  const nextOccasion = React.useMemo(() => {
    if (!hijri) return null;
    return findNextOccasion(hijri.month.number, parseInt(hijri.day, 10));
  }, [hijri]);

  const heroLabel =
    hijriLabel ?? (hijri ? `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ` : null);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <CalendarIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
              تقویم هجری
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              تاریخ‌های هجری قمری، شمسی و میلادی
            </p>
          </div>
        </div>
        <div className="divider-ornament">
          <Moon className="h-4 w-4 fill-current text-primary/60" />
        </div>
      </header>

      {/* Hero card */}
      <Card className="relative overflow-hidden rounded-2xl border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 shadow-sm">
        <div className="absolute -left-8 -top-8 opacity-10">
          <Moon className="h-40 w-40" />
        </div>
        <div className="relative flex flex-col items-center gap-3 text-center">
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            امروز در تقویم هجری
          </Badge>
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-9 w-56" />
              <Skeleton className="h-5 w-40" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            heroLabel && (
              <>
                <h2 className="font-arabic text-4xl font-bold leading-tight text-primary sm:text-5xl">
                  {heroLabel}
                </h2>
                {hijri && (
                  <p className="font-arabic text-base text-muted-foreground">
                    {hijri.weekday.ar}
                  </p>
                )}
                {hijri && hijri.holidays.length > 0 && (
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                    {hijri.holidays.map((h, i) => (
                      <Badge
                        key={i}
                        className="bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      >
                        <Star className="h-3 w-3 fill-current" />
                        {h}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            )
          )}
        </div>
      </Card>

      {/* Three date columns */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Hijri lunar */}
        <Card className="rounded-2xl border-emerald-500/20 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Moon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">هجری قمری</span>
          </div>
          {loading ? (
            <Skeleton className="h-12 w-32" />
          ) : hijri ? (
            <p className="font-arabic text-2xl font-bold leading-snug text-emerald-700 dark:text-emerald-300">
              {toPersianDigits(hijri.day)} {hijri.month.ar} {toPersianDigits(hijri.year)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">قمری · تقویم اسلامی</p>
        </Card>

        {/* Jalali */}
        <Card className="rounded-2xl border-amber-500/20 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sun className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">شمسی (جلالی)</span>
          </div>
          {jalaliStr ? (
            <p className="text-xl font-bold leading-snug text-amber-700 dark:text-amber-300">
              {jalaliStr}
            </p>
          ) : (
            <Skeleton className="h-12 w-40" />
          )}
          <p className="mt-1 text-xs text-muted-foreground">ایران · هجرت پیامبر</p>
        </Card>

        {/* Gregorian */}
        <Card className="rounded-2xl border-teal-500/20 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <CalendarIcon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">میلادی</span>
          </div>
          {gregorianStr ? (
            <p
              className="text-xl font-bold leading-snug text-teal-700 dark:text-teal-300"
              dir="ltr"
            >
              {gregorianStr}
            </p>
          ) : (
            <Skeleton className="h-12 w-40" />
          )}
          <p className="mt-1 text-xs text-muted-foreground">گرگوری · بین‌المللی</p>
        </Card>
      </div>

      {/* Upcoming occasion */}
      {nextOccasion && (
        <Card className="rounded-2xl border-primary/15 bg-gradient-to-l from-primary/5 to-transparent p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Clock className="h-5 w-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                نزدیک‌ترین مناسبت
              </p>
              <p className="font-bold leading-snug">
                {nextOccasion.occasion.label}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-arabic text-sm text-primary">
                  {toPersianDigits(nextOccasion.occasion.day)}{" "}
                  {HIJRI_MONTH_NAMES_AR[nextOccasion.occasion.month]}
                </span>
                <span className="text-muted-foreground/60">·</span>
                <span>
                  حدود {toPersianDigits(Math.round(nextOccasion.daysLeft))} روز
                  دیگر
                </span>
              </div>
            </div>
            <ChevronLeft className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </Card>
      )}
    </div>
  );
}

const HIJRI_MONTH_NAMES_AR: Record<number, string> = {
  1: "مُحَرَّم",
  2: "صَفَر",
  3: "رَبيع الاَوَّل",
  4: "رَبيع الثاني",
  5: "جُمادى الاُولى",
  6: "جُمادى الثانية",
  7: "رَجَب",
  8: "شَعْبان",
  9: "رَمَضان",
  10: "شَوّال",
  11: "ذو القَعدة",
  12: "ذو الحِجّة",
};
