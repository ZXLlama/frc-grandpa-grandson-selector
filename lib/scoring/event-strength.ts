import { clamp, getCategoryForScore, roundTo } from "@/lib/constants";
import type {
  EventFieldStrength,
  EventStrengthProfile,
} from "@/lib/types";
import { mean, median } from "@/lib/scoring/math";

function getProfile(input: {
  topAverage: number;
  depthAverage: number;
  fieldScore: number;
  confidence: number;
  teamCount: number;
}): EventStrengthProfile {
  const { topAverage, depthAverage, fieldScore, confidence, teamCount } = input;

  if (confidence < 0.35 || teamCount < 6) {
    return "limitedData";
  }

  if (topAverage >= 6.5 && depthAverage >= 2.25) {
    return "eliteDepth";
  }

  if (topAverage >= 6 && depthAverage < 0.8) {
    return "topHeavy";
  }

  if (fieldScore <= -2.2) {
    return "softField";
  }

  return "balancedDepth";
}

export function classifyEventStrength(
  teams: Array<{ qualificationScore: number; confidence: number }>,
): EventFieldStrength {
  if (!teams.length) {
    return {
      score: 0,
      category: "peer",
      confidence: 0,
      profile: "limitedData",
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
  const topCount = Math.min(Math.max(Math.round(teamCount * 0.16), 3), 6);
  const upperCount = Math.min(Math.max(Math.round(teamCount * 0.42), 5), teamCount);
  const depthStart = Math.min(Math.floor(teamCount * 0.3), Math.max(teamCount - 2, 0));
  const depthEnd = Math.max(depthStart + 1, Math.ceil(teamCount * 0.7));
  const topAverage = mean(qualificationScores.slice(0, topCount));
  const upperAverage = mean(qualificationScores.slice(0, upperCount));
  const depthAverage = mean(qualificationScores.slice(depthStart, depthEnd));
  const medianValue = median(qualificationScores);
  const topHeavyPenalty = Math.max(0, topAverage - depthAverage - 4.8) * 0.34;
  const fieldScore = clamp(
    topAverage * 0.22 +
      upperAverage * 0.4 +
      depthAverage * 0.28 +
      medianValue * 0.1 -
      topHeavyPenalty,
    -10,
    10,
  );

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
    }),
    topAverage: roundTo(topAverage, 1),
    depthAverage: roundTo(depthAverage, 1),
    median: roundTo(medianValue, 1),
  };
}
