/**
 * Quran API client — uses the public alquran.cloud API (https://alquran.cloud)
 * No API key required.
 *
 * Endpoints:
 *  - GET /v1/surah                      → list of 114 surahs (meta)
 *  - GET /v1/surah/{n}/quran-uthmani    → Arabic Uthmani text
 *  - GET /v1/surah/{n}/fa.makarem       → Persian translation (Makarem Shirazi)
 *  - GET /v1/surah/{n}/ar.alafasy       → per-ayah audio URLs (Alafasy)
 *  - GET /v1/search/{keyword}/all/fa    → search Persian translation
 */

const BASE = "https://api.alquran.cloud/v1";

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
}

export interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  numberInSurahText?: string;
  audio?: string;
  juz?: number;
  page?: number;
  sajda?: boolean;
}

export interface SurahContent {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
}

export interface TranslatedAyah {
  numberInSurah: number;
  text: string;
}

export interface SearchResult {
  number: number;
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
  };
  numberInSurah: number;
}

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

async function fetchJson<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data as T;
  }
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Quran API error ${res.status} for ${url}`);
  }
  const json = await res.json();
  if (json.code !== 200 && json.status !== "OK") {
    throw new Error(json.data?.message || "Quran API returned an error");
  }
  cache.set(url, { data: json.data, ts: Date.now() });
  return json.data as T;
}

/** Get the list of all 114 surahs. */
export async function getAllSurahs(): Promise<SurahMeta[]> {
  return fetchJson<SurahMeta[]>(`${BASE}/surah`);
}

/** Get the Arabic Uthmani text of a surah. */
export async function getSurahArabic(num: number): Promise<SurahContent> {
  return fetchJson<SurahContent>(`${BASE}/surah/${num}/quran-uthmani`);
}

/** Get the Persian (Makarem Shirazi) translation of a surah. */
export async function getSurahPersian(num: number): Promise<SurahContent> {
  return fetchJson<SurahContent>(`${BASE}/surah/${num}/fa.makarem`);
}

/** Get per-ayah audio URLs for a surah (reciter: Alafasy). */
export async function getSurahAudio(num: number): Promise<SurahContent> {
  return fetchJson<SurahContent>(`${BASE}/surah/${num}/ar.alafasy`);
}

export interface SurahBundle {
  meta: SurahMeta;
  arabic: Ayah[];
  persian: TranslatedAyah[];
  audio: string[];
  /** Full-surah audio stream URL */
  fullAudio: string;
}

/** Fetch Arabic + Persian + audio for a surah in parallel. */
export async function getSurahBundle(num: number): Promise<SurahBundle> {
  const [arabicRes, persianRes, metaList] = await Promise.all([
    getSurahArabic(num),
    getSurahPersian(num),
    getAllSurahs(),
  ]);
  const meta = metaList.find((s) => s.number === num) || {
    number: num,
    name: arabicRes.name,
    englishName: arabicRes.englishName,
    englishNameTranslation: arabicRes.englishNameTranslation,
    numberOfAyahs: arabicRes.numberOfAyahs,
    revelationType: arabicRes.revelationType as "Meccan" | "Medinan",
  };

  const persian: TranslatedAyah[] = persianRes.ayahs.map((a) => ({
    numberInSurah: a.numberInSurah,
    text: a.text,
  }));

  // Build per-ayah audio URLs from the CDN (Alafasy, 128kbps)
  const audio = arabicRes.ayahs.map(
    (a) => `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${a.number}.mp3`
  );

  // Full surah audio stream
  const fullAudio = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${num}.mp3`;

  return {
    meta,
    arabic: arabicRes.ayahs,
    persian,
    audio,
    fullAudio,
  };
}

/** Search the Persian translation of the whole Quran. */
export async function searchQuranPersian(
  keyword: string
): Promise<SearchResult[]> {
  const q = encodeURIComponent(keyword.trim());
  if (!q) return [];
  return fetchJson<SearchResult[]>(
    `${BASE}/search/${q}/all/fa`
  );
}

/** Map revelation type to Persian label. */
export function revelationTypeFa(t: string): string {
  return t === "Meccan" ? "مکی" : "مدنی";
}
