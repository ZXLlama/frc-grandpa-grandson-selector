import {
  SCORE_WEIGHTS,
  clamp,
  getCategoryForScore,
  roundTo,
} from "@/lib/constants";
import type {
  EventScoresResponse,
  ScoreBreakdown,
  ScoreMetricKey,
  TeamRecord,
} from "@/lib/types";
import type {
  TbaAward,
  TbaEventSimple,
  TbaMatchSimple,
  TbaRankingEntry,
  TbaRankings,
  TbaTeamSimple,
} from "@/lib/server/tba";

type MetricInput = {
  raw: number | null;
  confidence: number;
};

type TeamAggregate = {
  team: TbaTeamSimple;
  playedMatches: number;
  wins: number;
  losses: number;
  ties: number;
  allianceScores: number[];
  matchEntries: Array<{
    order: number;
    ownScore: number;
    opponentScore: number;
  }>;
  opponentKeys: string[];
  playoffMatches: number;
  playoffWins: number;
};

type MetricMap = Record<ScoreMetricKey, MetricInput>;

const COMP_LEVEL_ORDER: Record<string, number> = {
  qm: 1,
  ef: 2,
  qf: 3,
  sf: 4,
  f: 5,
};

function mean(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }

  const average = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    values.length;

  return Math.sqrt(variance);
}

function normalizeDistribution(
  values: Map<string, number | null>,
  divisor = 1.6,
): Map<string, number | null> {
  const numericValues = [...values.values()].filter(
    (value): value is number => typeof value === "number",
  );
  const normalized = new Map<string, number | null>();

  if (!numericValues.length) {
    for (const key of values.keys()) {
      normalized.set(key, null);
    }

    return normalized;
  }

  const average = mean(numericValues);
  const deviation = standardDeviation(numericValues);

  for (const [key, value] of values.entries()) {
    if (value === null) {
      normalized.set(key, null);
      continue;
    }

    if (deviation < 0.0001) {
      normalized.set(key, 0);
      continue;
    }

    normalized.set(key, clamp((value - average) / (deviation * divisor), -1, 1));
  }

  return normalized;
}

function isPlayedMatch(match: TbaMatchSimple): boolean {
  return (
    match.alliances.red.score >= 0 &&
    match.alliances.blue.score >= 0 &&
    match.alliances.red.team_keys.length > 0 &&
    match.alliances.blue.team_keys.length > 0
  );
}

function getMatchOrder(match: TbaMatchSimple): number {
  const timestamp =
    match.actual_time ?? match.predicted_time ?? match.time ?? 0;

  return (
    timestamp * 100_000 +
    (COMP_LEVEL_ORDER[match.comp_level] ?? 9) * 10_000 +
    match.set_number * 100 +
    match.match_number
  );
}

function resolveTeamName(team: TbaTeamSimple): string {
  return team.nickname?.trim() || team.name?.trim() || `Team ${team.team_number}`;
}

function buildAwardMap(awards: TbaAward[]): Map<string, string[]> {
  const awardsByTeam = new Map<string, string[]>();

  for (const award of awards) {
    for (const recipient of award.recipient_list) {
      if (!recipient.team_key) {
        continue;
      }

      const teamAwards = awardsByTeam.get(recipient.team_key) ?? [];
      teamAwards.push(award.name);
      awardsByTeam.set(recipient.team_key, teamAwards);
    }
  }

  return awardsByTeam;
}

function scoreAwards(awards: string[]): number {
  if (!awards.length) {
    return 0;
  }

  const total = awards.reduce((sum, awardName) => {
    const normalized = awardName.toLowerCase();

    if (
      normalized.includes("winner") ||
      normalized.includes("impact") ||
      normalized.includes("chairman") ||
      normalized.includes("engineering inspiration")
    ) {
      return sum + 0.4;
    }

    if (
      normalized.includes("finalist") ||
      normalized.includes("rookie all star") ||
      normalized.includes("industrial design") ||
      normalized.includes("quality")
    ) {
      return sum + 0.24;
    }

    return sum + 0.16;
  }, 0);

  return clamp(total, 0, 0.75);
}

function getRankingRecord(
  ranking: TbaRankingEntry | null,
  aggregate: TeamAggregate,
): TeamRecord {
  return {
    wins: ranking?.record?.wins ?? aggregate.wins,
    losses: ranking?.record?.losses ?? aggregate.losses,
    ties: ranking?.record?.ties ?? aggregate.ties,
  };
}

function combineMetrics(metrics: MetricMap): {
  breakdown: ScoreBreakdown[];
  signal: number;
  coverage: number;
} {
  let weightedSum = 0;
  let effectiveWeightTotal = 0;

  const breakdown = (Object.keys(SCORE_WEIGHTS) as ScoreMetricKey[]).map(
    (key) => {
      const metric = metrics[key];
      const boundedConfidence = clamp(metric.confidence, 0, 1);
      const available = metric.raw !== null && boundedConfidence > 0;
      const effectiveWeight = available
        ? SCORE_WEIGHTS[key] * boundedConfidence
        : 0;
      const contribution = available ? (metric.raw ?? 0) * effectiveWeight : 0;

      weightedSum += contribution;
      effectiveWeightTotal += effectiveWeight;

      return {
        key,
        raw: metric.raw,
        confidence: boundedConfidence,
        effectiveWeight,
        contribution,
        available,
      } satisfies ScoreBreakdown;
    },
  );

  return {
    breakdown,
    signal: effectiveWeightTotal > 0 ? weightedSum / effectiveWeightTotal : 0,
    coverage: effectiveWeightTotal,
  };
}

export function computeEventScores(input: {
  event: TbaEventSimple;
  teams: TbaTeamSimple[];
  rankings: TbaRankings;
  matches: TbaMatchSimple[];
  awards: TbaAward[];
}): EventScoresResponse {
  const teams = [...input.teams].sort(
    (left, right) => left.team_number - right.team_number,
  );
  const teamSet = new Set(teams.map((team) => team.key));
  const rankings = input.rankings?.rankings ?? [];
  const rankingCount = rankings.length;
  const rankingMap = new Map(rankings.map((ranking) => [ranking.team_key, ranking]));
  const awardMap = buildAwardMap(input.awards);
  const playedMatches = input.matches
    .filter(isPlayedMatch)
    .sort((left, right) => getMatchOrder(left) - getMatchOrder(right));

  const aggregates = new Map<string, TeamAggregate>();

  for (const team of teams) {
    aggregates.set(team.key, {
      team,
      playedMatches: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      allianceScores: [],
      matchEntries: [],
      opponentKeys: [],
      playoffMatches: 0,
      playoffWins: 0,
    });
  }

  for (const match of playedMatches) {
    const order = getMatchOrder(match);
    const processAlliance = (
      ownAlliance: TbaMatchSimple["alliances"]["red"],
      opponentAlliance: TbaMatchSimple["alliances"]["blue"],
      isPlayoff: boolean,
    ) => {
      const ownScore = ownAlliance.score;
      const opponentScore = opponentAlliance.score;
      const didWin = ownScore > opponentScore;
      const didLose = ownScore < opponentScore;

      for (const teamKey of ownAlliance.team_keys) {
        const aggregate = aggregates.get(teamKey);

        if (!aggregate) {
          continue;
        }

        aggregate.playedMatches += 1;
        aggregate.allianceScores.push(ownScore);
        aggregate.matchEntries.push({
          order,
          ownScore,
          opponentScore,
        });
        aggregate.opponentKeys.push(
          ...opponentAlliance.team_keys.filter((opponentKey) =>
            teamSet.has(opponentKey),
          ),
        );

        if (didWin) {
          aggregate.wins += 1;
        } else if (didLose) {
          aggregate.losses += 1;
        } else {
          aggregate.ties += 1;
        }

        if (isPlayoff) {
          aggregate.playoffMatches += 1;

          if (didWin) {
            aggregate.playoffWins += 1;
          }
        }
      }
    };

    const isPlayoff = match.comp_level !== "qm";
    processAlliance(match.alliances.red, match.alliances.blue, isPlayoff);
    processAlliance(match.alliances.blue, match.alliances.red, isPlayoff);
  }

  const eventAllianceScores = playedMatches.flatMap((match) => [
    match.alliances.red.score,
    match.alliances.blue.score,
  ]);
  const scoreDeviation =
    standardDeviation(eventAllianceScores) ||
    Math.max(mean(eventAllianceScores) * 0.18, 16);

  const allianceScoreValues = new Map<string, number | null>();
  const metricsByTeam = new Map<string, MetricMap>();

  for (const team of teams) {
    const aggregate = aggregates.get(team.key)!;
    allianceScoreValues.set(
      team.key,
      aggregate.allianceScores.length ? mean(aggregate.allianceScores) : null,
    );
  }

  const normalizedAllianceScores = normalizeDistribution(allianceScoreValues, 1.55);
  const eventHasBonusData =
    input.awards.length > 0 || playedMatches.some((match) => match.comp_level !== "qm");

  for (const team of teams) {
    const aggregate = aggregates.get(team.key)!;
    const ranking = rankingMap.get(team.key) ?? null;
    const played = aggregate.playedMatches;
    const rankingRaw =
      ranking && rankingCount > 1
        ? clamp((1 - (ranking.rank - 1) / (rankingCount - 1)) * 2 - 1, -1, 1)
        : ranking && rankingCount === 1
          ? 0
          : null;
    const rankingConfidence = ranking
      ? clamp((ranking.matches_played ?? played) / 8, 0, 1)
      : 0;

    const winRateRaw =
      played > 0
        ? clamp(((aggregate.wins + aggregate.ties * 0.5) / played - 0.5) * 2, -1, 1)
        : null;
    const winRateConfidence = clamp(played / 8, 0, 1);

    const recentMatches = [...aggregate.matchEntries]
      .sort((left, right) => left.order - right.order)
      .slice(-5);

    const trendRaw =
      recentMatches.length > 0
        ? clamp(
            recentMatches.reduce((sum, matchEntry, index) => {
              const weight = index + 1;
              const outcome =
                matchEntry.ownScore > matchEntry.opponentScore
                  ? 1
                  : matchEntry.ownScore < matchEntry.opponentScore
                    ? -1
                    : 0;
              const marginScore = clamp(
                (matchEntry.ownScore - matchEntry.opponentScore) /
                  Math.max(scoreDeviation * 1.6, 20),
                -1,
                1,
              );

              return sum + (outcome * 0.7 + marginScore * 0.3) * weight;
            }, 0) /
              recentMatches.reduce((sum, _match, index) => sum + index + 1, 0),
            -1,
            1,
          )
        : null;
    const trendConfidence = clamp(recentMatches.length / 5, 0, 1);

    const awardNames = awardMap.get(team.key) ?? [];
    const playoffBonus =
      aggregate.playoffMatches > 0
        ? Math.min(
            0.45,
            0.18 +
              aggregate.playoffWins * 0.11 +
              Math.max(aggregate.playoffMatches - aggregate.playoffWins, 0) * 0.04,
          )
        : 0;
    const bonusRaw = eventHasBonusData
      ? clamp(scoreAwards(awardNames) + playoffBonus, 0, 1)
      : null;
    const bonusConfidence = eventHasBonusData ? 1 : 0;

    metricsByTeam.set(team.key, {
      ranking: { raw: rankingRaw, confidence: rankingConfidence },
      winRate: { raw: winRateRaw, confidence: winRateConfidence },
      trend: { raw: trendRaw, confidence: trendConfidence },
      allianceScore: {
        raw: normalizedAllianceScores.get(team.key) ?? null,
        confidence: clamp(played / 6, 0, 1),
      },
      scheduleStrength: { raw: null, confidence: 0 },
      bonus: { raw: bonusRaw, confidence: bonusConfidence },
    });
  }

  const provisionalStrength = new Map<string, number>();

  for (const team of teams) {
    const metrics = metricsByTeam.get(team.key)!;
    const partialMetrics: MetricMap = {
      ranking: metrics.ranking,
      winRate: metrics.winRate,
      trend: metrics.trend,
      allianceScore: metrics.allianceScore,
      scheduleStrength: { raw: null, confidence: 0 },
      bonus: { raw: null, confidence: 0 },
    };
    const combined = combineMetrics(partialMetrics);
    provisionalStrength.set(team.key, combined.signal);
  }

  const scheduleValues = new Map<string, number | null>();

  for (const team of teams) {
    const aggregate = aggregates.get(team.key)!;
    const opponentStrengths = aggregate.opponentKeys
      .map((opponentKey) => provisionalStrength.get(opponentKey))
      .filter((value): value is number => typeof value === "number");

    scheduleValues.set(
      team.key,
      opponentStrengths.length ? mean(opponentStrengths) : null,
    );
  }

  const normalizedSchedules = normalizeDistribution(scheduleValues, 1.45);

  const scoredTeams = teams
    .map((team) => {
      const aggregate = aggregates.get(team.key)!;
      const ranking = rankingMap.get(team.key) ?? null;
      const metrics = metricsByTeam.get(team.key)!;

      metrics.scheduleStrength = {
        raw: normalizedSchedules.get(team.key) ?? null,
        confidence:
          aggregate.opponentKeys.length > 0
            ? clamp(aggregate.playedMatches / 8, 0, 1)
            : 0,
      };

      const combined = combineMetrics(metrics);
      const dampedSignal = combined.signal * (0.35 + combined.coverage * 0.65);
      const score = roundTo(clamp(dampedSignal * 10, -10, 10), 1);

      return {
        teamKey: team.key,
        teamNumber: team.team_number,
        teamName: resolveTeamName(team),
        score,
        category: getCategoryForScore(score),
        confidence: clamp(combined.coverage, 0, 1),
        sampleSize: aggregate.playedMatches,
        breakdown: combined.breakdown,
        record: getRankingRecord(ranking, aggregate),
        ranking: ranking
          ? {
              rank: ranking.rank,
              matchesPlayed: ranking.matches_played,
            }
          : null,
        awards: awardMap.get(team.key) ?? [],
        playoffMatches: aggregate.playoffMatches,
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.teamNumber - right.teamNumber;
    });

  const location = [input.event.city, input.event.state_prov, input.event.country]
    .filter(Boolean)
    .join(", ");

  return {
    event: {
      key: input.event.key,
      name: input.event.name,
      eventType: input.event.event_type,
      districtDisplay:
        input.event.district?.display_name ??
        input.event.district?.abbreviation ??
        null,
      location: location || null,
      startDate: input.event.start_date ?? null,
      endDate: input.event.end_date ?? null,
      year: input.event.year,
      teamCount: teams.length,
      completedMatches: playedMatches.length,
      analyzedAt: new Date().toISOString(),
    },
    teams: scoredTeams,
  };
}
