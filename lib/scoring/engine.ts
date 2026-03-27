import {
  clamp,
  getCategoryForScore,
  getConfidenceLevel,
  roundTo,
} from "@/lib/constants";
import type {
  EventScoresResponse,
  QualificationSnapshot,
  TeamScore,
} from "@/lib/types";
import type {
  TbaAlliance,
  TbaAward,
  TbaEventSimple,
  TbaMatchSimple,
  TbaOprs,
  TbaRankings,
  TbaTeamSimple,
} from "@/lib/server/tba";
import { classifyEventStrength } from "@/lib/scoring/event-strength";
import { analyzePlayoffs } from "@/lib/scoring/playoffs";
import { analyzeQualification } from "@/lib/scoring/qualification";
import {
  buildAwardMap,
  resolveTeamName,
  scoreAwards,
} from "@/lib/scoring/shared";

function createEmptyQualification(): QualificationSnapshot {
  return {
    score: 0,
    category: "peer",
    confidence: 0,
    confidenceLevel: "low",
    matchesPlayed: 0,
    record: { wins: 0, losses: 0, ties: 0 },
    ranking: null,
    rankPercentile: null,
    winRate: null,
    trend: null,
    scheduleDifficulty: null,
    partnerStrength: null,
    opponentStrength: null,
    adjustedPerformance: null,
    scorePotential: null,
    consistency: null,
    rankDelta: null,
    inflationRisk: null,
  };
}

export function computeEventScores(input: {
  event: TbaEventSimple;
  teams: TbaTeamSimple[];
  rankings: TbaRankings;
  matches: TbaMatchSimple[];
  awards: TbaAward[];
  alliances: TbaAlliance[] | null;
  oprs: TbaOprs | null;
}): EventScoresResponse {
  const teams = [...input.teams].sort(
    (left, right) => left.team_number - right.team_number,
  );
  const awardMap = buildAwardMap(input.awards);
  const qualification = analyzeQualification({
    teams,
    rankings: input.rankings,
    matches: input.matches,
    oprs: input.oprs,
  });
  const playoffs = analyzePlayoffs({
    teams,
    matches: input.matches,
    alliances: input.alliances,
  });

  const scoredTeams = teams
    .map((team) => {
      const qualificationSnapshot =
        qualification.results.get(team.key) ?? createEmptyQualification();
      const playoffContext = playoffs.results.get(team.key) ?? null;
      const awardNames = awardMap.get(team.key) ?? [];
      const awardBonusPoints = scoreAwards(awardNames) * 1.4;
      const playoffWeight = playoffContext
        ? clamp(
            0.12 +
              playoffContext.confidence * 0.14 +
              Math.min(playoffContext.matchesPlayed / 5, 1) * 0.06,
            0.12,
            0.3,
          )
        : 0;
      const overallScore = roundTo(
        clamp(
          qualificationSnapshot.score * (1 - playoffWeight) +
            (playoffContext?.score ?? 0) * playoffWeight +
            awardBonusPoints,
          -10,
          10,
        ),
        1,
      );
      const confidence = clamp(
        qualificationSnapshot.confidence * 0.8 +
          (playoffContext ? playoffContext.confidence * 0.16 : 0) +
          (awardNames.length ? 0.04 : 0),
        0,
        1,
      );
      const scheduleAdvantage =
        qualificationSnapshot.partnerStrength === null &&
        qualificationSnapshot.opponentStrength === null
          ? null
          : clamp(
              (qualificationSnapshot.partnerStrength ?? 0) -
                (qualificationSnapshot.opponentStrength ?? 0),
              -1,
              1,
            );
      const underseedSignal =
        qualificationSnapshot.rankDelta === null
          ? qualificationSnapshot.scheduleDifficulty
          : clamp(
              qualificationSnapshot.rankDelta +
                Math.max(qualificationSnapshot.scheduleDifficulty ?? 0, 0) * 0.22,
              -1,
              1,
            );

      return {
        teamKey: team.key,
        teamNumber: team.team_number,
        teamName: resolveTeamName(team),
        score: overallScore,
        category: getCategoryForScore(overallScore),
        confidence,
        confidenceLevel: getConfidenceLevel(confidence),
        record: qualificationSnapshot.record,
        ranking: qualificationSnapshot.ranking,
        qualification: qualificationSnapshot,
        playoff: playoffContext,
        calibration: {
          scheduleAdvantage,
          rankDiscrepancy: qualificationSnapshot.rankDelta,
          inflationRisk: qualificationSnapshot.inflationRisk,
          underseedSignal,
        },
        awards: awardNames,
      } satisfies TeamScore;
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
  const fieldStrength = classifyEventStrength(
    scoredTeams.map((team) => ({
      qualificationScore: team.qualification.score,
      confidence: team.qualification.confidence,
    })),
  );

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
      completedMatches:
        qualification.qualificationMatches.length + playoffs.playoffMatches.length,
      qualificationMatches: qualification.qualificationMatches.length,
      playoffMatches: playoffs.playoffMatches.length,
      analyzedAt: new Date().toISOString(),
      fieldStrength,
    },
    teams: scoredTeams,
  };
}
