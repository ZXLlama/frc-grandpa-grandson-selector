import {
  clamp,
  getCategoryForScore,
  getConfidenceLevel,
  roundTo,
} from "@/lib/constants";
import type {
  QualificationSnapshot,
  RankingSnapshot,
} from "@/lib/types";
import type {
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

type QualificationAppearance = {
  order: number;
  ownScore: number;
  opponentScore: number;
  performance: number;
  partnerKeys: string[];
  opponentKeys: string[];
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

function getRankingSignal(
  ranking: TbaRankingEntry | null,
  rankingCount: number,
): number | null {
  if (!ranking) {
    return null;
  }

  if (rankingCount <= 1) {
    return 0;
  }

  return clamp((1 - (ranking.rank - 1) / (rankingCount - 1)) * 2 - 1, -1, 1);
}

function getRankPercentile(
  ranking: TbaRankingEntry | null,
  rankingCount: number,
): number | null {
  if (!ranking || rankingCount <= 1) {
    return null;
  }

  return clamp(1 - (ranking.rank - 1) / (rankingCount - 1), 0, 1);
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
  ranking: TbaRankingEntry | null,
): RankingSnapshot | null {
  if (!ranking) {
    return null;
  }

  return {
    rank: ranking.rank,
    matchesPlayed: ranking.matches_played,
  };
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

export function analyzeQualification(input: {
  teams: TbaTeamSimple[];
  rankings: TbaRankings;
  matches: TbaMatchSimple[];
  oprs: TbaOprs | null;
}): {
  qualificationMatches: TbaMatchSimple[];
  results: Map<string, QualificationMetrics>;
} {
  const teams = [...input.teams].sort(
    (left, right) => left.team_number - right.team_number,
  );
  const teamSet = new Set(teams.map((team) => team.key));
  const rankings = input.rankings?.rankings ?? [];
  const rankingCount = rankings.length;
  const rankingMap = new Map(rankings.map((ranking) => [ranking.team_key, ranking]));
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
      ownAlliance: TbaMatchSimple["alliances"]["red"],
      opponentAlliance: TbaMatchSimple["alliances"]["blue"],
    ) => {
      const ownScore = ownAlliance.score;
      const opponentScore = opponentAlliance.score;
      const margin = ownScore - opponentScore;
      const didWin = margin > 0;
      const didLose = margin < 0;

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
        });
      }
    };

    processAlliance(match.alliances.red, match.alliances.blue);
    processAlliance(match.alliances.blue, match.alliances.red);
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
        marginSignal * 0.56 + scoreSignal * 0.24 + outcomeSignal * 0.2,
        -1,
        1,
      );
    }
  }

  const oprValues = new Map<string, number | null>();
  const ccwmValues = new Map<string, number | null>();
  const allianceScoreValues = new Map<string, number | null>();
  const rankingSignals = new Map<string, number | null>();

  for (const team of teams) {
    const aggregate = aggregates.get(team.key)!;
    const ranking = rankingMap.get(team.key) ?? null;

    oprValues.set(team.key, input.oprs?.oprs?.[team.key] ?? null);
    ccwmValues.set(team.key, input.oprs?.ccwms?.[team.key] ?? null);
    allianceScoreValues.set(
      team.key,
      aggregate.ownScores.length ? mean(aggregate.ownScores) : null,
    );
    rankingSignals.set(team.key, getRankingSignal(ranking, rankingCount));
  }

  const normalizedOprs = normalizeDistribution(oprValues, 1.75);
  const normalizedCcwms = normalizeDistribution(ccwmValues, 1.65);
  const normalizedAllianceScores = normalizeDistribution(allianceScoreValues, 1.6);

  let ratings = new Map<string, number>();

  for (const team of teams) {
    const initial = averageSignals([
      normalizedCcwms.get(team.key) ?? null,
      normalizedOprs.get(team.key) ?? null,
      rankingSignals.get(team.key) ?? null,
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
          appearance.performance - partnerAverage * 0.34 + opponentAverage * 0.26,
          -1.4,
          1.4,
        );
      });

      nextValues.set(
        team.key,
        clamp(mean(adjustedAppearances) * 0.76 + baseSignal * 0.24, -1.4, 1.4),
      );
    }

    const normalized = normalizeDistribution(nextValues, 1.2);
    ratings = new Map(
      [...normalized.entries()].map(([teamKey, value]) => [teamKey, value ?? 0]),
    );
  }

  const rawSignals = new Map<string, number | null>();
  const metricsByTeam = new Map<string, Omit<QualificationMetrics, "score" | "category" | "confidence" | "confidenceLevel"> & {
    baseConfidence: number;
  }>();

  for (const team of teams) {
    const aggregate = aggregates.get(team.key)!;
    const ranking = rankingMap.get(team.key) ?? null;
    const record = getRankingRecord(ranking, {
      wins: aggregate.wins,
      losses: aggregate.losses,
      ties: aggregate.ties,
    });
    const rankingSignal = rankingSignals.get(team.key) ?? null;
    const adjustedPerformance = ratings.get(team.key) ?? null;
    const scorePotential = averageSignals([
      normalizedAllianceScores.get(team.key) ?? null,
      normalizedOprs.get(team.key) ?? null,
    ]);
    const appearancePerformances = aggregate.appearances.map(
      (appearance) => appearance.performance,
    );
    const trend = getTrendSignal(aggregate.appearances);
    const consistency = getStabilitySignal(appearancePerformances);
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
    const winRate = getWinRate(record, ranking?.matches_played ?? aggregate.playedMatches);
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
    const inflationRisk = clamp(
      ((rankingSignal ?? 0) - (adjustedPerformance ?? 0)) * 0.62 +
        Math.max(0, scheduleAdvantage ?? 0) * 0.44 +
        ((winRateSignal ?? 0) - (adjustedPerformance ?? 0)) * 0.18,
      -1,
      1,
    );
    const underseedSignal =
      rankDelta === null
        ? scheduleDifficulty
        : clamp(rankDelta + Math.max(scheduleDifficulty ?? 0, 0) * 0.22, -1, 1);
    const rankTrust =
      rankingSignal === null
        ? 0
        : clamp(
            1 - Math.max(0, inflationRisk) * 0.78 - Math.abs(rankDelta ?? 0) * 0.16,
            0.14,
            1,
          );

    const rawSignal = clamp(
      (adjustedPerformance ?? 0) * 0.42 +
        (winRateSignal ?? 0) * 0.15 +
        (scorePotential ?? 0) * 0.12 +
        (trend ?? 0) * 0.1 +
        (consistency ?? 0) * 0.08 +
        (scheduleDifficulty ?? 0) * 0.07 +
        (rankingSignal ?? 0) * 0.06 * rankTrust +
        (underseedSignal ?? 0) * 0.06 -
        Math.max(0, inflationRisk) * 0.08,
      -1.4,
      1.4,
    );

    rawSignals.set(team.key, rawSignal);

    const matchesPlayed = Math.max(aggregate.playedMatches, ranking?.matches_played ?? 0);
    const rankingCoverage = ranking ? Math.min(ranking.matches_played / 10, 1) : 0;
    const matchCoverage = Math.min(matchesPlayed / 10, 1);
    const modelCoverage = input.oprs ? 0.12 : 0;
    const baseConfidence = clamp(
      matchCoverage * 0.62 +
        rankingCoverage * 0.2 +
        modelCoverage +
        Math.min(aggregate.appearances.length / 6, 1) * 0.06,
      0,
      1,
    );

    metricsByTeam.set(team.key, {
      rawSignal,
      matchesPlayed,
      record,
      ranking: toRankingSnapshot(ranking),
      rankPercentile: getRankPercentile(ranking, rankingCount),
      winRate,
      trend,
      scheduleDifficulty,
      partnerStrength,
      opponentStrength,
      adjustedPerformance,
      scorePotential,
      consistency,
      rankDelta,
      inflationRisk,
      baseConfidence,
    });
  }

  const normalizedSignals = normalizeDistribution(rawSignals, 1.15);
  const results = new Map<string, QualificationMetrics>();

  for (const team of teams) {
    const metrics = metricsByTeam.get(team.key)!;
    const confidence = metrics.baseConfidence;
    const normalizedSignal = normalizedSignals.get(team.key) ?? metrics.adjustedPerformance ?? 0;
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
