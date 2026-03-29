import type { AnalysisTab, Locale, TeamScore } from "@/lib/types";

import {
  formatConfidence,
  formatNumber,
  formatRecord,
  getPlayoffPositionText,
} from "@/lib/presenters";

function getZhQualificationInsights(
  team: TeamScore,
  isEventFinished: boolean,
): string[] {
  const qualification = team.qualification;
  const rank = team.ranking?.rank ?? null;
  const rankingScore = qualification.rankingScore;
  const totalRankingPoints = qualification.totalRankingPoints;
  const underseedSignal = team.calibration.underseedSignal ?? 0;
  const scheduleAdvantage = team.calibration.scheduleAdvantage ?? 0;
  const inflationRisk = qualification.inflationRisk ?? 0;

  const line1 =
    rank !== null && rankingScore !== null && totalRankingPoints !== null
      ? `排名第${rank}，排名分 ${formatNumber(rankingScore)}、總排名分 ${formatNumber(totalRankingPoints)}。`
      : rank !== null && rankingScore !== null
        ? `排名第${rank}，排名分 ${formatNumber(rankingScore)}。`
        : rank !== null
          ? `排名第${rank}，戰績 ${formatRecord(qualification.record)}。`
          : `戰績 ${formatRecord(qualification.record)}，但排位資料不完整。`;

  const line2 =
    scheduleAdvantage >= 0.25 && (qualification.partnerStrength ?? 0) >= 0.12
      ? "賽程偏甜，隊友偏硬、對手偏軟。"
      : (qualification.scheduleDifficulty ?? 0) >= 0.24 &&
          (qualification.opponentStrength ?? 0) >= 0.14
        ? "賽程偏硬，對手偏強。"
        : (qualification.partnerStrength ?? 0) >= 0.22
          ? "隊友火力不差，帳面成績有被墊高。"
          : (qualification.opponentStrength ?? 0) >= 0.2
            ? "對手不弱，排位可能比內容更保守。"
            : "賽程大致正常。";

  const line3 =
    inflationRisk >= 0.34
      ? "名次比內容漂亮，這張排位要打折。"
      : underseedSignal >= 0.28
        ? "名次壓低了，底層內容比排位更硬。"
        : qualification.rankDelta !== null && Math.abs(qualification.rankDelta) >= 0.24
          ? "名次和底層數據有落差。"
          : rankingScore !== null && totalRankingPoints !== null && rankingScore >= 4
            ? "排名分和總排名分都夠硬，不只是名次好看。"
            : "名次和底層數據大致對得上。";

  const line4 =
    (qualification.foulReliance ?? 0) >= 0.22
      ? "犯規分吃得重，純得分沒那麼硬。"
      : (qualification.cleanScoring ?? 0) >= 0.3 &&
          (qualification.autonomousImpact ?? 0) >= 0.22 &&
          (qualification.endgameImpact ?? 0) >= 0.22
        ? "純得分夠硬，自主和終局都有輸出。"
        : qualification.scoringCeiling !== null &&
            qualification.scoringFloor !== null &&
            qualification.scoringCeiling - qualification.scoringFloor >= 0.55
          ? "波動很大，上下限差得明顯。"
          : isEventFinished && (qualification.trend ?? 0) >= 0.22
            ? "後段有拉起來，收尾比前段好。"
            : isEventFinished && (qualification.trend ?? 0) <= -0.22
              ? "後段有掉速，收尾不如前段。"
              : (qualification.consistency ?? 0) >= 0.24
                ? "表現穩，失手場次不多。"
                : `資料信心 ${formatConfidence(qualification.confidence)}。`;

  return [line1, line2, line3, line4];
}

function getZhPlayoffInsights(team: TeamScore): string[] {
  const playoff = team.playoff;

  if (!playoff) {
    return [
      "這隊還沒有淘汰賽資料。",
      "沒有聯盟脈絡，就沒有淘汰賽判讀。",
      "先等這隊真的進淘汰賽再說。",
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
      ? "聯盟選完了，但淘汰賽還沒真正開打。"
      : (playoff.score ?? 0) >= 2.2
        ? `淘汰賽 ${formatRecord(playoff.record)}，聯盟內容也撐得住。`
        : (playoff.score ?? 0) <= -1.6
          ? `淘汰賽 ${formatRecord(playoff.record)}，聯盟抗壓不夠。`
          : `淘汰賽 ${formatRecord(playoff.record)}，有內容但不到輾壓。`;

  const line3 =
    team.qualification.score >= 2 && (playoff.score ?? 0) >= 1.8
      ? "積分賽硬度和淘汰賽聯盟表現對得上。"
      : team.qualification.score < 0 && (playoff.score ?? 0) >= 1.4
        ? "這波淘汰賽加分，聯盟脈絡重於個體內容。"
        : team.qualification.score >= 2 && (playoff.score ?? 0) < 0
          ? "積分賽看起來不差，但聯盟兌現度不高。"
          : "這裡看的是聯盟脈絡，不是單人神話。";

  const line4 = playoff.isComplete
    ? "這個聯盟已封盤，淘汰賽信心就是 100%。"
    : playoff.matchesPlayed <= 1
      ? "淘汰賽樣本還太薄。"
      : `淘汰賽信心 ${formatConfidence(playoff.confidence)}。`;

  return [line1, line2, line3, line4];
}

function getEnQualificationInsights(
  team: TeamScore,
  isEventFinished: boolean,
): string[] {
  const qualification = team.qualification;
  const rank = team.ranking?.rank ?? null;
  const rankingScore = qualification.rankingScore;
  const totalRankingPoints = qualification.totalRankingPoints;
  const underseedSignal = team.calibration.underseedSignal ?? 0;
  const scheduleAdvantage = team.calibration.scheduleAdvantage ?? 0;
  const inflationRisk = qualification.inflationRisk ?? 0;

  const line1 =
    rank !== null && rankingScore !== null && totalRankingPoints !== null
      ? `Rank ${rank}, ranking score ${formatNumber(rankingScore)}, total RP ${formatNumber(totalRankingPoints)}.`
      : rank !== null && rankingScore !== null
        ? `Rank ${rank}, ranking score ${formatNumber(rankingScore)}.`
        : rank !== null
          ? `Rank ${rank}, record ${formatRecord(qualification.record)}.`
          : `Record ${formatRecord(qualification.record)}, but the ranking snapshot is incomplete.`;

  const line2 =
    scheduleAdvantage >= 0.25 && (qualification.partnerStrength ?? 0) >= 0.12
      ? "The schedule was soft, with stronger partners and weaker opponents."
      : (qualification.scheduleDifficulty ?? 0) >= 0.24 &&
          (qualification.opponentStrength ?? 0) >= 0.14
        ? "The schedule was hard, so the result carries more weight."
        : (qualification.partnerStrength ?? 0) >= 0.22
          ? "Partner help was meaningful."
          : (qualification.opponentStrength ?? 0) >= 0.2
            ? "The opposition was real, so the seed may undersell the team."
            : "The schedule looks fairly normal.";

  const line3 =
    inflationRisk >= 0.34
      ? "The seed looks better than the underlying play."
      : underseedSignal >= 0.28
        ? "The seed looks lower than the underlying play."
        : qualification.rankDelta !== null && Math.abs(qualification.rankDelta) >= 0.24
          ? "The ranking and the underlying data do not fully agree."
          : rankingScore !== null && totalRankingPoints !== null && rankingScore >= 4
            ? "The ranking score and total RP both support the seed."
            : "The ranking and the underlying data mostly agree.";

  const line4 =
    (qualification.foulReliance ?? 0) >= 0.22
      ? "Too much of the score came from opponent fouls."
      : (qualification.cleanScoring ?? 0) >= 0.3 &&
          (qualification.autonomousImpact ?? 0) >= 0.22 &&
          (qualification.endgameImpact ?? 0) >= 0.22
        ? "Clean scoring is solid and both ends of the match matter."
        : qualification.scoringCeiling !== null &&
            qualification.scoringFloor !== null &&
            qualification.scoringCeiling - qualification.scoringFloor >= 0.55
          ? "The ceiling is real, but the floor moves around."
          : isEventFinished && (qualification.trend ?? 0) >= 0.22
            ? "The back half of the event was stronger than the front half."
            : isEventFinished && (qualification.trend ?? 0) <= -0.22
              ? "The team faded late."
              : (qualification.consistency ?? 0) >= 0.24
                ? "The match-to-match profile stayed steady."
                : `Confidence is ${formatConfidence(qualification.confidence)}.`;

  return [line1, line2, line3, line4];
}

function getEnPlayoffInsights(team: TeamScore): string[] {
  const playoff = team.playoff;

  if (!playoff) {
    return [
      "No playoff data exists for this team yet.",
      "No alliance context means no elim read.",
      "Wait until the team actually reaches the bracket.",
    ];
  }

  const positionText = getPlayoffPositionText("en", playoff);
  const line1 =
    playoff.positionCode && positionText
      ? `${playoff.positionCode}, ${positionText}.`
      : playoff.positionCode
        ? `${playoff.positionCode}, inside the playoff field.`
        : "Alliance slot data is incomplete.";

  const line2 =
    playoff.matchesPlayed === 0
      ? "Alliance selection is done, but the bracket has not really started."
      : (playoff.score ?? 0) >= 2.2
        ? `Playoff record ${formatRecord(playoff.record)}, and the alliance backed it up.`
        : (playoff.score ?? 0) <= -1.6
          ? `Playoff record ${formatRecord(playoff.record)}, but the alliance cracked under pressure.`
          : `Playoff record ${formatRecord(playoff.record)}, with substance but not domination.`;

  const line3 =
    team.qualification.score >= 2 && (playoff.score ?? 0) >= 1.8
      ? "Qualification strength and playoff alliance context agree."
      : team.qualification.score < 0 && (playoff.score ?? 0) >= 1.4
        ? "This playoff bump looks more alliance-driven than individual."
        : team.qualification.score >= 2 && (playoff.score ?? 0) < 0
          ? "The alliance cashed out less than qualification suggested."
          : "This tab grades alliance context, not solo mythology.";

  const line4 = playoff.isComplete
    ? "This alliance is done, so playoff confidence is 100%."
    : playoff.matchesPlayed <= 1
      ? "The playoff sample is still thin."
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
