import {
  clamp,
  getCategoryForScore,
  getConfidenceLevel,
  roundTo,
} from "@/lib/constants";
import type {
  QualificationSnapshot,
  RankingSnapshot,
  TeamRecord,
} from "@/lib/types";
import type {
  TbaCoprs,
  TbaDistrictPoints,
  TbaEventInsights,
  TbaEventTeamStatuses,
  TbaMatchSimple,
  TbaOprs,
  TbaRankingEntry,
  TbaRankings,
  TbaTeamSimple,
} from "@/lib/server/tba";
import {
  mean,
  normalizeDistribution,
  normalizeValue,
  standardDeviation,
} from "@/lib/scoring/math";
import {
  getMatchOrder,
  getRankingRecord,
  getWinRate,
  isPlayedMatch,
} from "@/lib/scoring/shared";

type BreakdownMetrics = {
  cleanScore: number | null;
  foulReliance: number | null;
  autoShare: number | null;
  endgameShare: number | null;
};

type QualificationAppearance = {
  order: number;
  ownScore: number;
  opponentScore: number;
  performance: number;
  partnerKeys: string[];
  opponentKeys: string[];
  breakdown: BreakdownMetrics;
};

type QualificationAggregate = {
  playedMatches: number;
  wins: number;
  losses: number;
  ties: number;
  ownScores: number[];
  margins: number[];
  appearances: QualificationAppearance[];
};

type QualificationMetrics = QualificationSnapshot & {
  rawSignal: number;
};

type ComponentSignals = {
  autoSignals: Map<string, number | null>;
  endgameSignals: Map<string, number | null>;
  breadthSignals: Map<string, number | null>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStatusQualRank(status: unknown): number | null {
  if (!isRecord(status)) {
    return null;
  }

  const qual = isRecord(status.qual) ? status.qual : null;
  const ranking = qual && isRecord(qual.ranking) ? qual.ranking : null;

  if (ranking && typeof ranking.rank === "number") {
    return ranking.rank;
  }

  if (qual && typeof qual.rank === "number") {
    return qual.rank;
  }

  return null;
}

function getStatusMatchesPlayed(status: unknown): number | null {
  if (!isRecord(status)) {
    return null;
  }

  const qual = isRecord(status.qual) ? status.qual : null;
  const ranking = qual && isRecord(qual.ranking) ? qual.ranking : null;

  if (ranking && typeof ranking.matches_played === "number") {
    return ranking.matches_played;
  }

  if (qual && typeof qual.num_matches_played === "number") {
    return qual.num_matches_played;
  }

  return null;
}

function getStatusRecord(status: unknown): TeamRecord | null {
  if (!isRecord(status)) {
    return null;
  }

  const qual = isRecord(status.qual) ? status.qual : null;
  const ranking = qual && isRecord(qual.ranking) ? qual.ranking : null;
  const record = ranking && isRecord(ranking.record)
    ? ranking.record
    : qual && isRecord(qual.record)
      ? qual.record
      : null;

  if (!record) {
    return null;
  }

  return {
    wins: typeof record.wins === "number" ? record.wins : 0,
    losses: typeof record.losses === "number" ? record.losses : 0,
    ties: typeof record.ties === "number" ? record.ties : 0,
  };
}

function getRankingSignalFromRank(
  rank: number | null,
  rankingCount: number,
): number | null {
  if (rank === null || rankingCount <= 1) {
    return null;
  }

  return clamp((1 - (rank - 1) / (rankingCount - 1)) * 2 - 1, -1, 1);
}

function getRankPercentileFromRank(
  rank: number | null,
  rankingCount: number,
): number | null {
  if (rank === null || rankingCount <= 1) {
    return null;
  }

  return clamp(1 - (rank - 1) / (rankingCount - 1), 0, 1);
}

function averageSignals(values: Array<number | null | undefined>): number | null {
  const numeric = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );

  if (!numeric.length) {
    return null;
  }

  return mean(numeric);
}

function toRankingSnapshot(
  rank: number | null,
  matchesPlayed: number | null,
  rankingScore: number | null,
): RankingSnapshot | null {
  if (rank === null) {
    return null;
  }

  return {
    rank,
    matchesPlayed: matchesPlayed ?? 0,
    rankingScore,
  };
}

function getRankingScoreValue(ranking: TbaRankingEntry | null): number | null {
  if (!ranking) {
    return null;
  }

  if (typeof ranking.qual_average === "number" && Number.isFinite(ranking.qual_average)) {
    return ranking.qual_average;
  }

  const firstSortOrder = ranking.sort_orders[0];
  return typeof firstSortOrder === "number" && Number.isFinite(firstSortOrder)
    ? firstSortOrder
    : null;
}

function getStabilitySignal(performances: number[]): number | null {
  if (performances.length < 2) {
    return null;
  }

  const deviation = standardDeviation(performances);
  return clamp((1 - deviation / 0.9) * 2 - 1, -1, 1);
}

function getTrendSignal(appearances: QualificationAppearance[]): number | null {
  if (!appearances.length) {
    return null;
  }

  const recentAppearances = [...appearances]
    .sort((left, right) => left.order - right.order)
    .slice(-5);

  const weightedTotal = recentAppearances.reduce((sum, appearance, index) => {
    const weight = index + 1;
    return sum + appearance.performance * weight;
  }, 0);
  const weightTotal = recentAppearances.reduce(
    (sum, _appearance, index) => sum + index + 1,
    0,
  );

  return clamp(weightedTotal / Math.max(weightTotal, 1), -1, 1);
}

function getScheduleAverage(
  teamKeys: string[],
  ratings: Map<string, number>,
): number | null {
  const values = teamKeys
    .map((teamKey) => ratings.get(teamKey))
    .filter((value): value is number => typeof value === "number");

  if (!values.length) {
    return null;
  }

  return mean(values);
}

function collectBreakdownBuckets(
  node: unknown,
  bucket: { auto: number; endgame: number; foul: number },
  path: string[] = [],
) {
  if (typeof node === "number" && Number.isFinite(node)) {
    const joined = path.join(".").toLowerCase();
    const key = path[path.length - 1]?.toLowerCase() ?? "";
    const pointsLike =
      joined.includes("points") ||
      key.endsWith("points") ||
      key === "total";

    if (!pointsLike) {
      return;
    }

    if (joined.includes("foul") || joined.includes("penalty")) {
      bucket.foul += node;
    }

    if (joined.includes("auto") && joined.includes("points")) {
      bucket.auto += node;
    }

    if (
      (joined.includes("endgame") ||
        joined.includes("climb") ||
        joined.includes("charge") ||
        joined.includes("park") ||
        joined.includes("hang") ||
        joined.includes("cage") ||
        joined.includes("tower") ||
        joined.includes("trap")) &&
      joined.includes("points")
    ) {
      bucket.endgame += node;
    }

    return;
  }

  if (!isRecord(node)) {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    collectBreakdownBuckets(value, bucket, [...path, key]);
  }
}

function extractBreakdownMetrics(
  match: TbaMatchSimple,
  color: "red" | "blue",
  ownScore: number,
): BreakdownMetrics {
  if (!isRecord(match.score_breakdown)) {
    return {
      cleanScore: null,
      foulReliance: null,
      autoShare: null,
      endgameShare: null,
    };
  }

  const allianceBreakdown = match.score_breakdown[color];

  if (!isRecord(allianceBreakdown)) {
    return {
      cleanScore: null,
      foulReliance: null,
      autoShare: null,
      endgameShare: null,
    };
  }

  const bucket = { auto: 0, endgame: 0, foul: 0 };
  collectBreakdownBuckets(allianceBreakdown, bucket);

  const cleanScore = Math.max(ownScore - bucket.foul, 0);

  return {
    cleanScore,
    foulReliance:
      ownScore > 0 ? clamp(bucket.foul / Math.max(ownScore, 1), 0, 1) : null,
    autoShare:
      cleanScore > 0 ? clamp(bucket.auto / cleanScore, 0, 1.2) : null,
    endgameShare:
      cleanScore > 0 ? clamp(bucket.endgame / cleanScore, 0, 1.2) : null,
  };
}

function isAutoComponent(name: string): boolean {
  return /auto/i.test(name);
}

function isEndgameComponent(name: string): boolean {
  return /(endgame|climb|charge|park|hang|tower|cage|trap)/i.test(name);
}

function buildComponentSignals(
  teams: TbaTeamSimple[],
  coprs: TbaCoprs | null,
): ComponentSignals {
  const componentEntries = Object.entries(coprs ?? {}).filter(
    ([, values]) => values && typeof values === "object",
  );
  const normalizedByComponent = componentEntries.map(([name, values]) => [
    name,
    normalizeDistribution(
      new Map(
        teams.map((team) => [
          team.key,
          typeof values[team.key] === "number" ? values[team.key] : null,
        ]),
      ),
      1.55,
    ),
  ]) as Array<[string, Map<string, number | null>]>;

  const autoSignals = new Map<string, number | null>();
  const endgameSignals = new Map<string, number | null>();
  const breadthSignals = new Map<string, number | null>();

  for (const team of teams) {
    const autoValues: Array<number | null> = [];
    const endgameValues: Array<number | null> = [];
    const allValues: Array<number | null> = [];

    for (const [name, values] of normalizedByComponent) {
      const signal = values.get(team.key) ?? null;
      allValues.push(signal);

      if (isAutoComponent(name)) {
        autoValues.push(signal);
      }

      if (isEndgameComponent(name)) {
        endgameValues.push(signal);
      }
    }

    autoSignals.set(team.key, averageSignals(autoValues));
    endgameSignals.set(team.key, averageSignals(endgameValues));
    breadthSignals.set(team.key, averageSignals(allValues));
  }

  return {
    autoSignals,
    endgameSignals,
    breadthSignals,
  };
}

export function analyzeQualification(input: {
  teams: TbaTeamSimple[];
  rankings: TbaRankings;
  matches: TbaMatchSimple[];
  oprs: TbaOprs | null;
  coprs: TbaCoprs | null;
  insights: TbaEventInsights | null;
  teamStatuses: TbaEventTeamStatuses | null;
  districtPoints: TbaDistrictPoints | null;
}): {
  qualificationMatches: TbaMatchSimple[];
  results: Map<string, QualificationMetrics>;
} {
  const teams = [...input.teams].sort(
    (left, right) => left.team_number - right.team_number,
  );
  const teamSet = new Set(teams.map((team) => team.key));
  const rankings = input.rankings?.rankings ?? [];
  const rankingMap = new Map(rankings.map((ranking) => [ranking.team_key, ranking]));
  const teamStatuses = new Map(Object.entries(input.teamStatuses ?? {}));
  const rankingUniverse = Math.max(rankings.length, teams.length);
  const qualificationMatches = input.matches
    .filter((match) => isPlayedMatch(match) && match.comp_level === "qm")
    .sort((left, right) => getMatchOrder(left) - getMatchOrder(right));

  const aggregates = new Map<string, QualificationAggregate>();

  for (const team of teams) {
    aggregates.set(team.key, {
      playedMatches: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      ownScores: [],
      margins: [],
      appearances: [],
    });
  }

  const eventAllianceScores: number[] = [];
  const eventMargins: number[] = [];

  for (const match of qualificationMatches) {
    const order = getMatchOrder(match);

    const processAlliance = (
      color: "red" | "blue",
      ownAlliance: TbaMatchSimple["alliances"]["red"],
      opponentAlliance: TbaMatchSimple["alliances"]["blue"],
    ) => {
      const ownScore = ownAlliance.score;
      const opponentScore = opponentAlliance.score;
      const margin = ownScore - opponentScore;
      const didWin = margin > 0;
      const didLose = margin < 0;
      const breakdown = extractBreakdownMetrics(match, color, ownScore);

      eventAllianceScores.push(ownScore);
      eventMargins.push(margin);

      for (const teamKey of ownAlliance.team_keys) {
        const aggregate = aggregates.get(teamKey);

        if (!aggregate || !teamSet.has(teamKey)) {
          continue;
        }

        aggregate.playedMatches += 1;
        aggregate.ownScores.push(ownScore);
        aggregate.margins.push(margin);

        if (didWin) {
          aggregate.wins += 1;
        } else if (didLose) {
          aggregate.losses += 1;
        } else {
          aggregate.ties += 1;
        }

        aggregate.appearances.push({
          order,
          ownScore,
          opponentScore,
          performance: 0,
          partnerKeys: ownAlliance.team_keys.filter(
            (partnerKey) => partnerKey !== teamKey && teamSet.has(partnerKey),
          ),
          opponentKeys: opponentAlliance.team_keys.filter((opponentKey) =>
            teamSet.has(opponentKey),
          ),
          breakdown,
        });
      }
    };

    processAlliance("red", match.alliances.red, match.alliances.blue);
    processAlliance("blue", match.alliances.blue, match.alliances.red);
  }

  const scoreMean = mean(eventAllianceScores);
  const scoreDeviation =
    standardDeviation(eventAllianceScores) ||
    Math.max(scoreMean * 0.16, 12);
  const marginDeviation = standardDeviation(eventMargins) || Math.max(scoreDeviation, 18);

  for (const aggregate of aggregates.values()) {
    for (const appearance of aggregate.appearances) {
      const marginSignal = normalizeValue(
        appearance.ownScore - appearance.opponentScore,
        0,
        marginDeviation,
        1.2,
      );
      const scoreSignal = normalizeValue(
        appearance.ownScore,
        scoreMean,
        scoreDeviation,
        1.35,
      );
      const outcomeSignal =
        appearance.ownScore > appearance.opponentScore
          ? 1
          : appearance.ownScore < appearance.opponentScore
            ? -1
            : 0;

      appearance.performance = clamp(
        marginSignal * 0.52 + scoreSignal * 0.24 + outcomeSignal * 0.18,
        -1,
        1,
      );
    }
  }

  const oprValues = new Map<string, number | null>();
  const ccwmValues = new Map<string, number | null>();
  const allianceScoreValues = new Map<string, number | null>();
  const cleanScoreValues = new Map<string, number | null>();
  const ceilingValues = new Map<string, number | null>();
  const floorValues = new Map<string, number | null>();
  const foulRelianceValues = new Map<string, number | null>();
  const autoBreakdownValues = new Map<string, number | null>();
  const endgameBreakdownValues = new Map<string, number | null>();
  const rankingSignals = new Map<string, number | null>();
  const rankingTiebreakers = new Map<string, number | null>();
  const districtPointTotals = new Map<string, number | null>();

  const componentSignals = buildComponentSignals(teams, input.coprs);

  for (const team of teams) {
    const aggregate = aggregates.get(team.key)!;
    const ranking = rankingMap.get(team.key) ?? null;
    const status = teamStatuses.get(team.key) ?? null;
    const rankValue = ranking?.rank ?? getStatusQualRank(status);

    oprValues.set(team.key, input.oprs?.oprs?.[team.key] ?? null);
    ccwmValues.set(team.key, input.oprs?.ccwms?.[team.key] ?? null);
    allianceScoreValues.set(
      team.key,
      aggregate.ownScores.length ? mean(aggregate.ownScores) : null,
    );
    cleanScoreValues.set(
      team.key,
      averageSignals(
        aggregate.appearances.map((appearance) => appearance.breakdown.cleanScore),
      ),
    );
    ceilingValues.set(
      team.key,
      aggregate.ownScores.length ? Math.max(...aggregate.ownScores) : null,
    );
    floorValues.set(
      team.key,
      aggregate.ownScores.length ? Math.min(...aggregate.ownScores) : null,
    );
    foulRelianceValues.set(
      team.key,
      averageSignals(
        aggregate.appearances.map((appearance) => appearance.breakdown.foulReliance),
      ),
    );
    autoBreakdownValues.set(
      team.key,
      averageSignals(
        aggregate.appearances.map((appearance) => appearance.breakdown.autoShare),
      ),
    );
    endgameBreakdownValues.set(
      team.key,
      averageSignals(
        aggregate.appearances.map((appearance) => appearance.breakdown.endgameShare),
      ),
    );
    rankingSignals.set(team.key, getRankingSignalFromRank(rankValue, rankingUniverse));
    rankingTiebreakers.set(
      team.key,
      ranking
        ? [...ranking.sort_orders, ...ranking.extra_stats].reduce(
            (sum, value) => sum + value,
            0,
          )
        : null,
    );
    districtPointTotals.set(
      team.key,
      input.districtPoints?.points?.[team.key]?.total ?? null,
    );
  }

  const normalizedOprs = normalizeDistribution(oprValues, 1.75);
  const normalizedCcwms = normalizeDistribution(ccwmValues, 1.65);
  const normalizedAllianceScores = normalizeDistribution(allianceScoreValues, 1.6);
  const normalizedCleanScores = normalizeDistribution(cleanScoreValues, 1.5);
  const normalizedCeilings = normalizeDistribution(ceilingValues, 1.55);
  const normalizedFloors = normalizeDistribution(floorValues, 1.55);
  const normalizedAutoBreakdown = normalizeDistribution(autoBreakdownValues, 1.3);
  const normalizedEndgameBreakdown = normalizeDistribution(endgameBreakdownValues, 1.3);
  const normalizedTiebreakers = normalizeDistribution(rankingTiebreakers, 1.45);
  const normalizedDistrictPoints = normalizeDistribution(districtPointTotals, 1.45);

  let ratings = new Map<string, number>();

  for (const team of teams) {
    const initial = averageSignals([
      normalizedCcwms.get(team.key) ?? null,
      normalizedOprs.get(team.key) ?? null,
      rankingSignals.get(team.key) ?? null,
      normalizedCleanScores.get(team.key) ?? null,
      componentSignals.breadthSignals.get(team.key) ?? null,
    ]);

    ratings.set(team.key, clamp(initial ?? 0, -1, 1));
  }

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const nextValues = new Map<string, number | null>();

    for (const team of teams) {
      const aggregate = aggregates.get(team.key)!;
      const priorRating = ratings.get(team.key) ?? 0;
      const baseSignal = averageSignals([
        normalizedCcwms.get(team.key) ?? null,
        normalizedOprs.get(team.key) ?? null,
        rankingSignals.get(team.key) ?? null,
        normalizedCleanScores.get(team.key) ?? null,
        componentSignals.breadthSignals.get(team.key) ?? null,
      ]) ?? priorRating;

      if (!aggregate.appearances.length) {
        nextValues.set(team.key, baseSignal);
        continue;
      }

      const adjustedAppearances = aggregate.appearances.map((appearance) => {
        const partnerAverage =
          getScheduleAverage(appearance.partnerKeys, ratings) ?? 0;
        const opponentAverage =
          getScheduleAverage(appearance.opponentKeys, ratings) ?? 0;

        return clamp(
          appearance.performance - partnerAverage * 0.34 + opponentAverage * 0.28,
          -1.4,
          1.4,
        );
      });

      nextValues.set(
        team.key,
        clamp(mean(adjustedAppearances) * 0.72 + baseSignal * 0.28, -1.4, 1.4),
      );
    }

    const normalized = normalizeDistribution(nextValues, 1.2);
    ratings = new Map(
      [...normalized.entries()].map(([teamKey, value]) => [teamKey, value ?? 0]),
    );
  }

  const rawSignals = new Map<string, number | null>();
  const metricsByTeam = new Map<
    string,
    Omit<
      QualificationMetrics,
      "score" | "category" | "confidence" | "confidenceLevel"
    > & {
      baseConfidence: number;
    }
  >();

  for (const team of teams) {
    const aggregate = aggregates.get(team.key)!;
    const ranking = rankingMap.get(team.key) ?? null;
    const rankingScore = getRankingScoreValue(ranking);
    const status = teamStatuses.get(team.key) ?? null;
    const statusRank = getStatusQualRank(status);
    const rankValue = ranking?.rank ?? statusRank;
    const matchesPlayedFallback = getStatusMatchesPlayed(status);
    const statusRecord = getStatusRecord(status);
    const record = ranking
      ? getRankingRecord(ranking, {
          wins: aggregate.wins,
          losses: aggregate.losses,
          ties: aggregate.ties,
        })
      : statusRecord ?? {
          wins: aggregate.wins,
          losses: aggregate.losses,
          ties: aggregate.ties,
        };
    const rankingSignal = rankingSignals.get(team.key) ?? null;
    const adjustedPerformance = ratings.get(team.key) ?? null;
    const cleanScoring = normalizedCleanScores.get(team.key) ?? null;
    const scoringCeiling = normalizedCeilings.get(team.key) ?? null;
    const scoringFloor = normalizedFloors.get(team.key) ?? null;
    const autonomousImpact = averageSignals([
      normalizedAutoBreakdown.get(team.key) ?? null,
      componentSignals.autoSignals.get(team.key) ?? null,
    ]);
    const endgameImpact = averageSignals([
      normalizedEndgameBreakdown.get(team.key) ?? null,
      componentSignals.endgameSignals.get(team.key) ?? null,
    ]);
    const scorePotential = averageSignals([
      normalizedAllianceScores.get(team.key) ?? null,
      normalizedOprs.get(team.key) ?? null,
      componentSignals.breadthSignals.get(team.key) ?? null,
      cleanScoring,
    ]);
    const appearancePerformances = aggregate.appearances.map(
      (appearance) => appearance.performance,
    );
    const trend = getTrendSignal(aggregate.appearances);
    const consistency = averageSignals([
      getStabilitySignal(appearancePerformances),
      scoringFloor,
    ]);
    const partnerStrength = averageSignals(
      aggregate.appearances.map((appearance) =>
        getScheduleAverage(appearance.partnerKeys, ratings),
      ),
    );
    const opponentStrength = averageSignals(
      aggregate.appearances.map((appearance) =>
        getScheduleAverage(appearance.opponentKeys, ratings),
      ),
    );
    const scheduleDifficulty =
      partnerStrength === null && opponentStrength === null
        ? null
        : clamp((opponentStrength ?? 0) - (partnerStrength ?? 0), -1, 1);
    const matchesPlayed = Math.max(
      aggregate.playedMatches,
      ranking?.matches_played ?? 0,
      matchesPlayedFallback ?? 0,
    );
    const winRate = getWinRate(record, matchesPlayed);
    const winRateSignal =
      winRate === null ? null : clamp((winRate - 0.5) * 2, -1, 1);
    const rankDelta =
      adjustedPerformance === null || rankingSignal === null
        ? null
        : clamp(adjustedPerformance - rankingSignal, -1, 1);
    const scheduleAdvantage =
      partnerStrength === null && opponentStrength === null
        ? null
        : clamp((partnerStrength ?? 0) - (opponentStrength ?? 0), -1, 1);
    const foulReliance = foulRelianceValues.get(team.key) ?? null;
    const foulPenalty =
      foulReliance === null ? 0 : clamp(foulReliance / 0.24, 0, 1);
    const inflationRisk = clamp(
      ((rankingSignal ?? 0) - (adjustedPerformance ?? 0)) * 0.56 +
        Math.max(0, scheduleAdvantage ?? 0) * 0.4 +
        ((winRateSignal ?? 0) - (adjustedPerformance ?? 0)) * 0.16 +
        foulPenalty * 0.12,
      -1,
      1,
    );
    const underseedSignal =
      rankDelta === null
        ? scheduleDifficulty
        : clamp(rankDelta + Math.max(scheduleDifficulty ?? 0, 0) * 0.24, -1, 1);
    const rankTrust =
      rankingSignal === null
        ? 0
        : clamp(
            1 - Math.max(0, inflationRisk) * 0.74 - Math.abs(rankDelta ?? 0) * 0.15,
            0.14,
            1,
          );
    const rankingTiebreaker = normalizedTiebreakers.get(team.key) ?? null;
    const districtPointSignal = normalizedDistrictPoints.get(team.key) ?? null;

    const rawSignal = clamp(
      (adjustedPerformance ?? 0) * 0.28 +
        (winRateSignal ?? 0) * 0.11 +
        (scorePotential ?? 0) * 0.1 +
        (cleanScoring ?? 0) * 0.08 +
        (scoringCeiling ?? 0) * 0.05 +
        (scoringFloor ?? 0) * 0.06 +
        (autonomousImpact ?? 0) * 0.05 +
        (endgameImpact ?? 0) * 0.05 +
        (trend ?? 0) * 0.07 +
        (consistency ?? 0) * 0.07 +
        (scheduleDifficulty ?? 0) * 0.06 +
        (rankingSignal ?? 0) * 0.04 * rankTrust +
        (rankingTiebreaker ?? 0) * 0.02 * rankTrust +
        (underseedSignal ?? 0) * 0.05 +
        (districtPointSignal ?? 0) * 0.02 -
        Math.max(0, inflationRisk) * 0.08 -
        foulPenalty * 0.05,
      -1.5,
      1.5,
    );

    rawSignals.set(team.key, rawSignal);

    const rankingCoverage =
      rankValue !== null ? Math.min(matchesPlayed / 10, 1) * 0.92 : 0;
    const matchCoverage = Math.min(matchesPlayed / 10, 1);
    const modelCoverage = input.oprs ? 0.1 : 0;
    const coprCoverage = input.coprs ? 0.08 : 0;
    const breakdownCoverage =
      aggregate.appearances.some((appearance) => appearance.breakdown.cleanScore !== null)
        ? 0.08
        : 0;
    const statusCoverage = status ? 0.04 : 0;
    const insightCoverage = input.insights ? 0.02 : 0;
    const districtCoverage = districtPointSignal !== null ? 0.02 : 0;
    const baseConfidence = clamp(
      matchCoverage * 0.5 +
        rankingCoverage * 0.16 +
        modelCoverage +
        coprCoverage +
        breakdownCoverage +
        statusCoverage +
        insightCoverage +
        districtCoverage +
        Math.min(aggregate.appearances.length / 6, 1) * 0.04,
      0,
      1,
    );

    metricsByTeam.set(team.key, {
      rawSignal,
      matchesPlayed,
      record,
      ranking: toRankingSnapshot(rankValue, matchesPlayed, rankingScore),
      rankingScore,
      rankPercentile: getRankPercentileFromRank(rankValue, rankingUniverse),
      winRate,
      trend,
      scheduleDifficulty,
      partnerStrength,
      opponentStrength,
      adjustedPerformance,
      scorePotential,
      cleanScoring,
      scoringCeiling,
      scoringFloor,
      foulReliance,
      autonomousImpact,
      endgameImpact,
      districtPointTotal:
        input.districtPoints?.points?.[team.key]?.total ?? null,
      rankingTiebreaker,
      consistency,
      rankDelta,
      inflationRisk,
      baseConfidence,
    });
  }

  const normalizedSignals = normalizeDistribution(rawSignals, 1.12);
  const results = new Map<string, QualificationMetrics>();

  for (const team of teams) {
    const metrics = metricsByTeam.get(team.key)!;
    const confidence = metrics.baseConfidence;
    const normalizedSignal =
      normalizedSignals.get(team.key) ?? metrics.adjustedPerformance ?? 0;
    const dampedSignal = normalizedSignal * (0.35 + confidence * 0.65);
    const score = roundTo(clamp(dampedSignal * 10, -10, 10), 1);

    results.set(team.key, {
      ...metrics,
      score,
      category: getCategoryForScore(score),
      confidence,
      confidenceLevel: getConfidenceLevel(confidence),
    });
  }

  return {
    qualificationMatches,
    results,
  };
}
