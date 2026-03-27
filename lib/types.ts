export type Locale = "zh-TW" | "en";

export type ScoreCategory =
  | "grandson"
  | "son"
  | "peer"
  | "father"
  | "grandpa";

export type ConfidenceLevel = "low" | "medium" | "high";

export type TeamSortKey = "score" | "teamNumber" | "ranking";

export type SortDirection = "asc" | "desc";

export type AnalysisTab = "qualification" | "playoff";

export type PlayoffFinish =
  | "none"
  | "octofinalist"
  | "quarterfinalist"
  | "semifinalist"
  | "finalist"
  | "champion";

export type EventStrengthProfile =
  | "balancedDepth"
  | "eliteDepth"
  | "topHeavy"
  | "softField"
  | "limitedData";

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

export interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
}

export interface RankingSnapshot {
  rank: number;
  matchesPlayed: number;
}

export interface QualificationSnapshot {
  score: number;
  category: ScoreCategory;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  matchesPlayed: number;
  record: TeamRecord;
  ranking: RankingSnapshot | null;
  rankPercentile: number | null;
  winRate: number | null;
  trend: number | null;
  scheduleDifficulty: number | null;
  partnerStrength: number | null;
  opponentStrength: number | null;
  adjustedPerformance: number | null;
  scorePotential: number | null;
  consistency: number | null;
  rankDelta: number | null;
  inflationRisk: number | null;
}

export interface PlayoffContext {
  allianceBased: true;
  allianceLabel: string | null;
  seed: number | null;
  isBackup: boolean;
  matchesPlayed: number;
  record: TeamRecord;
  winRate: number | null;
  advancement: PlayoffFinish;
  score: number | null;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  consistency: number | null;
}

export interface CalibrationSnapshot {
  scheduleAdvantage: number | null;
  rankDiscrepancy: number | null;
  inflationRisk: number | null;
  underseedSignal: number | null;
}

export interface TeamScore {
  teamKey: string;
  teamNumber: number;
  teamName: string;
  score: number;
  category: ScoreCategory;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  record: TeamRecord;
  ranking: RankingSnapshot | null;
  qualification: QualificationSnapshot;
  playoff: PlayoffContext | null;
  calibration: CalibrationSnapshot;
  awards: string[];
}

export interface EventFieldStrength {
  score: number;
  category: ScoreCategory;
  confidence: number;
  profile: EventStrengthProfile;
  topAverage: number | null;
  depthAverage: number | null;
  median: number | null;
}

export interface EventSummary {
  key: string;
  name: string;
  eventType: number;
  isPlayoffOnly: boolean;
  districtDisplay: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  year: number;
  teamCount: number;
  completedMatches: number;
  qualificationMatches: number;
  playoffMatches: number;
  analyzedAt: string;
  fieldStrength: EventFieldStrength;
}

export interface EventScoresResponse {
  event: EventSummary;
  teams: TeamScore[];
}
