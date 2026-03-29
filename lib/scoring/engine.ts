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
  TbaCoprs,
  TbaDistrictPoints,
  TbaEventSimple,
  TbaEventInsights,
  TbaMatchSimple,
  TbaOprs,
  TbaRankings,
  TbaTeamSimple,
  TbaEventTeamStatuses,
} from "@/lib/server/tba";
import { buildAwardsSummary, getEventFinishedState } from "@/lib/scoring/awards";
import { classifyEventStrength } from "@/lib/scoring/event-strength";
import { getEventProgress } from "@/lib/scoring/event-progress";
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
    rankingScore: null,
    rankPercentile: null,
    winRate: null,
    trend: null,
    scheduleDifficulty: null,
    partnerStrength: null,
    opponentStrength: null,
    adjustedPerformance: null,
    scorePotential: null,
    cleanScoring: null,
    scoringCeiling: null,
    scoringFloor: null,
    foulReliance: null,
    autonomousImpact: null,
    endgameImpact: null,
    districtPointTotal: null,
    rankingTiebreaker: null,
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
  coprs: TbaCoprs | null;
  insights: TbaEventInsights | null;
  teamStatuses: TbaEventTeamStatuses | null;
  districtPoints: TbaDistrictPoints | null;
}): EventScoresResponse {
  const isPlayoffOnlyEvent = input.event.event_type === 4;
  const teams = [...input.teams].sort(
    (left, right) => left.team_number - right.team_number,
  );
  const awardMap = buildAwardMap(input.awards);
  const qualification = analyzeQualification({
    teams,
    rankings: input.rankings,
    matches: input.matches,
    oprs: input.oprs,
    coprs: input.coprs,
    insights: input.insights,
    teamStatuses: input.teamStatuses,
    districtPoints: input.districtPoints,
  });
  const playoffs = analyzePlayoffs({
    teams,
    matches: input.matches,
    alliances: input.alliances,
    teamStatuses: input.teamStatuses,
  });

  const scoredTeams = teams
    .map((team) => {
      const qualificationSnapshot =
        qualification.results.get(team.key) ?? createEmptyQualification();
      const playoffContext = playoffs.results.get(team.key) ?? null;
      const awardNames = awardMap.get(team.key) ?? [];
      const awardBonusPoints = scoreAwards(awardNames) * 1.4;
      const defaultScore = isPlayoffOnlyEvent
        ? roundTo(clamp((playoffContext?.score ?? 0) + awardBonusPoints, -10, 10), 1)
        : roundTo(
            clamp(qualificationSnapshot.score + awardBonusPoints, -10, 10),
            1,
          );
      const confidence = isPlayoffOnlyEvent
        ? clamp(
            (playoffContext?.confidence ?? 0) * 0.92 +
              (awardNames.length ? 0.08 : 0),
            0,
            1,
          )
        : qualificationSnapshot.confidence;
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
        score: defaultScore,
        category: getCategoryForScore(defaultScore),
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
    scoredTeams
      .map((team) => ({
        qualificationScore:
          isPlayoffOnlyEvent && team.playoff?.score !== null
            ? (team.playoff?.score ?? team.qualification.score)
            : team.qualification.score,
        confidence:
          isPlayoffOnlyEvent && team.playoff
            ? team.playoff.confidence
            : team.qualification.confidence,
      }))
      .filter((team) => team.confidence > 0),
    {
      isChampionshipFinals: isPlayoffOnlyEvent,
    },
  );
  const isFinished = getEventFinishedState({
    awards: input.awards,
    alliances: playoffs.alliances,
    endDate: input.event.end_date,
  });
  const awards = buildAwardsSummary({
    awards: input.awards,
    alliances: playoffs.alliances,
    teams: scoredTeams,
  });
  const progress = getEventProgress({
    event: input.event,
    playoffMatches: playoffs.playoffMatches.length,
    isFinished,
    teams: scoredTeams,
  });

  return {
    event: {
      key: input.event.key,
      name: input.event.name,
      eventType: input.event.event_type,
      isPlayoffOnly: isPlayoffOnlyEvent,
      isFinished,
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
      progress,
      fieldStrength,
    },
    awards,
    teams: scoredTeams,
  };
}
