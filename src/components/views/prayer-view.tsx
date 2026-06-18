"use client";

import * as React from "react";
import {
  Clock,
  MapPin,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Navigation,
  Loader2,
  ChevronDown,
  CalendarDays,
  RefreshCw,
  AlertCircle,
  Info,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation, POPULAR_CITIES } from "@/lib/use-location";
import { useAppStore } from "@/lib/store";
import {
  PRAYER_METHODS,
  PRAYER_LABELS,
  formatTime,
  getNextPrayer,
  type PrayerResponse,
  type PrayerTimings,
} from "@/lib/prayer-api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  moon: Moon,
  sunrise: Sunrise,
  sun: Sun,
  sunset: Sunset,
};

const PERSIAN_WEEKDAYS: Record<string, string> = {
  Sunday: "یکشنبه",
  Monday: "دوشنبه",
  Tuesday: "سه‌شنبه",
  Wednesday: "چهارشنبه",
  Thursday: "پنجشنبه",
  Friday: "جمعه",
  Saturday: "شنبه",
};

const PRAYER_ORDER: (keyof PrayerTimings)[] = [
  "Fajr",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
];

interface NextInfo {
  key: string;
  label: string;
  time: string;
  remainingMs: number;
  progress: number; // 0..1 progress through the current interval
}

function formatCountdown(ms: number): string {
  const safe = Math.max(0, ms);
  const totalSec = Math.floor(safe / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Compute next prayer + progress through current interval. */
function computeNextInfo(timings: PrayerTimings): NextInfo | null {
  const base = getNextPrayer(timings);
  if (!base) return null;

  const now = Date.now();
  const points = PRAYER_ORDER.map((key) => {
    const raw = timings[key];
    const t = formatTime(raw ?? "");
    const [h, m] = t.split(":").map(Number);
    const dt = new Date();
    dt.setHours(h, m, 0, 0);
    return { key, target: dt.getTime() };
  });

  const nextIdx = PRAYER_ORDER.indexOf(base.key as keyof PrayerTimings);
  let prevTarget: number;
  if (nextIdx === 0) {
    // Next is Fajr — figure out if previous was Isha today or yesterday
    // If Fajr target is "today" (i.e., remainingMs < ~14h), prev was Isha yesterday
    // Otherwise prev was Isha today
    const ishaToday = points[4].target;
    if (ishaToday < now) {
      prevTarget = ishaToday;
    } else {
      prevTarget = ishaToday - 86400000;
    }
  } else {
    prevTarget = points[nextIdx - 1].target;
  }
  const nextTarget = now + base.remainingMs;
  const total = nextTarget - prevTarget;
  const elapsed = now - prevTarget;
  const progress = total > 0 ? Math.max(0, Math.min(1, elapsed / total)) : 0;

  return { ...base, progress };
}

function CircularProgress({
  value,
  size = 232,
  strokeWidth = 6,
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label="پیشرفت زمان نماز"
    >
      <svg
        width={size}
        height={size}
        className="block"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="oklch(1 0 0 / 0.15)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="oklch(0.78 0.15 75)"
          strokeWidth={strokeWidth}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

export function PrayerView() {
  const { coords, city, status, error, requestGeo, setManual } = useLocation();
  const prayerMethod = useAppStore((s) => s.prayerMethod);
  const setPrayerMethod = useAppStore((s) => s.setPrayerMethod);

  const [prayer, setPrayer] = React.useState<PrayerResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [hijri, setHijri] = React.useState<PrayerResponse | null>(null);
  const [hijriLoading, setHijriLoading] = React.useState(true);

  const [next, setNext] = React.useState<NextInfo | null>(null);
  const [countdown, setCountdown] = React.useState("00:00:00");
  const targetRef = React.useRef<number | null>(null);

  // Fetch prayer times when coords/method change.
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url = `/api/prayer/times?lat=${coords.lat}&lng=${coords.lng}&method=${prayerMethod}`;
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) {
          setPrayer(j.data);
          setNext(computeNextInfo(j.data.timings));
        } else {
          toast.error(j.error || "خطا در دریافت اوقات شرعی");
          setPrayer(null);
          setNext(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lng, prayerMethod]);

  // Fetch hijri date.
  React.useEffect(() => {
    let cancelled = false;
    setHijriLoading(true);
    const url = `/api/hijri?lat=${coords.lat}&lng=${coords.lng}`;
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j.ok) return;
        setHijri(j.data);
      })
      .catch(() => {
        /* silent */
      })
      .finally(() => {
        if (!cancelled) setHijriLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lng]);

  // Live countdown — recomputes target on next-prayer change, ticks every second.
  React.useEffect(() => {
    if (!next) return;
    targetRef.current = Date.now() + next.remainingMs;
    setCountdown(formatCountdown(next.remainingMs));

    const id = window.setInterval(() => {
      if (targetRef.current == null) return;
      const rem = targetRef.current - Date.now();
      if (rem <= 0) {
        setCountdown("00:00:00");
        // Recompute next prayer from cached timings.
        setPrayer((cur) => {
          if (cur) setNext(computeNextInfo(cur.timings));
          return cur;
        });
      } else {
        setCountdown(formatCountdown(rem));
      }
    }, 1000);

    return () => {
      window.clearInterval(id);
      targetRef.current = null;
    };
  }, [next]);

  const selectedCityName = React.useMemo(
    () => POPULAR_CITIES.find((c) => c.name === city)?.name ?? undefined,
    [city]
  );

  const isGeoLoading = status === "loading";

  // Hijri date display strings
  const hijriDate = hijri?.date?.hijri;
  const gregorianDate = hijri?.date?.gregorian;
  const weekdayFa = hijriDate?.weekday?.en
    ? PERSIAN_WEEKDAYS[hijriDate.weekday.en] ?? hijriDate.weekday.en
    : "";

  return (
    <div className="flex flex-col gap-5">
      {/* Section title */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold leading-tight">اوقات شرعی</h2>
            <p className="text-xs text-muted-foreground">
              زمان‌های نماز و یادآور قبل از اذان
            </p>
          </div>
        </div>
      </div>

      {/* Location bar */}
      <Card className="py-4">
        <CardContent className="flex flex-col gap-3 px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">موقعیت:</span>
              <span className="font-semibold">{city}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={requestGeo}
                disabled={isGeoLoading}
              >
                {isGeoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                موقعیت خودکار
              </Button>
              <Select
                value={selectedCityName}
                onValueChange={(name) => {
                  const c = POPULAR_CITIES.find((x) => x.name === name);
                  if (c) setManual({ lat: c.lat, lng: c.lng }, c.name);
                }}
              >
                <SelectTrigger size="sm" className="w-[180px]" aria-label="انتخاب شهر">
                  <SelectValue placeholder="انتخاب شهر" />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_CITIES.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Hijri date + method selector */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Hijri date */}
        <Card className="md:col-span-2 ornament-border">
          <CardContent className="flex items-center gap-4 px-4 py-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" />
            </span>
            {hijriLoading || !hijriDate ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            ) : (
              <div className="flex flex-col">
                <p className="font-arabic text-lg font-bold leading-tight text-foreground">
                  {weekdayFa}، {hijriDate.day}{" "}
                  <span className="font-arabic">{hijriDate.month.ar}</span>{" "}
                  {hijriDate.year} هجری قمری
                </p>
                <p className="text-xs text-muted-foreground">
                  {gregorianDate
                    ? `${gregorianDate.day}/${gregorianDate.month.number}/${gregorianDate.year} میلادی`
                    : ""}
                  {hijriDate.holidays && hijriDate.holidays.length > 0
                    ? " · " + hijriDate.holidays.join("، ")
                    : ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Method selector */}
        <Card className="py-4">
          <CardHeader className="pb-0 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              روش محاسبه
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <Select
              value={String(prayerMethod)}
              onValueChange={(v) => setPrayerMethod(Number(v))}
            >
              <SelectTrigger className="w-full" aria-label="روش محاسبه اوقات شرعی">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRAYER_METHODS.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Next prayer hero card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-emerald-600 text-primary-foreground shadow-lg">
        {/* Decorative pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, oklch(1 0 0 / 0.5) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden
        />
        {/* Decorative corner crescent */}
        <div
          className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, oklch(0.78 0.15 75 / 0.7), transparent 60%)",
          }}
          aria-hidden
        />
        <CardContent className="relative flex flex-col items-center gap-5 px-4 py-6 sm:py-8 md:flex-row md:justify-around">
          {loading || !next ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Skeleton className="h-5 w-24 bg-white/20" />
              <Skeleton className="h-12 w-44 bg-white/20" />
              <Skeleton className="h-6 w-32 bg-white/20" />
              <Skeleton className="h-3.5 w-40 bg-white/20" />
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary-foreground/70">
                  <Clock className="h-3.5 w-3.5" />
                  نماز بعدی
                </div>
                <p className="font-arabic text-3xl font-bold sm:text-4xl">
                  {next.label}
                </p>
                <p className="flex items-center gap-1.5 text-sm text-primary-foreground/80">
                  <Sunrise className="h-3.5 w-3.5" />
                  ساعت {next.time}
                </p>
              </div>

              <CircularProgress value={next.progress} size={220} strokeWidth={6}>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-primary-foreground/70">
                    زمان باقی‌مانده
                  </span>
                  <span className="font-mono text-4xl font-bold tabular-nums sm:text-5xl">
                    {countdown}
                  </span>
                  <span className="mt-1 text-[10px] text-primary-foreground/60">
                    ساعت:دقیقه:ثانیه
                  </span>
                </div>
              </CircularProgress>

              <div className="flex flex-col items-center gap-1.5 text-center">
                <Badge className="bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20">
                  {Math.round(next.progress * 100)}٪ از دوره فعلی
                </Badge>
                <p className="max-w-[12rem] text-xs text-primary-foreground/70">
                  پس از فرا رسیدن زمان، نماز را به‌هنگام بخوانید.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* All timings grid */}
      <div>
        <div className="divider-ornament mb-3">
          <span className="text-xs font-medium text-muted-foreground">
            تمام زمان‌های امروز
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {PRAYER_LABELS.map((p) => {
            const Icon = ICON_MAP[p.icon] ?? Clock;
            const time = prayer ? formatTime(prayer.timings[p.key] ?? "") : null;
            const isNext = next?.key === p.key;
            return (
              <Card
                key={p.key}
                className={cn(
                  "relative gap-0 py-4 transition-all",
                  isNext
                    ? "border-primary/60 bg-primary/5 ring-2 ring-primary/30"
                    : "hover:border-primary/30"
                )}
              >
                <CardContent className="flex flex-col items-center gap-2 px-3 text-center">
                  {isNext && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      بعدی
                    </Badge>
                  )}
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      isNext
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-xs font-medium text-muted-foreground">
                    {p.fa}
                  </p>
                  {time ? (
                    <p className="font-mono text-lg font-bold tabular-nums">
                      {time}
                    </p>
                  ) : (
                    <Skeleton className="h-6 w-14" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Extra info */}
      {prayer && (
        <Card className="py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-primary" />
              اطلاعات تکمیلی
            </CardTitle>
            <CardDescription className="text-xs">
              جزئیات منبع داده‌های اوقات شرعی
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 px-4 pt-2 text-sm sm:grid-cols-4">
            <InfoItem label="منطقه زمانی" value={prayer.meta.timezone} />
            <InfoItem
              label="موقعیت"
              value={`${coords.lat.toFixed(3)}°، ${coords.lng.toFixed(3)}°`}
            />
            <InfoItem label="روش" value={prayer.meta.method.name} />
            <InfoItem
              label="آخرین به‌روزرسانی"
              value={new Date().toLocaleTimeString("fa-IR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="truncate text-xs font-medium" title={value}>
        {value}
      </span>
    </div>
  );
}
