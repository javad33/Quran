"use client";

import * as React from "react";
import { RotateCcw, Sparkles, Star, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** Preset dhikr list. */
const PRESET_DHIKR: string[] = [
  "سُبْحَانَ اللّٰه",
  "اَلْحَمْدُ لِلّٰه",
  "اَللّٰهُ اَكْبَر",
  "اَللّٰهُمَّ صَلِّ عَلٰى مُحَمَّدٍ وَآلِ مُحَمَّدٍ",
  "لَا اِلٰهَ اِلَّا اللّٰه",
  "اَسْتَغْفِرُ اللّٰه",
];

const TARGETS = [33, 99, 100, 1000];

/** SVG circle geometry. */
const RADIUS = 130;
const STROKE = 14;
const CIRC = 2 * Math.PI * RADIUS;

function toPersianDigits(n: number): string {
  const fa = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(n).replace(/\d/g, (d) => fa[Number(d)]);
}

export function TasbihView() {
  const tasbihCounts = useAppStore((s) => s.tasbihCounts);
  const incrementTasbih = useAppStore((s) => s.incrementTasbih);
  const resetTasbih = useAppStore((s) => s.resetTasbih);
  const tasbihTarget = useAppStore((s) => s.tasbihTarget);
  const setTasbihTarget = useAppStore((s) => s.setTasbihTarget);

  const [selected, setSelected] = React.useState<string>(PRESET_DHIKR[0]);
  const [customDhikr, setCustomDhikr] = React.useState("");

  const count = tasbihCounts[selected] || 0;
  const totalAll = React.useMemo(
    () => Object.values(tasbihCounts).reduce((a, b) => a + b, 0),
    [tasbihCounts]
  );

  // progress within the current round
  const roundCount = tasbihTarget > 0 ? count % tasbihTarget : 0;
  const progress = tasbihTarget > 0 ? roundCount / tasbihTarget : 0;
  const isRoundComplete = tasbihTarget > 0 && count > 0 && roundCount === 0;
  const completedRounds =
    tasbihTarget > 0 ? Math.floor(count / tasbihTarget) : 0;

  const handleTap = React.useCallback(() => {
    incrementTasbih(selected);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(15);
    }
    const next = count + 1;
    if (tasbihTarget > 0 && next % tasbihTarget === 0) {
      toast.success("الحمدلله! یک دور کامل", {
        description: `دور ${toPersianDigits(Math.floor(next / tasbihTarget))} تکمیل شد`,
      });
    }
  }, [count, incrementTasbih, selected, tasbihTarget]);

  const handleSelectPreset = (val: string) => {
    setSelected(val);
    setCustomDhikr("");
  };

  const handleAddCustom = () => {
    const v = customDhikr.trim();
    if (!v) return;
    setSelected(v);
    toast.success("ذکر سفارشی انتخاب شد");
  };

  const handleResetCurrent = () => {
    resetTasbih(selected);
    toast.success("شمارندهٔ این ذکر صفر شد");
  };

  const handleResetAll = () => {
    // Reset every key currently in the store.
    Object.keys(tasbihCounts).forEach((k) => resetTasbih(k));
    toast.success("همهٔ شمارنده‌ها صفر شد");
  };

  // SVG ring offset (1 = empty, 0 = full)
  const dashOffset = CIRC * (1 - progress);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Star className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
              تسبیح‌شمار
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              ذکر بگو و شمار — هر ذکر شمارش خود را دارد
            </p>
          </div>
        </div>
        <div className="divider-ornament">
          <Sparkles className="h-4 w-4 fill-current text-primary/60" />
        </div>
      </header>

      {/* Dhikr selector */}
      <Card className="rounded-2xl bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">ذکر فعلی</p>
          <span className="font-arabic text-sm text-primary">{selected}</span>
        </div>
        <Select value={selected} onValueChange={handleSelectPreset}>
          <SelectTrigger className="h-11 w-full rounded-xl" dir="rtl">
            <SelectValue placeholder="یک ذکر انتخاب کنید" />
          </SelectTrigger>
          <SelectContent>
            {PRESET_DHIKR.map((d) => (
              <SelectItem key={d} value={d}>
                <span className="font-arabic text-base">{d}</span>
              </SelectItem>
            ))}
            {/* Custom dhikr already in store */}
            {Object.keys(tasbihCounts)
              .filter((k) => !PRESET_DHIKR.includes(k))
              .map((k) => (
                <SelectItem key={k} value={k}>
                  <span className="font-arabic text-base">{k}</span>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Custom input */}
        <div className="mt-3 flex gap-2">
          <Input
            value={customDhikr}
            onChange={(e) => setCustomDhikr(e.target.value)}
            placeholder="یا ذکر دلخواه خود را بنویسید..."
            className="h-10 rounded-xl"
            dir="rtl"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddCustom();
            }}
          />
          <Button
            onClick={handleAddCustom}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
            aria-label="افزودن ذکر سفارشی"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Counter circle */}
      <Card className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm">
        <div className="absolute inset-0 -z-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="relative flex flex-col items-center gap-4">
          {/* Round badge */}
          {tasbihTarget > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs">
              <span className="text-muted-foreground">دور:</span>
              <span className="font-semibold text-primary">
                {toPersianDigits(completedRounds)}
              </span>
              {isRoundComplete && count > 0 && (
                <span className="animate-soft-pulse text-primary">✦</span>
              )}
            </div>
          )}

          {/* Tap circle */}
          <button
            onClick={handleTap}
            aria-label="افزایش شمارنده"
            className={cn(
              "group relative flex h-72 w-72 items-center justify-center rounded-full transition-transform active:scale-95 sm:h-80 sm:w-80",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            )}
          >
            {/* Glow */}
            <span
              className={cn(
                "absolute inset-2 rounded-full bg-primary/10 blur-2xl transition-opacity",
                isRoundComplete ? "opacity-100" : "opacity-60"
              )}
            />
            {/* SVG ring */}
            <svg
              className="absolute inset-0 h-full w-full -rotate-90"
              viewBox="0 0 300 300"
              fill="none"
            >
              <defs>
                <linearGradient
                  id="tasbihGrad"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor="oklch(0.7 0.15 75)" />
                  <stop offset="100%" stopColor="oklch(0.45 0.11 162)" />
                </linearGradient>
              </defs>
              {/* Track */}
              <circle
                cx="150"
                cy="150"
                r={RADIUS}
                stroke="oklch(0.45 0.11 162 / 0.12)"
                strokeWidth={STROKE}
                fill="none"
              />
              {/* Progress */}
              <circle
                cx="150"
                cy="150"
                r={RADIUS}
                stroke="url(#tasbihGrad)"
                strokeWidth={STROKE}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={CIRC}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 0.25s ease" }}
              />
            </svg>

            {/* Inner gradient circle */}
            <span className="absolute inset-8 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-inner ring-1 ring-primary-foreground/10" />

            {/* Count + dhikr */}
            <span className="relative z-10 flex flex-col items-center gap-1 px-6 text-center">
              <span className="font-arabic text-lg leading-tight text-primary-foreground/90">
                {selected}
              </span>
              <span className="text-6xl font-bold leading-none text-primary-foreground tabular-nums sm:text-7xl">
                {toPersianDigits(roundCount)}
              </span>
              <span className="text-xs text-primary-foreground/70">
                از {toPersianDigits(tasbihTarget)}
              </span>
            </span>
          </button>

          <p className="text-center text-xs text-muted-foreground">
            برای شمارش، روی دایره ضربه بزنید
          </p>
        </div>
      </Card>

      {/* Target chips */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted-foreground">هدف هر دور</p>
        <div className="flex flex-wrap gap-2">
          {TARGETS.map((t) => (
            <button
              key={t}
              onClick={() => setTasbihTarget(t)}
              className={cn(
                "flex min-w-[3.5rem] items-center justify-center rounded-full border px-4 py-1.5 text-sm font-semibold tabular-nums transition-all",
                tasbihTarget === t
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"
              )}
            >
              {toPersianDigits(t)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats + controls */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="rounded-2xl bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">شمارش این ذکر</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
            {toPersianDigits(count)}
          </p>
        </Card>
        <Card className="rounded-2xl bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">مجموع کل</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
            {toPersianDigits(totalAll)}
          </p>
        </Card>
        <Card className="rounded-2xl bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">دورهای کامل</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
            {toPersianDigits(completedRounds)}
          </p>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={handleResetCurrent}
          className="rounded-xl"
        >
          <RotateCcw className="h-4 w-4" />
          <span>ریست این ذکر</span>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="rounded-xl text-muted-foreground">
              <RotateCcw className="h-4 w-4" />
              <span>ریست همه</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ریست همهٔ شمارنده‌ها؟</AlertDialogTitle>
              <AlertDialogDescription>
                این عمل تمام شمارش‌های ذکر شما را به صفر برمی‌گرداند و قابل بازگشت
                نیست.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>انصراف</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetAll}>
                بله، ریست کن
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
