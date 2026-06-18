"use client";

import * as React from "react";
import {
  Compass,
  Navigation,
  MapPin,
  Smartphone,
  RefreshCw,
  Info,
  Sparkles,
  LocateFixed,
  AlertCircle,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation, POPULAR_CITIES } from "@/lib/use-location";
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

/** Kaaba coordinates (Makkah). */
const MECCA = { lat: 21.4225, lng: 39.8262 };

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Initial bearing (from North, clockwise) from point 1 to point 2. */
function bearingTo(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Great-circle distance in km (haversine). */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toPersianDigits(s: string | number): string {
  const map = "۰۱۲۳۴۵۶۷۸۹";
  return String(s).replace(/\d/g, (d) => map[Number(d)]);
}

type CompassState = "idle" | "requesting" | "active" | "unsupported" | "denied";

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}
type DeviceOrientationEventStatic = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function QiblaView() {
  const { coords, city, status, error, requestGeo, setManual } = useLocation();

  const qiblaBearing = React.useMemo(
    () => bearingTo(coords.lat, coords.lng, MECCA.lat, MECCA.lng),
    [coords.lat, coords.lng]
  );
  const distanceKm = React.useMemo(
    () => haversineKm(coords.lat, coords.lng, MECCA.lat, MECCA.lng),
    [coords.lat, coords.lng]
  );

  const [deviceHeading, setDeviceHeading] = React.useState<number | null>(null);
  const [compassState, setCompassState] = React.useState<CompassState>("idle");
  const handlerRef = React.useRef<
    ((e: DeviceOrientationEventiOS) => void) | null
  >(null);

  const stopListening = React.useCallback(() => {
    if (handlerRef.current && typeof window !== "undefined") {
      window.removeEventListener(
        "deviceorientation",
        handlerRef.current as EventListener,
        true
      );
      handlerRef.current = null;
    }
  }, []);

  const startCompass = React.useCallback(async () => {
    if (typeof window === "undefined") return;
    const DOE =
      window.DeviceOrientationEvent as DeviceOrientationEventStatic;
    if (!DOE) {
      setCompassState("unsupported");
      toast.error("قطب‌نما در این مرورگر پشتیبانی نمی‌شود.");
      return;
    }

    // iOS 13+ requires explicit permission from a user gesture.
    if (typeof DOE.requestPermission === "function") {
      setCompassState("requesting");
      try {
        const res = await DOE.requestPermission();
        if (res !== "granted") {
          setCompassState("denied");
          toast.error("دسترسی به سنسور قطب‌نما داده نشد.");
          return;
        }
      } catch {
        setCompassState("denied");
        toast.error("خطا در درخواست دسترسی به قطب‌نما.");
        return;
      }
    }

    const handler = (event: DeviceOrientationEventiOS) => {
      // iOS: webkitCompassHeading is in degrees from North (clockwise).
      if (
        typeof event.webkitCompassHeading === "number" &&
        !Number.isNaN(event.webkitCompassHeading)
      ) {
        setDeviceHeading(event.webkitCompassHeading);
        return;
      }
      // Android: alpha is rotation around Z (counter-clockwise from North when flat).
      if (event.alpha != null) {
        setDeviceHeading((360 - event.alpha) % 360);
      }
    };

    stopListening();
    handlerRef.current = handler;
    window.addEventListener(
      "deviceorientation",
      handler as EventListener,
      true
    );
    setCompassState("active");
    toast.success("قطب‌نما فعال شد. گوشی را صاف و افقی نگه دارید.");
  }, [stopListening]);

  React.useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const needleRotation =
    deviceHeading != null ? qiblaBearing - deviceHeading : qiblaBearing;

  // Distance of needle from "up" (i.e., user is facing Qibla).
  const normalizedNeedle = ((needleRotation % 360) + 360) % 360;
  const distFromUp = Math.min(normalizedNeedle, 360 - normalizedNeedle);
  const isAligned = deviceHeading != null && distFromUp < 3;

  const selectedCityName = React.useMemo(
    () => POPULAR_CITIES.find((c) => c.name === city)?.name ?? undefined,
    [city]
  );

  const isGeoLoading = status === "loading";
  const compassAvailable =
    typeof window !== "undefined" && "DeviceOrientationEvent" in window;

  return (
    <div className="flex flex-col gap-5">
      {/* Section title */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Compass className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold leading-tight">قبله‌نما</h2>
            <p className="text-xs text-muted-foreground">
              جهت کعبه بر اساس موقعیت شما
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
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <LocateFixed className="h-4 w-4" />
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

      {/* Main compass + stats */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Compass card */}
        <Card className="relative overflow-hidden ornament-border">
          <CardContent className="flex flex-col items-center gap-4 px-4 py-6">
            {/* Bearing header */}
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-xs text-muted-foreground">
                زاویه قبله از شمال
              </p>
              <p className="font-arabic text-4xl font-bold text-primary">
                {toPersianDigits(Math.round(qiblaBearing))}
                <span className="text-2xl">°</span>
              </p>
              <Badge
                variant={isAligned ? "default" : "secondary"}
                className={cn(
                  "gap-1 transition-all",
                  isAligned &&
                    "bg-primary text-primary-foreground animate-soft-pulse"
                )}
              >
                {isAligned ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    رو به قبله هستید
                  </>
                ) : deviceHeading != null ? (
                  <>
                    <Navigation className="h-3 w-3" />
                    {toPersianDigits(Math.round(distFromUp))}° تا قبله
                  </>
                ) : (
                  <>
                    <Info className="h-3 w-3" />
                    حالت ایستا — قطب‌نما فعال نیست
                  </>
                )}
              </Badge>
            </div>

            {/* Compass visual */}
            <CompassDial
              needleRotation={needleRotation}
              isAligned={isAligned}
            />

            {/* Compass controls / status */}
            <div className="flex w-full flex-col items-center gap-3">
              {compassState === "active" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    stopListening();
                    setCompassState("idle");
                    setDeviceHeading(null);
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  قطب‌نما را متوقف کن
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={startCompass}
                  disabled={
                    !compassAvailable || compassState === "requesting"
                  }
                >
                  {compassState === "requesting" ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Smartphone className="h-4 w-4" />
                  )}
                  {compassState === "requesting"
                    ? "در حال درخواست دسترسی..."
                    : "فعال‌سازی قطب‌نما"}
                </Button>
              )}

              {!compassAvailable && (
                <p className="max-w-xs text-center text-xs text-muted-foreground">
                  سنسور جهت‌یابی در این دستگاه در دسترس نیست. از قطب‌نمای فیزیکی
                  استفاده کنید.
                </p>
              )}
              {compassState === "denied" && (
                <p className="max-w-xs text-center text-xs text-muted-foreground">
                  دسترسی به سنسور رد شد. می‌توانید از زاویه نمایش داده‌شده با یک
                  قطب‌نمای فیزیکی استفاده کنید.
                </p>
              )}
              {compassState === "active" && deviceHeading == null && (
                <p className="max-w-xs text-center text-xs text-muted-foreground">
                  در انتظار دریافت داده از سنسور... اگر مقداری نمایش داده نشد،
                  ممکن است دستگاه فاقد قطب‌نما باشد.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Side info column */}
        <div className="flex flex-col gap-4">
          {/* Distance card */}
          <Card className="py-4">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Navigation className="h-4 w-4 text-primary" />
                فاصله تا کعبه
              </CardTitle>
              <CardDescription className="text-xs">
                فاصله دایره‌ای بزرگ بر حسب کیلومتر
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pt-2">
              <p className="font-arabic text-3xl font-bold text-primary">
                {toPersianDigits(distanceKm.toLocaleString("en-US"))}
                <span className="ms-1 text-base font-normal text-muted-foreground">
                  کیلومتر
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                مختصات کعبه: ۲۱.۴۲۲۵° شمالی، ۳۹.۸۲۶۲° شرقی
              </p>
            </CardContent>
          </Card>

          {/* Coordinates card */}
          <Card className="py-4">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                موقعیت شما
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 px-4 pt-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground">عرض جغرافیایی</span>
                <span className="font-mono text-sm font-semibold">
                  {toPersianDigits(coords.lat.toFixed(4))}°
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground">طول جغرافیایی</span>
                <span className="font-mono text-sm font-semibold">
                  {toPersianDigits(coords.lng.toFixed(4))}°
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Info / instructions */}
          <Card className="bg-primary/5 py-4">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-primary" />
                راهنمای استفاده
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pt-2">
              <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>
                    اشارهگر طلایی همیشه رو به قبله است. دستگاه را بچرخانید تا
                    نوک آن به بالا اشاره کند.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>گوشی را کاملاً صاف و افقی نگه دارید.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Compass className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>
                    از میدان‌های مغناطیسی و فلزات دور باشید تا دقت بالاتر باشد.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Compass dial — fixed cardinal markings + rotating Qibla needle. */
function CompassDial({
  needleRotation,
  isAligned,
}: {
  needleRotation: number;
  isAligned: boolean;
}) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 130;
  const innerR = 116;

  // Tick marks every 5°, larger every 30°.
  const ticks = Array.from({ length: 72 }).map((_, i) => {
    const angle = i * 5;
    const isMajor = i % 6 === 0;
    const isCardinal = i % 18 === 0;
    const len = isCardinal ? 16 : isMajor ? 10 : 5;
    const rad = toRad(angle);
    const x1 = cx + Math.sin(rad) * (outerR - len);
    const y1 = cy - Math.cos(rad) * (outerR - len);
    const x2 = cx + Math.sin(rad) * outerR;
    const y2 = cy - Math.cos(rad) * outerR;
    return { x1, y1, x2, y2, isMajor, isCardinal, key: i };
  });

  const cardinals = [
    { label: "ش", x: cx, y: 22, sub: "N" },
    { label: "ق", x: size - 22, y: cy + 5, sub: "E" },
    { label: "ج", x: cx, y: size - 16, sub: "S" },
    { label: "غ", x: 22, y: cy + 5, sub: "W" },
  ];

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label="قطب‌نمای قبله"
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="block max-w-full"
      >
        <defs>
          <linearGradient id="compassFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.985 0.008 95)" />
            <stop offset="100%" stopColor="oklch(0.95 0.02 150)" />
          </linearGradient>
          <linearGradient id="needleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.15 75)" />
            <stop offset="55%" stopColor="oklch(0.7 0.15 75)" />
            <stop offset="100%" stopColor="oklch(0.45 0.11 162)" />
          </linearGradient>
          <radialGradient id="hubGrad" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="oklch(0.45 0.11 162)" />
            <stop offset="100%" stopColor="oklch(0.3 0.08 162)" />
          </radialGradient>
        </defs>

        {/* Outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={outerR + 6}
          fill="none"
          stroke="oklch(0.7 0.15 75 / 0.35)"
          strokeWidth="1"
        />
        <circle
          cx={cx}
          cy={cy}
          r={outerR}
          fill="url(#compassFace)"
          stroke="oklch(0.7 0.15 75 / 0.5)"
          strokeWidth="1.5"
        />
        <circle
          cx={cx}
          cy={cy}
          r={innerR}
          fill="none"
          stroke="oklch(0.45 0.11 162 / 0.15)"
          strokeWidth="1"
        />

        {/* Ticks */}
        {ticks.map((t) => (
          <line
            key={t.key}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={
              t.isCardinal
                ? "oklch(0.45 0.11 162)"
                : t.isMajor
                ? "oklch(0.45 0.11 162 / 0.6)"
                : "oklch(0.45 0.11 162 / 0.25)"
            }
            strokeWidth={t.isCardinal ? 2 : t.isMajor ? 1.5 : 1}
            strokeLinecap="round"
          />
        ))}

        {/* Cardinal letters (Persian + small Latin) */}
        {cardinals.map((c) => (
          <g key={c.label}>
            <text
              x={c.x}
              y={c.y}
              textAnchor="middle"
              className="font-arabic"
              fontSize="16"
              fontWeight="700"
              fill="oklch(0.45 0.11 162)"
            >
              {c.label}
            </text>
            <text
              x={c.x}
              y={c.y + 12}
              textAnchor="middle"
              fontSize="8"
              fill="oklch(0.5 0.02 150)"
            >
              {c.sub}
            </text>
          </g>
        ))}

        {/* Aligned glow ring */}
        {isAligned && (
          <circle
            cx={cx}
            cy={cy}
            r={outerR - 2}
            fill="none"
            stroke="oklch(0.78 0.15 75 / 0.7)"
            strokeWidth="3"
            className="animate-soft-pulse"
          />
        )}

        {/* Rotating needle group */}
        <g
          transform={`rotate(${needleRotation} ${cx} ${cy})`}
          style={{ transition: "transform 0.15s linear" }}
        >
          {/* Needle body — diamond pointing up */}
          <path
            d={`M ${cx} 32 L ${cx + 9} ${cy} L ${cx} ${cy + 14} L ${cx - 9} ${cy} Z`}
            fill="url(#needleGrad)"
            stroke="oklch(0.3 0.08 162)"
            strokeWidth="0.5"
          />
          {/* Highlight stripe */}
          <path
            d={`M ${cx} 36 L ${cx + 3} ${cy - 4} L ${cx} ${cy - 6} L ${cx - 3} ${cy - 4} Z`}
            fill="oklch(1 0 0 / 0.4)"
          />
          {/* Kaaba square at needle tip */}
          <rect
            x={cx - 9}
            y={18}
            width="18"
            height="18"
            rx="2"
            fill="#1a1a1a"
            stroke="oklch(0.78 0.15 75)"
            strokeWidth="1.5"
          />
          {/* Gold band on Kaaba */}
          <line
            x1={cx - 7}
            y1={27}
            x2={cx + 7}
            y2={27}
            stroke="oklch(0.78 0.15 75)"
            strokeWidth="1.2"
          />
          {/* Tail (lighter side) */}
          <path
            d={`M ${cx} ${cy + 14} L ${cx + 5} ${cy + 70} L ${cx} ${cy + 78} L ${cx - 5} ${cy + 70} Z`}
            fill="oklch(0.45 0.11 162 / 0.35)"
            stroke="oklch(0.45 0.11 162 / 0.5)"
            strokeWidth="0.5"
          />
        </g>

        {/* Center hub */}
        <circle cx={cx} cy={cy} r="9" fill="url(#hubGrad)" />
        <circle
          cx={cx}
          cy={cy}
          r="9"
          fill="none"
          stroke="oklch(1 0 0 / 0.6)"
          strokeWidth="1"
        />
        <circle cx={cx} cy={cy} r="3" fill="oklch(0.985 0.005 95)" />
      </svg>
    </div>
  );
}
