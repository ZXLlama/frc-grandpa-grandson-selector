import { CATEGORY_THEME, clamp, scoreToGaugePercent } from "@/lib/constants";
import { getAlliancePositionLabel, getDictionary } from "@/lib/i18n";
import type {
  EventOption,
  Locale,
  PlayoffContext,
  ScoreCategory,
  TeamRecord,
} from "@/lib/types";

export function getCategoryTheme(category: ScoreCategory) {
  return CATEGORY_THEME[category];
}

export function formatSignedScore(score: number): string {
  const rounded = clamp(score, -10, 10).toFixed(1);
  return score > 0 ? `+${rounded}` : rounded;
}

export function getGaugeFill(score: number): number {
  return scoreToGaugePercent(score);
}

export function formatRecord(record: TeamRecord): string {
  return `${record.wins}-${record.losses}-${record.ties}`;
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(clamp(confidence, 0, 1) * 100)}%`;
}

export function formatNumber(
  value: number | null,
  maximumFractionDigits = 2,
): string {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

export function formatPercent(value: number | null, digits = 0): string | null {
  if (value === null) {
    return null;
  }

  return `${(value * 100).toFixed(digits)}%`;
}

export function formatEventLocation(
  event: Pick<EventOption, "city" | "stateProv" | "country">,
): string | null {
  const parts = [event.city, event.stateProv, event.country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export function formatEventDateRange(
  locale: Locale,
  event: Pick<EventOption, "startDate" | "endDate">,
): string | null {
  if (!event.startDate) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat(
    locale === "zh-TW" ? "zh-TW" : "en-US",
    {
      month: "short",
      day: "numeric",
    },
  );

  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  if (!end || Number.isNaN(end.getTime())) {
    return formatter.format(start);
  }

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function formatMetaList(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(" · ");
}

export function buildRelativeComparisonText(input: {
  locale: Locale;
  referenceTeamNumber: number;
  displayedScore: number;
  isReference: boolean;
}): string {
  const dictionary = getDictionary(input.locale);

  if (input.isReference) {
    return dictionary.relativeComparisonSelf;
  }

  return dictionary.relativeComparisonVs
    .replace("%TEAM%", String(input.referenceTeamNumber))
    .replace("%SCORE%", formatSignedScore(input.displayedScore));
}

export function getPlayoffPositionText(
  locale: Locale,
  playoff: PlayoffContext | null,
): string | null {
  if (!playoff) {
    return null;
  }

  return getAlliancePositionLabel({
    locale,
    seed: playoff.seed,
    slot: playoff.slot,
    isBackup: playoff.isBackup,
  });
}
