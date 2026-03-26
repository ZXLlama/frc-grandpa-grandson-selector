export type Locale = "zh-TW" | "en";

export type ScoreCategory =
  | "grandson"
  | "son"
  | "peer"
  | "father"
  | "grandpa";

export type ScoreMetricKey =
  | "ranking"
  | "winRate"
  | "trend"
  | "allianceScore"
  | "scheduleStrength"
  | "bonus";

export interface EventOption {
  key: string;
  name: string;
  eventCode: string;
  eventType: number;
  districtKey: string | null;
  districtDisplay: string | null;
  city: string | null;
  stateProv: string | null;
  country: string | null;
  startDate: string | null;
  endDate: string | null;
  year: number;
}

export interface EventsResponse {
  year: number;
  events: EventOption[];
}

export interface ScoreBreakdown {
  key: ScoreMetricKey;
  raw: number | null;
  confidence: number;
  effectiveWeight: number;
  contribution: number;
  available: boolean;
}

export interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
}

export interface TeamScore {
  teamKey: string;
  teamNumber: number;
  teamName: string;
  score: number;
  category: ScoreCategory;
  confidence: number;
  sampleSize: number;
  breakdown: ScoreBreakdown[];
  record: TeamRecord;
  ranking: {
    rank: number;
    matchesPlayed: number;
  } | null;
  awards: string[];
  playoffMatches: number;
}

export interface EventSummary {
  key: string;
  name: string;
  eventType: number;
  districtDisplay: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  year: number;
  teamCount: number;
  completedMatches: number;
  analyzedAt: string;
}

export interface EventScoresResponse {
  event: EventSummary;
  teams: TeamScore[];
}
