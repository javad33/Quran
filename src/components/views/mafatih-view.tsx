"use client";

import * as React from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Copy,
  MapPin,
  Clock,
  Star,
  Sun,
  CircleDot,
  Heart,
  Crown,
  BookOpen,
  HeartHandshake,
  Shield,
  Scroll,
  Landmark,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  DUAS,
  DUA_CATEGORIES,
  type Dua,
  type DuaCategory,
} from "@/lib/mafatih-data";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Map mafatih-data icon strings → lucide components. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  sun: Sun,
  "circle-dot": CircleDot,
  heart: Heart,
  crown: Crown,
  "book-open": BookOpen,
  "hand-heart": HeartHandshake,
  shield: Shield,
  scroll: Scroll,
  landmark: Landmark,
  sparkles: Sparkles,
};

function getCategoryLabel(id: DuaCategory): string {
  return DUA_CATEGORIES.find((c) => c.id === id)?.label || id;
}

function getCategoryIconName(id: DuaCategory): string {
  return DUA_CATEGORIES.find((c) => c.id === id)?.icon || "sparkles";
}

/** Module-level icon renderer (avoids "components created during render"). */
function DuaCategoryIcon({
  category,
  className,
}: {
  category: DuaCategory;
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[getCategoryIconName(category)] || Sparkles;
  return <Icon className={className} />;
}

interface DuaCardProps {
  dua: Dua;
}

function DuaCard({ dua }: DuaCardProps) {
  const [expanded, setExpanded] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dua.arabic);
      toast.success("متن عربی دعا کپی شد");
    } catch {
      toast.error("کپی موفق نبود");
    }
  };

  return (
    <Card className="group flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <DuaCategoryIcon category={dua.category} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-bold leading-tight">{dua.title}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{dua.occasion}</span>
            </p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="shrink-0 bg-primary/10 text-primary"
        >
          {getCategoryLabel(dua.category)}
        </Badge>
      </div>

      {/* Arabic preview / full */}
      <div
        className={cn(
          "font-arabic text-right text-xl leading-loose text-foreground whitespace-pre-line",
          !expanded && "line-clamp-2"
        )}
        dir="rtl"
      >
        {dua.arabic}
      </div>

      {/* Expandable body */}
      {expanded && (
        <div className="flex flex-col gap-4">
          <div className="divider-ornament">
            <Star className="h-3.5 w-3.5 fill-current text-primary/60" />
          </div>
          <div
            className="text-justify text-sm leading-7 text-muted-foreground whitespace-pre-line"
            dir="rtl"
          >
            {dua.persian}
          </div>
          {dua.note && (
            <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs leading-6 text-foreground/80">
              <p className="mb-1 flex items-center gap-1.5 font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>یادداشت</span>
              </p>
              <p className="leading-6">{dua.note}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-primary"
        >
          <Copy className="h-4 w-4" />
          <span>کپی متن</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          className="text-muted-foreground hover:text-primary"
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <span>بستن</span>
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              <span>مشاهدهٔ کامل</span>
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

export function MafatihView() {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<DuaCategory | "all">("all");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return DUAS.filter((d) => {
      const matchCat = category === "all" || d.category === category;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.occasion.toLowerCase().includes(q) ||
        d.persian.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-arabic text-2xl font-bold leading-tight sm:text-3xl">
              مفاتیح الجنان
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              مجموعه‌ای از ادعیه و زیارات معتبر
            </p>
          </div>
        </div>
        <div className="divider-ornament">
          <Star className="h-4 w-4 fill-current text-primary/60" />
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجو در ادعیه (عنوان یا مناسبت)..."
          className="h-11 rounded-xl pr-10"
          aria-label="جستجو"
        />
      </div>

      {/* Category chips */}
      <div className="custom-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <CategoryChip
          active={category === "all"}
          onClick={() => setCategory("all")}
          label="همه"
          icon={<Star className="h-3.5 w-3.5" />}
        />
        {DUA_CATEGORIES.map((c) => (
          <CategoryChip
            key={c.id}
            active={category === c.id}
            onClick={() => setCategory(c.id)}
            label={c.label}
            icon={
              <DuaCategoryIcon category={c.id} className="h-3.5 w-3.5" />
            }
          />
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} دعا یافت شد
      </p>

      {/* Dua cards */}
      {filtered.length === 0 ? (
        <Card className="rounded-2xl border-dashed bg-card/50 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            موردی یافت نشد. عبارت دیگری را جستجو کنید.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((d) => (
            <DuaCard key={d.id} dua={d} />
          ))}
        </div>
      )}
    </div>
  );
}

interface CategoryChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}

function CategoryChip({ active, onClick, label, icon }: CategoryChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
