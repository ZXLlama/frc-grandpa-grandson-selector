import type {
  ConfidenceLevel,
  ScoreCategory,
  SortDirection,
  TeamSortKey,
} from "@/lib/types";

export const APP_NAME = "FRC爺爺孫子選擇器";
export const MIN_FRC_YEAR = 1992;
export const DEFAULT_FRC_YEAR = new Date().getFullYear();
export const DEFAULT_REFERENCE_TEAM_KEY = "";
export const DEFAULT_SORT_KEY: TeamSortKey = "score";
export const DEFAULT_SORT_DIRECTION: SortDirection = "desc";

export const CATEGORY_THEME: Record<
  ScoreCategory,
  {
    accent: string;
    tint: string;
    border: string;
    glow: string;
    text: string;
    gaugeTrack: string;
  }
> = {
  grandpa: {
    accent: "#2cf3c2",
    tint: "rgba(44, 243, 194, 0.14)",
    border: "rgba(44, 243, 194, 0.45)",
    glow: "rgba(44, 243, 194, 0.28)",
    text: "#d6fff4",
    gaugeTrack: "rgba(44, 243, 194, 0.14)",
  },
  father: {
    accent: "#84ff66",
    tint: "rgba(132, 255, 102, 0.12)",
    border: "rgba(132, 255, 102, 0.42)",
    glow: "rgba(132, 255, 102, 0.24)",
    text: "#ebffe4",
    gaugeTrack: "rgba(132, 255, 102, 0.14)",
  },
  peer: {
    accent: "#77d9ff",
    tint: "rgba(119, 217, 255, 0.12)",
    border: "rgba(119, 217, 255, 0.35)",
    glow: "rgba(119, 217, 255, 0.2)",
    text: "#e5f9ff",
    gaugeTrack: "rgba(119, 217, 255, 0.14)",
  },
  son: {
    accent: "#ffb34f",
    tint: "rgba(255, 179, 79, 0.13)",
    border: "rgba(255, 179, 79, 0.4)",
    glow: "rgba(255, 179, 79, 0.24)",
    text: "#fff2df",
    gaugeTrack: "rgba(255, 179, 79, 0.14)",
  },
  grandson: {
    accent: "#ff6d7c",
    tint: "rgba(255, 109, 124, 0.12)",
    border: "rgba(255, 109, 124, 0.4)",
    glow: "rgba(255, 109, 124, 0.22)",
    text: "#ffe7ea",
    gaugeTrack: "rgba(255, 109, 124, 0.14)",
  },
};

const EVENT_TYPE_KEYS: Record<number, string> = {
  0: "regional",
  1: "district",
  2: "districtChampionship",
  3: "championshipDivision",
  4: "championshipFinals",
  5: "districtChampionshipDivision",
  6: "festival",
  99: "offseason",
  100: "preseason",
  101: "scrimmage",
};

export function getEventTypeKey(eventType: number | null | undefined): string {
  return EVENT_TYPE_KEYS[eventType ?? -1] ?? "other";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundTo(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function scoreToGaugePercent(score: number): number {
  return ((clamp(score, -10, 10) + 10) / 20) * 100;
}

export function getCategoryForScore(score: number): ScoreCategory {
  if (score >= 6) {
    return "grandpa";
  }

  if (score > 2) {
    return "father";
  }

  if (score <= -6) {
    return "grandson";
  }

  if (score < -2) {
    return "son";
  }

  return "peer";
}

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.72) {
    return "high";
  }

  if (confidence >= 0.42) {
    return "medium";
  }

  return "low";
}
