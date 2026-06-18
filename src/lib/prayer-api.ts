/**
 * Prayer Times & Hijri Calendar API client — uses the public aladhan.com API.
 * No API key required.
 *
 * Endpoints:
 *  - GET /v1/timings?latitude=&longitude=&method=&school=  → daily prayer times
 *  - GET /v1/gToH?date={DD-MM-YYYY}                        → Gregorian → Hijri
 *  - GET /v1/calendar/{year}/{month}?latitude=&longitude=  → monthly calendar
 */

const BASE = "https://api.aladhan.com/v1";

/** Calculation methods. 4 = Umm al-Qura (Makkah), popular in Shia communities use 0 (Shia Ithna-Ashari / Jafari). */
export const PRAYER_METHODS = [
  { id: 0, name: "جعفری (شیعه دوازده‌امامی)" },
  { id: 1, name: "انجمن اسلامی آمریکای شمالی (ISNA)" },
  { id: 2, name: "انجمن اسلامی آمریکای شمالی" },
  { id: 3, name: "لیگ جهانی اسلامی (مکه)" },
  { id: 4, name: "ام‌القرى (مکه)" },
  { id: 5, name: "مصر" },
  { id: 7, name: "کراچی" },
  { id: 8, name: "گلف" },
  { id: 9, name: "کویت" },
  { id: 10, name: "قطر" },
  { id: 12, name: "سنگاپور" },
  { id: 13, name: "فرانسه" },
  { id: 14, name: "ترکیه" },
  { id: 15, name: "روسیه" },
  { id: 16, name: "موفتون مصر" },
  { id: 17, name: "دبی" },
  { id: 18, name: "جاکارتا" },
  { id: 19, name: "تونس" },
  { id: 20, name: "الجزایر" },
  { id: 21, name: "کچ‌اتار ترکیه" },
] as const;

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
  Firstthird?: string;
  Lastthird?: string;
}

export interface HijriDate {
  date: string;
  day: string;
  month: { number: number; en: string; ar: string };
  year: string;
  weekday: { en: string; ar: string };
  holidays: string[];
}

export interface GregorianDate {
  date: string;
  day: string;
  month: { number: number; en: string };
  year: string;
  weekday: { en: string };
}

export interface PrayerResponse {
  timings: PrayerTimings;
  date: {
    readable: string;
    timestamp: string;
    hijri: HijriDate;
    gregorian: GregorianDate;
  };
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: {
      id: number;
      name: string;
    };
  };
}

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 1000 * 60 * 10; // 10 min

async function fetchJson<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data as T;
  }
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Prayer API error ${res.status}`);
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.data || "Prayer API error");
  cache.set(url, { data: json.data, ts: Date.now() });
  return json.data as T;
}

/** Get prayer times for a given location. method=0 → Shia Jafari. */
export async function getPrayerTimes(
  lat: number,
  lng: number,
  method = 0
): Promise<PrayerResponse> {
  const url = `${BASE}/timings?latitude=${lat}&longitude=${lng}&method=${method}`;
  return fetchJson<PrayerResponse>(url);
}

/** Response shape from the /v1/gToH endpoint (flatter than timings). */
export interface GToHResponse {
  hijri: HijriDate;
  gregorian: GregorianDate;
}

/** Convert a Gregorian date to Hijri. */
export async function gregorianToHijri(
  date: Date,
  lat?: number,
  lng?: number
): Promise<GToHResponse> {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  let url = `${BASE}/gToH/${dd}-${mm}-${yyyy}`;
  if (lat !== undefined && lng !== undefined) {
    url += `?latitude=${lat}&longitude=${lng}`;
  }
  return fetchJson<GToHResponse>(url);
}

export const PRAYER_LABELS: { key: keyof PrayerTimings; fa: string; icon: string }[] = [
  { key: "Imsak", fa: "امساک", icon: "moon" },
  { key: "Fajr", fa: "اذان صبح", icon: "sunrise" },
  { key: "Sunrise", fa: "طلوع آفتاب", icon: "sun" },
  { key: "Dhuhr", fa: "اذان ظهر", icon: "sun" },
  { key: "Asr", fa: "عصر", icon: "sun" },
  { key: "Maghrib", fa: "اذان مغرب", icon: "sunset" },
  { key: "Isha", fa: "عشاء", icon: "moon" },
  { key: "Midnight", fa: "نیمه شب شرعی", icon: "moon" },
];

/** Convert "HH:MM" (UTC) to local time string considering a timezone offset. aladhan returns local times already. */
export function formatTime(t: string): string {
  // aladhan returns times like "04:32 (EET)" — strip the timezone tail
  const m = t.match(/\d{1,2}:\d{2}/);
  return m ? m[0] : t;
}

/** Compute next prayer from today's timings. */
export function getNextPrayer(
  timings: PrayerTimings
): { key: string; label: string; time: string; remainingMs: number } | null {
  const now = new Date();
  const order: { key: keyof PrayerTimings; label: string }[] = [
    { key: "Fajr", label: "اذان صبح" },
    { key: "Dhuhr", label: "اذان ظهر" },
    { key: "Asr", label: "عصر" },
    { key: "Maghrib", label: "اذان مغرب" },
    { key: "Isha", label: "عشاء" },
  ];
  for (const p of order) {
    const time = formatTime(timings[p.key]);
    const [h, m] = time.split(":").map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target.getTime() > now.getTime()) {
      return {
        key: p.key,
        label: p.label,
        time,
        remainingMs: target.getTime() - now.getTime(),
      };
    }
  }
  // After Isha → next is Fajr tomorrow
  const time = formatTime(timings.Fajr);
  const [h, m] = time.split(":").map(Number);
  const target = new Date(now);
  target.setDate(target.getDate() + 1);
  target.setHours(h, m, 0, 0);
  return {
    key: "Fajr",
    label: "اذان صبح",
    time,
    remainingMs: target.getTime() - now.getTime(),
  };
}
