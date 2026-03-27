import { getDictionary } from "@/lib/i18n";
import type { AnalysisTab, Locale, TeamScore } from "@/lib/types";

function pushIfRoom(items: string[], text: string | null, limit: number) {
  if (!text || items.length >= limit || items.includes(text)) {
    return;
  }

  items.push(text);
}

export function buildTeamInsights(
  team: TeamScore,
  locale: Locale,
  analysisTab: AnalysisTab,
): string[] {
  const dictionary = getDictionary(locale);
  const insights: string[] = [];
  const qualification = team.qualification;
  const playoff = team.playoff;

  if (analysisTab === "qualification" && qualification.matchesPlayed === 0) {
    pushIfRoom(insights, dictionary.insights.noQualificationData, 4);
  } else if (analysisTab === "qualification") {
    if (
      (qualification.rankPercentile ?? 0) >= 0.65 &&
      (qualification.inflationRisk ?? 0) >= 0.28
    ) {
      pushIfRoom(insights, dictionary.insights.highRankSoftSchedule, 4);
    } else if ((team.calibration.underseedSignal ?? 0) >= 0.28) {
      pushIfRoom(insights, dictionary.insights.underseededStrongMetrics, 4);
    }

    if ((qualification.consistency ?? 0) >= 0.28) {
      pushIfRoom(insights, dictionary.insights.consistentQualification, 4);
    } else if ((qualification.consistency ?? 0) >= 0.12) {
      pushIfRoom(insights, dictionary.insights.stableContribution, 4);
    } else if ((qualification.consistency ?? 0) <= -0.12) {
      pushIfRoom(insights, dictionary.insights.volatilePerformance, 4);
    }

    if ((qualification.trend ?? 0) >= 0.18) {
      pushIfRoom(insights, dictionary.insights.risingForm, 4);
    } else if ((qualification.trend ?? 0) <= -0.18) {
      pushIfRoom(insights, dictionary.insights.slippingForm, 4);
    }

    if ((qualification.scheduleDifficulty ?? 0) >= 0.18) {
      pushIfRoom(insights, dictionary.insights.toughSchedule, 4);
    } else if ((team.calibration.scheduleAdvantage ?? 0) >= 0.18) {
      pushIfRoom(insights, dictionary.insights.softSchedule, 4);
    }
  }

  if (analysisTab === "playoff" && playoff) {
    if (playoff.matchesPlayed === 0 && playoff.seed !== null) {
      pushIfRoom(insights, dictionary.insights.playoffSeedOnly, 4);
    } else if (playoff.matchesPlayed === 0) {
      pushIfRoom(insights, dictionary.insights.playoffNoMatches, 4);
    } else if (
      (playoff.score ?? 0) >= 1.8 &&
      (qualification.inflationRisk ?? 0) >= 0.25
    ) {
      pushIfRoom(insights, dictionary.insights.playoffAllianceBoost, 4);
    } else if ((playoff.score ?? 0) >= 1.8 && qualification.score >= 2) {
      pushIfRoom(insights, dictionary.insights.playoffAllianceValidated, 4);
    }
  }

  const confidenceLevel =
    analysisTab === "playoff"
      ? team.playoff?.confidenceLevel ?? team.confidenceLevel
      : team.qualification.confidenceLevel;

  if (confidenceLevel === "low") {
    pushIfRoom(insights, dictionary.insights.lowConfidence, 4);
  } else if (confidenceLevel === "medium") {
    pushIfRoom(insights, dictionary.insights.mediumConfidence, 4);
  }

  if (!insights.length) {
    insights.push(dictionary.insights.neutral);
  }

  return insights.slice(0, 4);
}
