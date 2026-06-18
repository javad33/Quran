"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Search,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  Plus,
  Minus,
  Loader2,
  X,
  MapPin,
  ListMusic,
  RotateCcw,
  Volume2,
  Type,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAppStore, type AyahBookmark } from "@/lib/store";
import {
  revelationTypeFa,
  type SurahMeta,
  type SurahBundle,
  type SearchResult,
} from "@/lib/quran-api";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const RECITER = "مشاري العفاسي";
const BISMILLAH = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
const FONT_MIN = 20;
const FONT_MAX = 48;

type ListView = "list" | "search";
type RevelationFilter = "all" | "Meccan" | "Medinan";
type AudioMode = "full" | "ayah";

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function QuranView() {
  const [selectedSurah, setSelectedSurah] = React.useState<number | null>(null);
  const [listView, setListView] = React.useState<ListView>("list");

  const openSurah = React.useCallback((n: number) => {
    setSelectedSurah(n);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, []);

  const closeSurah = React.useCallback(() => {
    setSelectedSurah(null);
  }, []);

  if (selectedSurah !== null) {
    return (
      <SurahReader
        surahNumber={selectedSurah}
        onBack={closeSurah}
        onJumpToSurah={openSurah}
      />
    );
  }

  return (
    <SurahListScreen
      listView={listView}
      setListView={setListView}
      onOpenSurah={openSurah}
    />
  );
}

/* ------------------------------------------------------------------ */
/* List screen (surah list + search + bookmarks + continue reading)    */
/* ------------------------------------------------------------------ */

interface SurahListScreenProps {
  listView: ListView;
  setListView: (v: ListView) => void;
  onOpenSurah: (n: number) => void;
}

function SurahListScreen({
  listView,
  setListView,
  onOpenSurah,
}: SurahListScreenProps) {
  const [surahs, setSurahs] = React.useState<SurahMeta[] | null>(null);
  const [listError, setListError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<RevelationFilter>("all");

  const lastSurah = useAppStore((s) => s.lastSurah);
  const bookmarks = useAppStore((s) => s.bookmarks);

  // Fetch surah list on mount
  const loadSurahs = React.useCallback(async () => {
    setListError(null);
    try {
      const res = await fetch("/api/quran/surahs");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "خطا در دریافت فهرست سوره‌ها");
      setSurahs(json.data as SurahMeta[]);
    } catch (e) {
      setListError((e as Error).message);
      toast.error("خطا در دریافت فهرست سوره‌ها");
    }
  }, []);

  React.useEffect(() => {
    loadSurahs();
  }, [loadSurahs]);

  // Memoised filtered list
  const filtered = React.useMemo(() => {
    if (!surahs) return [];
    const q = query.trim().toLowerCase();
    return surahs.filter((s) => {
      if (filter !== "all" && s.revelationType !== filter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        String(s.number) === q
      );
    });
  }, [surahs, query, filter]);

  const lastSurahMeta = React.useMemo(() => {
    if (!surahs || !lastSurah) return null;
    return surahs.find((s) => s.number === lastSurah) || null;
  }, [surahs, lastSurah]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary">
          <BookOpen className="h-5 w-5" />
          <h2 className="text-xl font-bold">قرآن کریم</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          ۱۱۴ سوره — تلاوت، ترجمه فارسی و جستجو
        </p>
      </div>

      {/* Continue reading */}
      {lastSurahMeta && (
        <Card
          className={cn(
            "gap-0 overflow-hidden border-primary/30 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent p-0 py-0"
          )}
        >
          <button
            type="button"
            onClick={() => onOpenSurah(lastSurahMeta.number)}
            className="flex w-full items-center gap-4 p-4 text-right transition-colors hover:bg-primary/5"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="h-6 w-6" />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-xs font-medium text-muted-foreground">
                ادامه خواندن
              </span>
              <span className="font-arabic text-xl text-primary">
                {lastSurahMeta.name}
              </span>
              <span className="text-[11px] text-muted-foreground">
                سوره {toPersianDigits(lastSurahMeta.number)} —{" "}
                {lastSurahMeta.englishName} ·{" "}
                {revelationTypeFa(lastSurahMeta.revelationType)}
              </span>
            </span>
            <ArrowRight className="h-5 w-5 text-primary" />
          </button>
        </Card>
      )}

      {/* Bookmarks */}
      {bookmarks.length > 0 && (
        <Card className="gap-3 p-4">
          <div className="flex items-center gap-2 text-primary">
            <BookmarkCheck className="h-4 w-4" />
            <h3 className="text-sm font-semibold">نشان‌شده‌ها</h3>
            <Badge variant="secondary" className="mr-auto">
              {toPersianDigits(bookmarks.length)}
            </Badge>
          </div>
          <ScrollArea className="max-h-44">
            <ul className="flex flex-col gap-2 pe-2">
              {bookmarks.map((b) => (
                <li key={`${b.surahNumber}:${b.ayahNumber}`}>
                  <button
                    type="button"
                    onClick={() => onOpenSurah(b.surahNumber)}
                    className="group flex w-full items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-3 text-right transition-all hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Bookmark className="h-4 w-4" />
                    </span>
                    <span className="flex flex-1 flex-col">
                      <span className="text-xs font-medium text-muted-foreground">
                        {b.surahName} · آیه{" "}
                        {toPersianDigits(b.ayahNumber)}
                      </span>
                      <span className="line-clamp-2 text-sm leading-relaxed">
                        {b.text}
                      </span>
                    </span>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </Card>
      )}

      {/* View toggle (list / search) */}
      <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card/60 p-1">
        <ToggleButton
          active={listView === "list"}
          onClick={() => setListView("list")}
          icon={<BookOpen className="h-4 w-4" />}
          label="فهرست سوره‌ها"
        />
        <ToggleButton
          active={listView === "search"}
          onClick={() => setListView("search")}
          icon={<Search className="h-4 w-4" />}
          label="جستجو در ترجمه"
        />
      </div>

      {listView === "search" ? (
        <SearchPanel onOpenSurah={onOpenSurah} />
      ) : (
        <div className="space-y-4">
          {/* Search input + filter chips */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی نام سوره (عربی، انگلیسی، شماره)..."
                className="pr-9"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent"
                  aria-label="پاک کردن"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: "all", label: "همه" },
                  { id: "Meccan", label: "مکی" },
                  { id: "Medinan", label: "مدنی" },
                ] as { id: RevelationFilter; label: string }[]
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    filter === f.id
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Surah grid */}
          {listError ? (
            <ErrorState message={listError} onRetry={loadSurahs} />
          ) : surahs === null ? (
            <SurahGridSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="سوره‌ای یافت نشد"
              description="عبارت جستجو یا فیلتر را تغییر دهید."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <SurahCard key={s.number} surah={s} onOpen={onOpenSurah} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Surah card                                                          */
/* ------------------------------------------------------------------ */

interface SurahCardProps {
  surah: SurahMeta;
  onOpen: (n: number) => void;
}

function SurahCard({ surah, onOpen }: SurahCardProps) {
  const isMeccan = surah.revelationType === "Meccan";
  return (
    <button
      type="button"
      onClick={() => onOpen(surah.number)}
      className="group relative flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      {/* Number badge */}
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
        <svg
          viewBox="0 0 48 48"
          className="absolute inset-0 h-full w-full text-primary/15 transition-colors group-hover:text-primary/30"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M24 2 L29 18 L46 24 L29 30 L24 46 L19 30 L2 24 L19 18 Z" />
        </svg>
        <span className="relative text-sm font-bold text-primary">
          {toPersianDigits(surah.number)}
        </span>
      </div>

      {/* Names */}
      <div className="flex flex-1 flex-col items-start gap-0.5">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="font-arabic text-2xl leading-none text-foreground">
            {surah.name}
          </span>
          <Badge
            variant={isMeccan ? "outline" : "secondary"}
            className="shrink-0 text-[10px]"
          >
            {revelationTypeFa(surah.revelationType)}
          </Badge>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {surah.englishName} · {surah.englishNameTranslation}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {toPersianDigits(surah.numberOfAyahs)} آیه
        </span>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:text-primary group-hover:-translate-x-0.5" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Search panel                                                        */
/* ------------------------------------------------------------------ */

interface SearchPanelProps {
  onOpenSurah: (n: number) => void;
}

function SearchPanel({ onOpenSurah }: SearchPanelProps) {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[] | null>(null);
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const query = q.trim();
    if (!query) {
      setResults(null);
      setSearching(false);
      setError(null);
      return;
    }
    setSearching(true);
    setError(null);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch(
          `/api/quran/search?q=${encodeURIComponent(query)}`,
          { signal: ac.signal }
        );
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "خطا در جستجو");
        setResults(json.data as SearchResult[]);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError((e as Error).message);
        toast.error("خطا در جستجوی قرآن");
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="عبارت مورد نظر را در ترجمه فارسی قرآن جستجو کنید..."
          className="pr-9"
          autoFocus
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent"
            aria-label="پاک کردن"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!q.trim() ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="جستجو در معانی قرآن"
          description="کلمه یا عبارت فارسی را وارد کنید تا آیه‌های متناظر را ببینید."
        />
      ) : searching ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/60 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          در حال جستجو...
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => setQ((v) => v + " ")} />
      ) : results && results.length === 0 ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="نتیجه‌ای یافت نشد"
          description="عبارت دیگری را امتحان کنید."
        />
      ) : results ? (
        <ScrollArea className="max-h-[60vh]">
          <ul className="flex flex-col gap-2 pe-2">
            {results.map((r, i) => (
              <li
                key={`${r.surah.number}:${r.numberInSurah}:${i}`}
                className="rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/40"
              >
                <p className="mb-3 leading-relaxed">{highlightTerm(r.text, q)}</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className="font-arabic text-base text-foreground">
                      {r.surah.name}
                    </span>
                    <span>·</span>
                    <span>
                      آیه {toPersianDigits(r.numberInSurah)} از{" "}
                      {toPersianDigits(r.surah.numberOfAyahs)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenSurah(r.surah.number)}
                    className="h-7 gap-1 text-xs"
                  >
                    باز کردن سوره
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Surah reader                                                        */
/* ------------------------------------------------------------------ */

interface SurahReaderProps {
  surahNumber: number;
  onBack: () => void;
  onJumpToSurah: (n: number) => void;
}

function SurahReader({ surahNumber, onBack }: SurahReaderProps) {
  const [bundle, setBundle] = React.useState<SurahBundle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Font size from store
  const fontSize = useAppStore((s) => s.quranFontSize);
  const setFontSize = useAppStore((s) => s.setQuranFontSize);
  const setLastSurah = useAppStore((s) => s.setLastSurah);

  // Audio state
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [audioMode, setAudioMode] = React.useState<AudioMode | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentAyah, setCurrentAyah] = React.useState<number | null>(null);
  const [audioReady, setAudioReady] = React.useState(false);

  const loadBundle = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setBundle(null);
    setAudioMode(null);
    setIsPlaying(false);
    setCurrentAyah(null);
    setAudioReady(false);
    try {
      const res = await fetch(`/api/quran/surah/${surahNumber}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "خطا در دریافت سوره");
      setBundle(json.data as SurahBundle);
      setLastSurah(surahNumber);
    } catch (e) {
      setError((e as Error).message);
      toast.error("خطا در دریافت سوره");
    } finally {
      setLoading(false);
    }
  }, [surahNumber, setLastSurah]);

  React.useEffect(() => {
    loadBundle();
  }, [loadBundle]);

  // Scroll to top when surah changes
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [surahNumber]);

  // Audio element event handlers
  React.useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onCanPlay = () => setAudioReady(true);
    const onEnded = () => {
      if (audioMode === "ayah" && bundle) {
        setCurrentAyah((prev) => {
          if (prev === null) return null;
          const next = prev + 1;
          if (next >= bundle.audio.length) {
            // Finished surah
            setAudioMode(null);
            setIsPlaying(false);
            return null;
          }
          el.src = bundle.audio[next];
          void el.play().catch(() => {});
          return next;
        });
      } else {
        // Full surah finished
        setIsPlaying(false);
        setAudioMode(null);
      }
    };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("canplay", onCanPlay);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("canplay", onCanPlay);
    };
  }, [audioMode, bundle]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      const el = audioRef.current;
      if (el) {
        el.pause();
        el.src = "";
      }
    };
  }, []);

  const stopAudio = React.useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.src = "";
    }
    setAudioMode(null);
    setIsPlaying(false);
    setCurrentAyah(null);
    setAudioReady(false);
  }, []);

  const playFull = React.useCallback(() => {
    if (!bundle) return;
    const el = audioRef.current;
    if (!el) return;
    setAudioMode("full");
    setCurrentAyah(null);
    setAudioReady(false);
    el.src = bundle.fullAudio;
    void el.play().catch(() => {
      toast.error("پخش صدا با خطا مواجه شد");
    });
  }, [bundle]);

  const playAyahMode = React.useCallback(
    (index?: number) => {
      if (!bundle) return;
      const el = audioRef.current;
      if (!el) return;
      const start = index ?? 0;
      setAudioMode("ayah");
      setCurrentAyah(start);
      setAudioReady(false);
      el.src = bundle.audio[start];
      void el.play().catch(() => {
        toast.error("پخش صدا با خطا مواجه شد");
      });
    },
    [bundle]
  );

  const togglePlayPause = React.useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (!audioMode) {
      playFull();
      return;
    }
    if (el.paused) {
      void el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [audioMode, playFull]);

  const jumpAyah = React.useCallback(
    (dir: -1 | 1) => {
      if (!bundle || audioMode !== "ayah") return;
      const el = audioRef.current;
      if (!el) return;
      setCurrentAyah((prev) => {
        if (prev === null) return prev;
        const next = prev + dir;
        if (next < 0 || next >= bundle.audio.length) return prev;
        el.src = bundle.audio[next];
        void el.play().catch(() => {});
        return next;
      });
    },
    [bundle, audioMode]
  );

  const playSingleAyah = React.useCallback(
    (index: number) => {
      playAyahMode(index);
    },
    [playAyahMode]
  );

  const showBismillah = surahNumber !== 1 && surahNumber !== 9;

  return (
    <div
      className={cn(
        "view-enter",
        audioMode ? "pb-44 lg:pb-28" : "pb-28 lg:pb-6"
      )}
    >
      <audio ref={audioRef} preload="auto" />

      {/* Reader header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            stopAudio();
            onBack();
          }}
          className="gap-1.5"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به فهرست
        </Button>
      </div>

      {loading ? (
        <ReaderSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadBundle} />
      ) : bundle ? (
        <div className="space-y-5">
          {/* Surah header card */}
          <Card className="gap-3 overflow-hidden border-primary/20 p-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                سوره {toPersianDigits(bundle.meta.number)}
              </div>
              <h2 className="font-arabic text-4xl leading-tight text-primary">
                {bundle.meta.name}
              </h2>
              <p className="text-sm font-medium text-muted-foreground">
                {bundle.meta.englishName} ·{" "}
                {bundle.meta.englishNameTranslation}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">
                  {revelationTypeFa(bundle.meta.revelationType)}
                </Badge>
                <Badge variant="outline">
                  {toPersianDigits(bundle.meta.numberOfAyahs)} آیه
                </Badge>
              </div>
            </div>

            {/* Bismillah */}
            {showBismillah && (
              <div className="divider-ornament">
                <p className="font-quran text-center text-2xl text-foreground">
                  {BISMILLAH}
                </p>
              </div>
            )}

            {/* Reader controls */}
            <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Play controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={playFull}
                    variant={audioMode === "full" ? "default" : "outline"}
                    className="gap-1.5"
                  >
                    <Play className="h-3.5 w-3.5" />
                    پخش کل سوره
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => playAyahMode(0)}
                    variant={audioMode === "ayah" ? "default" : "outline"}
                    className="gap-1.5"
                  >
                    <ListMusic className="h-3.5 w-3.5" />
                    پخش آیه به آیه
                  </Button>
                  {audioMode && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={stopAudio}
                      className="gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" />
                      توقف
                    </Button>
                  )}
                </div>

                {/* Reciter badge */}
                <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                  <Volume2 className="h-3.5 w-3.5 text-primary" />
                  قاری: {RECITER}
                </div>
              </div>

              {/* Font size control */}
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
                <Type className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    setFontSize(Math.max(FONT_MIN, fontSize - 2))
                  }
                  disabled={fontSize <= FONT_MIN}
                  aria-label="کاهش اندازه قلم"
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <Slider
                  value={[fontSize]}
                  min={FONT_MIN}
                  max={FONT_MAX}
                  step={1}
                  onValueChange={(v) => setFontSize(v[0])}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    setFontSize(Math.min(FONT_MAX, fontSize + 2))
                  }
                  disabled={fontSize >= FONT_MAX}
                  aria-label="افزایش اندازه قلم"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-10 shrink-0 text-center text-xs text-muted-foreground">
                  {toPersianDigits(fontSize)}
                </span>
              </div>
            </div>
          </Card>

          {/* Ayah list */}
          <div className="flex flex-col gap-3">
            {bundle.arabic.map((ayah, idx) => {
              const persian = bundle.persian[idx];
              const isCurrent =
                audioMode === "ayah" && currentAyah === idx;
              return (
                <AyahRow
                  key={`${ayah.numberInSurah}-${idx}`}
                  ayah={ayah}
                  persianText={persian?.text || ""}
                  fontSize={fontSize}
                  isCurrent={isCurrent}
                  isPlaying={isCurrent && isPlaying}
                  surahNumber={surahNumber}
                  surahName={bundle.meta.name}
                  onPlayAyah={() => playSingleAyah(idx)}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Sticky audio player */}
      {audioMode && bundle && (
        <AudioPlayer
          mode={audioMode}
          isPlaying={isPlaying}
          currentAyah={currentAyah}
          totalAyahs={bundle.audio.length}
          surahName={bundle.meta.name}
          audioRef={audioRef}
          onTogglePlay={togglePlayPause}
          onPrev={() => jumpAyah(-1)}
          onNext={() => jumpAyah(1)}
          onStop={stopAudio}
          audioReady={audioReady}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ayah row                                                            */
/* ------------------------------------------------------------------ */

interface AyahRowProps {
  ayah: { numberInSurah: number; text: string; sajda?: boolean };
  persianText: string;
  fontSize: number;
  isCurrent: boolean;
  isPlaying: boolean;
  surahNumber: number;
  surahName: string;
  onPlayAyah: () => void;
}

function AyahRow({
  ayah,
  persianText,
  fontSize,
  isCurrent,
  isPlaying,
  surahNumber,
  surahName,
  onPlayAyah,
}: AyahRowProps) {
  const isBookmarked = useAppStore((s) =>
    s.isBookmarked(surahNumber, ayah.numberInSurah)
  );
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);
  const [hovered, setHovered] = React.useState(false);

  const handleBookmark = () => {
    toggleBookmark({
      surahNumber,
      surahName,
      ayahNumber: ayah.numberInSurah,
      text: persianText,
      savedAt: Date.now(),
    });
    toast.success(
      isBookmarked ? "از نشان‌ها حذف شد" : "به نشان‌شده‌ها اضافه شد"
    );
  };

  return (
    <Card
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "gap-3 p-4 transition-all",
        isCurrent
          ? "border-primary/60 bg-primary/5 shadow-md ring-1 ring-primary/20"
          : "hover:border-primary/30"
      )}
    >
      {/* Ayah number + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="ayah-badge !h-9 !w-9 !text-xs">
            {toPersianDigits(ayah.numberInSurah)}
          </span>
          {ayah.sajda && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <MapPin className="h-3 w-3" />
              سجده
            </Badge>
          )}
          {isCurrent && (
            <Badge className="gap-1 text-[10px]">
              <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-primary-foreground" />
              {isPlaying ? "در حال پخش" : "آیین فعلی"}
            </Badge>
          )}
        </div>
        <div
          className={cn(
            "flex items-center gap-1 transition-opacity",
            hovered || isCurrent ? "opacity-100" : "opacity-60"
          )}
        >
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-primary"
            onClick={onPlayAyah}
            aria-label="پخش این آیه"
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-8 w-8",
              isBookmarked
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            )}
            onClick={handleBookmark}
            aria-label={isBookmarked ? "حذف نشان" : "نشان کردن آیه"}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Arabic text + inline ayah badge */}
      <p
        className="font-quran text-right text-foreground"
        style={{ fontSize: `${fontSize}px`, lineHeight: 2.2 }}
        dir="rtl"
      >
        {ayah.text}
        <span className="ayah-badge mx-1 align-middle text-[0.55em] !w-[2.4em] !h-[2.4em]">
          {toPersianDigits(ayah.numberInSurah)}
        </span>
      </p>

      {/* Persian translation */}
      <p className="border-r-2 border-primary/30 pr-3 text-sm leading-relaxed text-muted-foreground">
        {persianText}
      </p>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Audio player (sticky)                                               */
/* ------------------------------------------------------------------ */

interface AudioPlayerProps {
  mode: AudioMode;
  isPlaying: boolean;
  currentAyah: number | null;
  totalAyahs: number;
  surahName: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onStop: () => void;
  audioReady: boolean;
}

function AudioPlayer({
  mode,
  isPlaying,
  currentAyah,
  totalAyahs,
  surahName,
  audioRef,
  onTogglePlay,
  onPrev,
  onNext,
  onStop,
  audioReady,
}: AudioPlayerProps) {
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);

  // Track progress via event listeners on the shared audio element.
  // Re-attach whenever the underlying <audio> src changes (mode/track switch).
  React.useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => {
      setCurrentTime(el.currentTime);
      if (el.duration && !Number.isNaN(el.duration)) {
        setDuration(el.duration);
        setProgress((el.currentTime / el.duration) * 100);
      }
    };
    const onMeta = () => {
      if (el.duration && !Number.isNaN(el.duration)) {
        setDuration(el.duration);
      }
      setProgress(0);
      setCurrentTime(0);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
    };
  }, [audioRef, mode, currentAyah]);

  const seek = (value: number[]) => {
    const el = audioRef.current;
    if (!el || !el.duration || Number.isNaN(el.duration)) return;
    el.currentTime = (value[0] / 100) * el.duration;
  };

  return (
    <div className="fixed bottom-[72px] left-0 right-0 z-30 lg:bottom-4">
      <div className="mx-auto max-w-3xl px-3">
        <div className="ornament-border flex items-center gap-3 rounded-2xl border border-primary/30 bg-card/95 p-3 shadow-xl backdrop-blur-xl">
          {/* Play/pause */}
          <Button
            size="icon"
            onClick={onTogglePlay}
            className="h-11 w-11 shrink-0 rounded-full"
            aria-label={isPlaying ? "توقف" : "پخش"}
            disabled={!audioReady && !isPlaying}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>

          {/* Ayah mode prev/next */}
          {mode === "ayah" && (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onPrev}
                disabled={
                  currentAyah === null || currentAyah <= 0
                }
                aria-label="آیه قبلی"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onNext}
                disabled={
                  currentAyah === null ||
                  currentAyah >= totalAyahs - 1
                }
                aria-label="آیه بعدی"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Info + progress */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 text-foreground">
                <Volume2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate font-arabic text-base">
                  {surahName}
                </span>
                {mode === "ayah" && currentAyah !== null && (
                  <span className="shrink-0 text-muted-foreground">
                    · آیه {toPersianDigits(currentAyah + 1)} از{" "}
                    {toPersianDigits(totalAyahs)}
                  </span>
                )}
                {mode === "full" && (
                  <span className="shrink-0 text-muted-foreground">
                    · پخش کل سوره
                  </span>
                )}
              </span>
              <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                value={[progress]}
                onValueChange={seek}
                className="flex-1"
              />
            </div>
          </div>

          {/* Stop */}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onStop}
            aria-label="بستن پخش‌کننده"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small UI helpers                                                    */
/* ------------------------------------------------------------------ */

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="gap-3 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <X className="h-6 w-6" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mx-auto gap-1.5">
        <RotateCcw className="h-3.5 w-3.5" />
        تلاش دوباره
      </Button>
    </Card>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="gap-2 p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        {icon}
      </div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}

function SurahGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4"
        >
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReaderSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="gap-4 p-5">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-px w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="h-12 w-full" />
      </Card>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="gap-3 p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Utilities                                                           */
/* ------------------------------------------------------------------ */

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

function toPersianDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

function formatTime(seconds: number): string {
  if (!seconds || Number.isNaN(seconds)) return "۰:۰۰";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${toPersianDigits(m)}:${toPersianDigits(s.toString().padStart(2, "0"))}`;
}

function highlightTerm(text: string, term: string): React.ReactNode {
  const q = term.trim();
  if (!q) return text;
  // Escape regex special chars
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={i}
        className="rounded bg-primary/20 px-0.5 text-primary-foreground"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}
