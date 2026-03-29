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
export type DashboardTab = AnalysisTab | "awards";

export type PlayoffFinish =
  | "none"
  | "octofinalist"
  | "quarterfinalist"
  | "semifinalist"
  | "finalist"
  | "champion";

export type EventStrengthProfile =
  | "championshipFinals"
  | "balancedDepth"
  | "eliteDepth"
  | "topHeavy"
  | "softField"
  | "limitedData";

export type EventProgressStage =
  | "qualificationEarly"
  | "qualificationMidLate"
  | "playoffs"
  | "finished";

export type ChampionshipQualifierReason =
  | "winnerCaptain"
  | "winnerFirstPick"
  | "impactAward"
  | "engineeringInspirationAward"
  | "rookieAllStarAward";

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
  rankingScore: number | null;
  totalRankingPoints: number | null;
}

export interface QualificationSnapshot {
  score: number;
  category: ScoreCategory;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  matchesPlayed: number;
  record: TeamRecord;
  ranking: RankingSnapshot | null;
  rankingScore: number | null;
  totalRankingPoints: number | null;
  rankPercentile: number | null;
  winRate: number | null;
  trend: number | null;
  scheduleDifficulty: number | null;
  partnerStrength: number | null;
  opponentStrength: number | null;
  adjustedPerformance: number | null;
  scorePotential: number | null;
  cleanScoring: number | null;
  scoringCeiling: number | null;
  scoringFloor: number | null;
  foulReliance: number | null;
  autonomousImpact: number | null;
  endgameImpact: number | null;
  districtPointTotal: number | null;
  rankingTiebreaker: number | null;
  consistency: number | null;
  rankDelta: number | null;
  inflationRisk: number | null;
}

export interface PlayoffContext {
  allianceBased: true;
  allianceLabel: string | null;
  seed: number | null;
  slot: number | null;
  positionCode: string | null;
  isBackup: boolean;
  matchesPlayed: number;
  record: TeamRecord;
  winRate: number | null;
  advancement: PlayoffFinish;
  score: number | null;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  consistency: number | null;
  isComplete: boolean;
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
  distribution: Record<ScoreCategory, number>;
  topAverage: number | null;
  depthAverage: number | null;
  median: number | null;
}

export interface EventProgress {
  stage: EventProgressStage;
  percent: number;
  qualificationCompletion: number | null;
  playoffCompletion: number | null;
}

export interface ChampionshipQualifier {
  teamKey: string;
  teamNumber: number;
  teamName: string;
  reasons: ChampionshipQualifierReason[];
}

export interface AwardRecipientSummary {
  teamKey: string | null;
  teamNumber: number | null;
  teamName: string | null;
  awardee: string | null;
}

export interface AwardSummary {
  name: string;
  recipients: AwardRecipientSummary[];
}

export interface EventAwardsSummary {
  championshipQualifiers: ChampionshipQualifier[];
  allAwards: AwardSummary[];
}

export interface EventSummary {
  key: string;
  name: string;
  eventType: number;
  isPlayoffOnly: boolean;
  isFinished: boolean;
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
  progress: EventProgress;
  fieldStrength: EventFieldStrength;
}

export interface EventScoresResponse {
  event: EventSummary;
  awards: EventAwardsSummary;
  teams: TeamScore[];
}
