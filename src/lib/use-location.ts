"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";

export interface Coords {
  lat: number;
  lng: number;
}

/** Default location: Mecca (fallback when geolocation is denied). */
export const DEFAULT_LOCATION: Coords = { lat: 21.4225, lng: 39.8262 };
export const DEFAULT_CITY = "مکه مکرمه";

/** Cities for manual selection (popular Iranian + Islamic cities). */
export const POPULAR_CITIES: {
  name: string;
  lat: number;
  lng: number;
}[] = [
  { name: "تهران", lat: 35.6892, lng: 51.389 },
  { name: "مشهد", lat: 36.2605, lng: 59.6168 },
  { name: "اصفهان", lat: 32.6539, lng: 51.666 },
  { name: "شیراز", lat: 29.5918, lng: 52.5837 },
  { name: "قم", lat: 34.6399, lng: 50.8759 },
  { name: "تبریز", lat: 38.0962, lng: 46.2738 },
  { name: "اهواز", lat: 31.3203, lng: 48.6692 },
  { name: "کرج", lat: 35.8327, lng: 50.9916 },
  { name: "یزد", lat: 31.8974, lng: 54.3569 },
  { name: "کرمان", lat: 30.2839, lng: 57.0834 },
  { name: "نجف", lat: 32.0, lng: 44.3333 },
  { name: "کربلا", lat: 32.6167, lng: 44.0333 },
  { name: "مکه مکرمه", lat: 21.4225, lng: 39.8262 },
  { name: "مدینه منوره", lat: 24.5247, lng: 39.5692 },
  { name: "بیت‌المقدس", lat: 31.7683, lng: 35.2137 },
];

/**
 * Hook that resolves the user's geolocation.
 * Falls back to the store's saved location or Mecca.
 */
export function useLocation() {
  const userLocation = useAppStore((s) => s.userLocation);
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const [coords, setCoords] = React.useState<Coords>(
    userLocation || DEFAULT_LOCATION
  );
  const [city, setCity] = React.useState<string>(
    userLocation?.city || DEFAULT_CITY
  );
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "granted" | "denied" | "manual"
  >("idle");
  const [error, setError] = React.useState<string | null>(null);

  const requestGeo = React.useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("denied");
      setError("مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند.");
      return;
    }
    setStatus("loading");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setCity("موقعیت فعلی شما");
        setStatus("granted");
        setUserLocation({ ...c, city: "موقعیت فعلی شما" });
      },
      (err) => {
        setStatus("denied");
        if (err.code === err.PERMISSION_DENIED) {
          setError("دسترسی به موقعیت رد شد. لطفاً شهر خود را انتخاب کنید.");
        } else {
          setError("خطا در دریافت موقعیت. شهر خود را انتخاب کنید.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [setUserLocation]);

  const setManual = React.useCallback(
    (c: Coords, name: string) => {
      setCoords(c);
      setCity(name);
      setStatus("manual");
      setUserLocation({ ...c, city: name });
    },
    [setUserLocation]
  );

  return { coords, city, status, error, requestGeo, setManual };
}
