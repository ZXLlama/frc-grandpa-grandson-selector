import { CATEGORY_THEME, clamp, scoreToGaugePercent } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n";
import type {
  EventOption,
  Locale,
  ScoreCategory,
  TeamRecord,
  TeamScore,
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

export function buildTeamSummary(team: TeamScore, locale: Locale): string {
  const dictionary = getDictionary(locale);

  if (team.sampleSize === 0) {
    return dictionary.noMatchesSummary;
  }

  const rankedMetrics = [...team.breakdown]
    .filter((metric) => metric.available && Math.abs(metric.contribution) >= 0.025)
    .sort((left, right) => Math.abs(right.contribution) - Math.abs(left.contribution));

  const parts: string[] = [];

  const positive = rankedMetrics.find((metric) => metric.contribution > 0);
  const negative = rankedMetrics.find((metric) => metric.contribution < 0);

  if (positive) {
    parts.push(dictionary.metricSummary[positive.key].positive);
  }

  if (negative && parts.length < 2) {
    parts.push(dictionary.metricSummary[negative.key].negative);
  }

  if (team.confidence < 0.45 && parts.length < 2) {
    parts.push(dictionary.lowDataSummary);
  }

  if (!parts.length) {
    parts.push(dictionary.neutralSummary);
  }

  return parts.slice(0, 2).join(" · ");
}
