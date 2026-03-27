import { clamp, getCategoryForScore, roundTo } from "@/lib/constants";
import type {
  EventFieldStrength,
  EventStrengthProfile,
  ScoreCategory,
} from "@/lib/types";
import { mean, median } from "@/lib/scoring/math";

function getProfile(input: {
  topAverage: number;
  depthAverage: number;
  fieldScore: number;
  confidence: number;
  teamCount: number;
  isChampionshipFinals: boolean;
}): EventStrengthProfile {
  const {
    topAverage,
    depthAverage,
    fieldScore,
    confidence,
    teamCount,
    isChampionshipFinals,
  } = input;

  if (isChampionshipFinals) {
    return "championshipFinals";
  }

  if (confidence < 0.35 || teamCount < 6) {
    return "limitedData";
  }

  if (topAverage >= 7.2 && depthAverage >= 3.2) {
    return "eliteDepth";
  }

  if (topAverage >= 6.5 && depthAverage < 1) {
    return "topHeavy";
  }

  if (fieldScore <= -2.8) {
    return "softField";
  }

  return "balancedDepth";
}

export function classifyEventStrength(
  teams: Array<{ qualificationScore: number; confidence: number }>,
  input?: { isChampionshipFinals?: boolean },
): EventFieldStrength {
  const isChampionshipFinals = input?.isChampionshipFinals ?? false;
  const emptyDistribution: Record<ScoreCategory, number> = {
    grandpa: 0,
    father: 0,
    peer: 0,
    son: 0,
    grandson: 0,
  };

  if (!teams.length) {
    return {
      score: 0,
      category: isChampionshipFinals ? "grandpa" : "peer",
      confidence: 0,
      profile: isChampionshipFinals ? "championshipFinals" : "limitedData",
      distribution: emptyDistribution,
      topAverage: null,
      depthAverage: null,
      median: null,
    };
  }

  const qualificationScores = teams
    .map((team) => team.qualificationScore)
    .sort((left, right) => right - left);
  const teamCount = qualificationScores.length;
  const confidence = clamp(mean(teams.map((team) => team.confidence)), 0, 1);
  const topCount = Math.min(Math.max(Math.round(teamCount * 0.18), 3), 8);
  const upperCount = Math.min(Math.max(Math.round(teamCount * 0.38), 5), teamCount);
  const depthStart = Math.min(Math.floor(teamCount * 0.3), Math.max(teamCount - 2, 0));
  const depthEnd = Math.max(depthStart + 1, Math.ceil(teamCount * 0.7));
  const lowerHalfStart = Math.floor(teamCount * 0.5);
  const topAverage = mean(qualificationScores.slice(0, topCount));
  const upperAverage = mean(qualificationScores.slice(0, upperCount));
  const depthAverage = mean(qualificationScores.slice(depthStart, depthEnd));
  const lowerHalfAverage = mean(qualificationScores.slice(lowerHalfStart));
  const medianValue = median(qualificationScores);
  const distribution = qualificationScores.reduce<Record<ScoreCategory, number>>(
    (bucket, score) => {
      const category = getCategoryForScore(score);
      bucket[category] += 1 / teamCount;
      return bucket;
    },
    { ...emptyDistribution },
  );
  const topHeavyPenalty = Math.max(0, topAverage - depthAverage - 4) * 0.6;
  const weakFloorPenalty = Math.max(0, 0.4 - lowerHalfAverage) * 0.55;
  const rawFieldScore =
    topAverage * 0.34 +
    upperAverage * 0.26 +
    depthAverage * 0.2 +
    medianValue * 0.12 +
    lowerHalfAverage * 0.08 -
    topHeavyPenalty -
    weakFloorPenalty;
  const fieldScore = isChampionshipFinals
    ? clamp(Math.max(rawFieldScore, 8.9), 8.9, 10)
    : clamp(rawFieldScore, -10, 10);

  return {
    score: roundTo(fieldScore, 1),
    category: getCategoryForScore(fieldScore),
    confidence: roundTo(confidence, 2),
    profile: getProfile({
      topAverage,
      depthAverage,
      fieldScore,
      confidence,
      teamCount,
      isChampionshipFinals,
    }),
    distribution: {
      grandpa: roundTo(distribution.grandpa, 3),
      father: roundTo(distribution.father, 3),
      peer: roundTo(distribution.peer, 3),
      son: roundTo(distribution.son, 3),
      grandson: roundTo(distribution.grandson, 3),
    },
    topAverage: roundTo(topAverage, 1),
    depthAverage: roundTo(depthAverage, 1),
    median: roundTo(medianValue, 1),
  };
}
