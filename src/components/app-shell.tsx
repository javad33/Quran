"use client";

import * as React from "react";
import {
  Home,
  BookOpen,
  Clock,
  Compass,
  CircleDot,
  HeartHandshake,
  Calendar,
  Moon,
  Sun,
  Menu,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { NAV_ITEMS, type ViewId } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

const ICONS: Record<string, LucideIcon> = {
  Home,
  BookOpen,
  Clock,
  Compass,
  CircleDot,
  HeartHandshake,
  Calendar,
};

interface NavListProps {
  active: ViewId;
  onNavigate: (v: ViewId) => void;
  onPick?: () => void;
}

function NavList({ active, onNavigate, onPick }: NavListProps) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.icon] || Home;
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id);
              onPick?.();
            }}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              "hover:bg-accent hover:text-accent-foreground",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-primary-foreground/15"
                  : "bg-muted group-hover:bg-background"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span>{item.label}</span>
              <span
                className={cn(
                  "text-[11px]",
                  isActive
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground/70"
                )}
              >
                {item.description}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

interface AppShellProps {
  active: ViewId;
  onNavigate: (v: ViewId) => void;
  hijriLabel?: string | null;
  children: React.ReactNode;
}

export function AppShell({
  active,
  onNavigate,
  hijriLabel,
  children,
}: AppShellProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && (resolvedTheme || theme) === "dark";
  const activeItem = NAV_ITEMS.find((n) => n.id === active);

  return (
    <div className="relative flex min-h-screen flex-col pattern-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* Right (in RTL): logo + title */}
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="منو"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex h-full flex-col">
                  <div className="flex items-center gap-2 border-b p-4">
                    <LogoMark className="h-9 w-9" />
                    <div className="flex flex-col">
                      <span className="font-bold leading-tight">نور</span>
                      <span className="text-[11px] text-muted-foreground">
                        قرآن و مفاتیح الجنان
                      </span>
                    </div>
                  </div>
                  <div className="custom-scroll flex-1 overflow-y-auto p-3">
                    <NavList active={active} onNavigate={onNavigate} onPick={() => setMobileOpen(false)} />
                  </div>
                  <div className="border-t p-4 text-center text-[11px] text-muted-foreground">
                    با عشق برای قرآن‌خوانان
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <LogoMark className="h-10 w-10 shrink-0" />
            <div className="flex flex-col leading-tight">
              <h1 className="font-bold text-base sm:text-lg">نور</h1>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                قرآن کریم و مفاتیح الجنان
              </p>
            </div>
          </div>

          {/* Left: hijri date + theme toggle */}
          <div className="flex items-center gap-2">
            {hijriLabel ? (
              <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs sm:flex">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-arabic">{hijriLabel}</span>
              </div>
            ) : (
              <Skeleton className="hidden h-8 w-32 rounded-full sm:block" />
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="تغییر تم"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="h-9 w-9"
            >
              {mounted ? (
                isDark ? (
                  <Sun className="h-[18px] w-[18px]" />
                ) : (
                  <Moon className="h-[18px] w-[18px]" />
                )
              ) : (
                <span className="h-[18px] w-[18px]" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-0 lg:gap-6 lg:px-6 lg:py-6">
        {/* Desktop sidebar */}
        <aside className="sticky top-[5.5rem] hidden h-[calc(100vh-7rem)] w-72 shrink-0 lg:block">
          <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-card/50 p-3">
            <div className="mb-3 px-3 pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                فهرست
              </p>
            </div>
            <div className="custom-scroll flex-1 overflow-y-auto">
              <NavList active={active} onNavigate={onNavigate} />
            </div>
            <div className="mt-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-3 text-center">
              <p className="font-arabic text-sm text-primary">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 pb-28 pt-4 lg:px-0 lg:pb-6 lg:pt-0">
          {activeItem && (
            <div className="mb-4 flex items-center gap-2.5 lg:hidden">
              {(() => {
                const Icon = ICONS[activeItem.icon] || Home;
                return (
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                );
              })()}
              <span className="text-lg font-bold">{activeItem.label}</span>
            </div>
          )}
          <div key={active} className="view-enter">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-stretch justify-between px-1 pb-[env(safe-area-inset-bottom)]">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.icon] || Home;
            const isActive = item.id === active;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    isActive ? "bg-primary/15 scale-110" : ""
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sticky footer */}
      <footer className="mt-auto hidden border-t border-border/60 bg-card/30 lg:block">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-muted-foreground sm:flex-row">
          <p className="flex items-center gap-2">
            <LogoMark className="h-4 w-4" />
            <span>اپلیکیشن نور — قرآن کریم و مفاتیح الجنان</span>
          </p>
          <p className="flex items-center gap-3">
            <span>داده‌ها از API‌های alquran.cloud و aladhan.com</span>
            <span className="text-primary">·</span>
            <span>ساخته‌شده با ❤ برای اهل قرآن</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="noorGrad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="oklch(0.7 0.15 75)" />
          <stop offset="100%" stopColor="oklch(0.45 0.11 162)" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" stroke="url(#noorGrad)" strokeWidth="2" />
      <path
        d="M24 8 L28 20 L40 24 L28 28 L24 40 L20 28 L8 24 L20 20 Z"
        fill="url(#noorGrad)"
        opacity="0.9"
      />
      <circle cx="24" cy="24" r="3" fill="oklch(0.985 0.005 95)" />
    </svg>
  );
}
