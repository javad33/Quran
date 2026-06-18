export type ViewId =
  | "home"
  | "quran"
  | "prayer"
  | "qibla"
  | "tasbih"
  | "mafatih"
  | "calendar";

export interface NavItem {
  id: ViewId;
  label: string;
  shortLabel: string;
  icon: string; // lucide icon name
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "خانه",
    shortLabel: "خانه",
    icon: "Home",
    description: "نمای کلی و آیه روز",
  },
  {
    id: "quran",
    label: "قرآن کریم",
    shortLabel: "قرآن",
    icon: "BookOpen",
    description: "تلاوت، ترجمه و جستجو در قرآن",
  },
  {
    id: "prayer",
    label: "اوقات شرعی",
    shortLabel: "اوقات",
    icon: "Clock",
    description: "اوقات نماز بر اساس موقعیت",
  },
  {
    id: "qibla",
    label: "قبله‌نما",
    shortLabel: "قبله",
    icon: "Compass",
    description: "جهت قبله",
  },
  {
    id: "tasbih",
    label: "تسبیح‌شمار",
    shortLabel: "تسبیح",
    icon: "CircleDot",
    description: "شمارش ذکر",
  },
  {
    id: "mafatih",
    label: "مفاتیح الجنان",
    shortLabel: "مفاتیح",
    icon: "HeartHandshake",
    description: "ادعیه و زیارات",
  },
  {
    id: "calendar",
    label: "تقویم هجری",
    shortLabel: "تقویم",
    icon: "Calendar",
    description: "تقویم قمری و شمسی",
  },
];
