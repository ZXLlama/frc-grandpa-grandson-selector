import type { AnalysisTab, Locale, TeamScore } from "@/lib/types";

import {
  formatConfidence,
  formatRecord,
  getPlayoffPositionText,
} from "@/lib/presenters";

function getZhQualificationInsights(
  team: TeamScore,
  isEventFinished: boolean,
): string[] {
  const qualification = team.qualification;
  const rank = team.ranking?.rank ?? null;

  if (qualification.matchesPlayed <= 2) {
    return [
      rank !== null
        ? `排名第 ${rank}，但樣本還太薄。`
        : `目前只有 ${formatRecord(qualification.record)}，資料還不夠厚。`,
      "現在更像早期觀察，還不像定論。",
      `可信度 ${formatConfidence(qualification.confidence)}。`,
    ];
  }

  const line1 =
    rank !== null && (qualification.inflationRisk ?? 0) >= 0.32
      ? `排名第 ${rank}，但名次比內容好看。`
      : rank !== null && (team.calibration.underseedSignal ?? 0) >= 0.28
        ? `排名第 ${rank}，但內容比名次更硬。`
        : rank !== null
          ? `排名第 ${rank}，戰績 ${formatRecord(qualification.record)}。`
          : `戰績 ${formatRecord(qualification.record)}，但排名快照不完整。`;

  const line2 =
    (qualification.scheduleDifficulty ?? 0) >= 0.24 &&
    (qualification.opponentStrength ?? 0) >= 0.14
      ? "對手偏強，這份成績含金量更高。"
      : (team.calibration.scheduleAdvantage ?? 0) >= 0.25 &&
          (qualification.partnerStrength ?? 0) >= 0.12
        ? "隊友偏硬、對手偏軟，戰績有吃賽程紅利。"
        : (qualification.partnerStrength ?? 0) >= 0.22
          ? "隊友加成偏多，不能全算單扛。"
          : (qualification.opponentStrength ?? 0) >= 0.2
            ? "對手不弱，表面名次稍微低估了內容。"
            : "賽程強度大致正常。";

  const line3 =
    (qualification.foulReliance ?? 0) >= 0.22
      ? "分數有一段靠對手犯規送進來。"
      : (qualification.cleanScoring ?? 0) >= 0.3 &&
          (qualification.autonomousImpact ?? 0) >= 0.22 &&
          (qualification.endgameImpact ?? 0) >= 0.22
        ? "乾淨得分夠，開局和收尾也都有價值。"
        : (qualification.cleanScoring ?? 0) <= -0.25
          ? "乾淨得分偏弱，表面成績要打折。"
          : qualification.scoringCeiling !== null &&
              qualification.scoringFloor !== null &&
              qualification.scoringCeiling - qualification.scoringFloor >= 0.55
            ? "上限高，但上下限差很大。"
            : (qualification.scoringFloor ?? 0) >= 0.24
              ? "下限守得住，整體偏穩。"
              : "得分輪廓中性，沒有明顯偏科。";

  const line4 =
    isEventFinished && (qualification.trend ?? 0) >= 0.22
      ? "後段內容比前段更好。"
      : isEventFinished && (qualification.trend ?? 0) <= -0.22
        ? "後段有掉速，收尾不算漂亮。"
        : !isEventFinished && (qualification.trend ?? 0) >= 0.22
          ? "最近在往上走。"
          : !isEventFinished && (qualification.trend ?? 0) <= -0.22
            ? "最近有降溫。"
            : (qualification.consistency ?? 0) <= -0.16
              ? "波動偏大，好壞場差很多。"
              : (qualification.consistency ?? 0) >= 0.24
                ? "場次之間落差小，穩定度不錯。"
                : `可信度 ${formatConfidence(qualification.confidence)}。`;

  return [line1, line2, line3, line4];
}

function getZhPlayoffInsights(team: TeamScore): string[] {
  const playoff = team.playoff;

  if (!playoff) {
    return [
      "這隊還沒有淘汰賽資料。",
      "沒有聯盟脈絡就不能硬評淘汰賽。",
      "等真的打過再看比較準。",
    ];
  }

  const positionText = getPlayoffPositionText("zh-TW", playoff);
  const line1 =
    playoff.positionCode && positionText
      ? `${playoff.positionCode}，${positionText}。`
      : playoff.positionCode
        ? `${playoff.positionCode}，已進入淘汰賽名單。`
        : "聯盟位置資料不完整。";

  const line2 =
    playoff.matchesPlayed === 0
      ? "已選盟，但淘汰賽還沒真正開打。"
      : (playoff.score ?? 0) >= 2.2
        ? `淘汰賽 ${formatRecord(playoff.record)}，聯盟內容有兌現。`
        : (playoff.score ?? 0) <= -1.6
          ? `淘汰賽 ${formatRecord(playoff.record)}，高壓局面沒撐住。`
          : `淘汰賽 ${formatRecord(playoff.record)}，有內容但不算統治。`;

  const line3 =
    team.qualification.score >= 2 && (playoff.score ?? 0) >= 1.8
      ? "積分賽和淘汰賽都站得住。"
      : team.qualification.score < 0 && (playoff.score ?? 0) >= 1.4
        ? "淘汰賽加分主要來自聯盟脈絡。"
        : team.qualification.score >= 2 && (playoff.score ?? 0) < 0
          ? "個體底子不差，但聯盟沒把效果整合出來。"
          : "這裡看的本來就是聯盟脈絡。";

  const line4 = playoff.isComplete
    ? "這個聯盟已經打完，淘汰賽樣本封盤，可信度 100%。"
    : playoff.matchesPlayed <= 1
      ? "淘汰賽樣本還少，先看方向。"
      : `目前淘汰賽可信度 ${formatConfidence(playoff.confidence)}。`;

  return [line1, line2, line3, line4];
}

function getEnQualificationInsights(
  team: TeamScore,
  isEventFinished: boolean,
): string[] {
  const qualification = team.qualification;
  const rank = team.ranking?.rank ?? null;

  if (qualification.matchesPlayed <= 2) {
    return [
      rank !== null
        ? `Rank ${rank}, but the sample is still thin.`
        : `The sample is thin and the record is only ${formatRecord(qualification.record)}.`,
      "This is still closer to an early read than a verdict.",
      `Confidence: ${formatConfidence(qualification.confidence)}.`,
    ];
  }

  const line1 =
    rank !== null && (qualification.inflationRisk ?? 0) >= 0.32
      ? `Rank ${rank}, but the seed looks better than the underlying play.`
      : rank !== null && (team.calibration.underseedSignal ?? 0) >= 0.28
        ? `Rank ${rank}, but the underlying play looks stronger than the seed.`
        : rank !== null
          ? `Rank ${rank} with a ${formatRecord(qualification.record)} record.`
          : `The record is ${formatRecord(qualification.record)}, but the ranking snapshot is incomplete.`;

  const line2 =
    (qualification.scheduleDifficulty ?? 0) >= 0.24 &&
    (qualification.opponentStrength ?? 0) >= 0.14
      ? "The opposition was strong, so the result has more weight."
      : (team.calibration.scheduleAdvantage ?? 0) >= 0.25 &&
          (qualification.partnerStrength ?? 0) >= 0.12
        ? "Strong partners and softer opponents helped the record."
        : (qualification.partnerStrength ?? 0) >= 0.22
          ? "Partner help was above average."
          : (qualification.opponentStrength ?? 0) >= 0.2
            ? "The opposition was real, so the surface rank may undersell the team."
            : "The schedule looks fairly normal.";

  const line3 =
    (qualification.foulReliance ?? 0) >= 0.22
      ? "A noticeable chunk of the score came from opponent fouls."
      : (qualification.cleanScoring ?? 0) >= 0.3 &&
          (qualification.autonomousImpact ?? 0) >= 0.22 &&
          (qualification.endgameImpact ?? 0) >= 0.22
        ? "Clean scoring is solid and both ends of the match matter."
        : (qualification.cleanScoring ?? 0) <= -0.25
          ? "Clean scoring is soft, so the headline result needs a discount."
          : qualification.scoringCeiling !== null &&
              qualification.scoringFloor !== null &&
              qualification.scoringCeiling - qualification.scoringFloor >= 0.55
            ? "The ceiling is real, but the floor moves around."
            : (qualification.scoringFloor ?? 0) >= 0.24
              ? "The floor is stable."
              : "The scoring profile is fairly neutral.";

  const line4 =
    isEventFinished && (qualification.trend ?? 0) >= 0.22
      ? "The back half of the event was better than the front half."
      : isEventFinished && (qualification.trend ?? 0) <= -0.22
        ? "The team faded late."
        : !isEventFinished && (qualification.trend ?? 0) >= 0.22
          ? "Recent form is improving."
          : !isEventFinished && (qualification.trend ?? 0) <= -0.22
            ? "Recent form cooled off."
            : (qualification.consistency ?? 0) <= -0.16
              ? "The match-to-match swing is large."
              : (qualification.consistency ?? 0) >= 0.24
                ? "The match-to-match shape is steady."
                : `Confidence: ${formatConfidence(qualification.confidence)}.`;

  return [line1, line2, line3, line4];
}

function getEnPlayoffInsights(team: TeamScore): string[] {
  const playoff = team.playoff;

  if (!playoff) {
    return [
      "No playoff data exists for this team yet.",
      "Elim analysis needs alliance context first.",
      "Wait until the team actually reaches the bracket.",
    ];
  }

  const positionText = getPlayoffPositionText("en", playoff);
  const line1 =
    playoff.positionCode && positionText
      ? `${playoff.positionCode}, ${positionText}.`
      : playoff.positionCode
        ? `${playoff.positionCode}, inside the playoff picture.`
        : "Alliance slot data is incomplete.";

  const line2 =
    playoff.matchesPlayed === 0
      ? "Alliance selection is done, but the bracket has not really started."
      : (playoff.score ?? 0) >= 2.2
        ? `Playoff record ${formatRecord(playoff.record)}, and the alliance backed it up.`
        : (playoff.score ?? 0) <= -1.6
          ? `Playoff record ${formatRecord(playoff.record)}, but the alliance did not hold up under pressure.`
          : `Playoff record ${formatRecord(playoff.record)}, with some substance but not domination.`;

  const line3 =
    team.qualification.score >= 2 && (playoff.score ?? 0) >= 1.8
      ? "Qualification strength and playoff context agree."
      : team.qualification.score < 0 && (playoff.score ?? 0) >= 1.4
        ? "This playoff boost looks more alliance-driven than individual."
        : team.qualification.score >= 2 && (playoff.score ?? 0) < 0
          ? "The alliance cashed out less than the qualification data suggested."
          : "This tab is grading alliance context, not solo mythology.";

  const line4 = playoff.isComplete
    ? "This alliance is done, so the playoff sample is closed and confidence is 100%."
    : playoff.matchesPlayed <= 1
      ? "The playoff sample is still light."
      : `Playoff confidence is ${formatConfidence(playoff.confidence)}.`;

  return [line1, line2, line3, line4];
}

export function buildTeamInsights(
  team: TeamScore,
  locale: Locale,
  analysisTab: AnalysisTab,
  isEventFinished: boolean,
): string[] {
  if (locale === "zh-TW") {
    return analysisTab === "playoff"
      ? getZhPlayoffInsights(team)
      : getZhQualificationInsights(team, isEventFinished);
  }

  return analysisTab === "playoff"
    ? getEnPlayoffInsights(team)
    : getEnQualificationInsights(team, isEventFinished);
}
