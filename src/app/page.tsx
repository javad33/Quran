"use client";

import * as React from "react";
import { AppShell } from "@/components/app-shell";
import type { ViewId } from "@/lib/nav";
import { HomeView } from "@/components/views/home-view";
import { QuranView } from "@/components/views/quran-view";
import { PrayerView } from "@/components/views/prayer-view";
import { QiblaView } from "@/components/views/qibla-view";
import { TasbihView } from "@/components/views/tasbih-view";
import { MafatihView } from "@/components/views/mafatih-view";
import { CalendarView } from "@/components/views/calendar-view";

export default function Home() {
  const [active, setActive] = React.useState<ViewId>("home");
  const [hijriLabel, setHijriLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/hijri")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j.ok) return;
        const h = j.data?.date?.hijri;
        if (h) {
          setHijriLabel(`${h.day} ${h.month.ar} ${h.year} هـ`);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell active={active} onNavigate={setActive} hijriLabel={hijriLabel}>
      {active === "home" && <HomeView onNavigate={setActive} hijriLabel={hijriLabel} />}
      {active === "quran" && <QuranView />}
      {active === "prayer" && <PrayerView />}
      {active === "qibla" && <QiblaView />}
      {active === "tasbih" && <TasbihView />}
      {active === "mafatih" && <MafatihView />}
      {active === "calendar" && <CalendarView hijriLabel={hijriLabel} />}
    </AppShell>
  );
}
