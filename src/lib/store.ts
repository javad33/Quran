"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AyahBookmark {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
  savedAt: number;
}

export interface TasbihRecord {
  count: number;
  dhikr: string;
  date: string; // YYYY-MM-DD
}

interface AppState {
  // Bookmarks
  bookmarks: AyahBookmark[];
  toggleBookmark: (b: AyahBookmark) => void;
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean;

  // Last read surah
  lastSurah: number | null;
  setLastSurah: (n: number) => void;

  // Prayer location
  prayerMethod: number;
  setPrayerMethod: (m: number) => void;
  userLocation: { lat: number; lng: number; city?: string } | null;
  setUserLocation: (loc: { lat: number; lng: number; city?: string } | null) => void;

  // Tasbih counters (keyed by dhikr)
  tasbihCounts: Record<string, number>;
  incrementTasbih: (dhikr: string) => void;
  resetTasbih: (dhikr: string) => void;
  tasbihTarget: number;
  setTasbihTarget: (n: number) => void;

  // Quran font size
  quranFontSize: number;
  setQuranFontSize: (n: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      toggleBookmark: (b) =>
        set((s) => {
          const exists = s.bookmarks.some(
            (x) => x.surahNumber === b.surahNumber && x.ayahNumber === b.ayahNumber
          );
          if (exists) {
            return {
              bookmarks: s.bookmarks.filter(
                (x) =>
                  !(x.surahNumber === b.surahNumber && x.ayahNumber === b.ayahNumber)
              ),
            };
          }
          return { bookmarks: [...s.bookmarks, b] };
        }),
      isBookmarked: (surahNumber, ayahNumber) =>
        get().bookmarks.some(
          (x) => x.surahNumber === surahNumber && x.ayahNumber === ayahNumber
        ),

      lastSurah: null,
      setLastSurah: (n) => set({ lastSurah: n }),

      prayerMethod: 0,
      setPrayerMethod: (m) => set({ prayerMethod: m }),
      userLocation: null,
      setUserLocation: (loc) => set({ userLocation: loc }),

      tasbihCounts: {},
      incrementTasbih: (dhikr) =>
        set((s) => ({
          tasbihCounts: {
            ...s.tasbihCounts,
            [dhikr]: (s.tasbihCounts[dhikr] || 0) + 1,
          },
        })),
      resetTasbih: (dhikr) =>
        set((s) => ({
          tasbihCounts: { ...s.tasbihCounts, [dhikr]: 0 },
        })),
      tasbihTarget: 33,
      setTasbihTarget: (n) => set({ tasbihTarget: n }),

      quranFontSize: 28,
      setQuranFontSize: (n) => set({ quranFontSize: n }),
    }),
    {
      name: "noor-app-storage",
    }
  )
);
