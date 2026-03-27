import type { AnalysisTab, Locale, TeamScore } from "@/lib/types";

import { formatConfidence, formatRecord } from "@/lib/presenters";

function getZhQualificationInsights(team: TeamScore): string[] {
  const qualification = team.qualification;
  const notes: string[] = [];
  const rank = team.ranking?.rank ?? null;

  if (qualification.matchesPlayed <= 1) {
    return [
      "樣本太少，現在講強弱都還太早。",
      "目前只能先看表面排名，底層表現還沒長出穩定輪廓。",
      `資料信心只有 ${formatConfidence(qualification.confidence)}，先別急著封神或判死刑。`,
    ];
  }

  if ((qualification.inflationRisk ?? 0) >= 0.28 && rank !== null) {
    notes.push(`排名現在在第 ${rank}，但賽程偏甜，這個名次要打折看。`);
  } else if ((team.calibration.underseedSignal ?? 0) >= 0.24 && rank !== null) {
    notes.push(`排名只有第 ${rank}，但底層輸出比名次硬，屬於被低估。`);
  } else if (rank !== null) {
    notes.push(`排名第 ${rank}，目前戰績是 ${formatRecord(qualification.record)}。`);
  } else {
    notes.push(`目前戰績是 ${formatRecord(qualification.record)}，但排名資料還不完整。`);
  }

  const scheduleNote =
    (qualification.scheduleDifficulty ?? 0) >= 0.2
      ? "對手偏強，表面名次沒有把難度全算進去。"
      : (team.calibration.scheduleAdvantage ?? 0) >= 0.2
        ? "對手偏爛，戰績看起來漂亮，但不是每一場都真有那麼硬。"
        : "賽程難度大致正常，名次沒有被明顯灌水。";
  const stabilityNote =
    (qualification.consistency ?? 0) <= -0.12
      ? "表現波動很大，好的時候能飛，爛的時候也不客氣。"
      : (qualification.consistency ?? 0) >= 0.22
        ? "輸出相對穩，這隊不是靠抽卡吃飯。"
        : "表現有起伏，但還沒到失控。";

  notes.push(`${scheduleNote}${stabilityNote}`);

  const formNote =
    (qualification.trend ?? 0) >= 0.18
      ? "最近幾場在升溫。"
      : (qualification.trend ?? 0) <= -0.18
        ? "最近幾場有點掉漆。"
        : "近期狀態大致持平。";
  const confidenceNote =
    qualification.confidence >= 0.72
      ? `資料信心 ${formatConfidence(qualification.confidence)}，這份判讀可以認真參考。`
      : qualification.confidence >= 0.42
        ? `資料信心 ${formatConfidence(qualification.confidence)}，方向大致可信，但別看成鐵律。`
        : `資料信心只有 ${formatConfidence(qualification.confidence)}，現在下重話很容易翻車。`;

  notes.push(`${formNote}${confidenceNote}`);

  return notes;
}

function getZhPlayoffInsights(team: TeamScore): string[] {
  const playoff = team.playoff;

  if (!playoff) {
    return [
      "這隊目前沒有淘汰賽資料。",
      "沒有聯盟資訊，也就沒辦法講淘汰賽地位。",
      "等真的進淘汰賽再來看會比較準。",
    ];
  }

  const positionNote = playoff.positionCode
    ? playoff.isBackup
      ? `${playoff.positionCode}，這是備援位置。`
      : `${playoff.positionCode}，聯盟位置一眼就看得出來。`
    : "聯盟位置資料不完整。";
  const advancementNote =
    playoff.matchesPlayed === 0
      ? "聯盟已經成形，但還沒真的開打，現在只能先看籤位。"
      : playoff.score !== null && playoff.score >= 2
        ? "淘汰賽成績有硬度，這個聯盟不是只靠運氣撐著。"
        : playoff.score !== null && playoff.score <= -1.5
          ? "淘汰賽打得不夠順，聯盟競爭力還撐不起場面。"
          : "淘汰賽表現普通，還看不出明顯統治力。";
  const contextNote =
    team.qualification.score >= 2 && (playoff.score ?? 0) >= 2
      ? "積分賽底子和淘汰賽結果算是對得上。"
      : (team.qualification.score ?? 0) < 0 && (playoff.score ?? 0) >= 1.5
        ? "能留在淘汰賽，更像是聯盟整體夠強，不是單隊硬扛。"
        : "淘汰賽要看聯盟脈絡，不能把這分數當單隊英雄榜。";
  const confidenceNote =
    playoff.confidence >= 0.72
      ? `資料信心 ${formatConfidence(playoff.confidence)}，這份淘汰賽判讀已經算穩。`
      : playoff.confidence >= 0.42
        ? `資料信心 ${formatConfidence(playoff.confidence)}，能參考，但樣本還不算厚。`
        : `資料信心只有 ${formatConfidence(playoff.confidence)}，現在多半還在試水溫。`;

  return [
    `${positionNote}${advancementNote}`,
    contextNote,
    confidenceNote,
  ];
}

function getEnQualificationInsights(team: TeamScore): string[] {
  const qualification = team.qualification;
  const rank = team.ranking?.rank ?? null;

  if (qualification.matchesPlayed <= 1) {
    return [
      "The sample is tiny, so any big take right now would be fake confidence.",
      "There is not enough qualification volume yet to separate signal from noise.",
      `Confidence is only ${formatConfidence(qualification.confidence)}, so keep the scouting hot takes holstered.`,
    ];
  }

  const line1 =
    (qualification.inflationRisk ?? 0) >= 0.28 && rank !== null
      ? `Rank ${rank} looks nice, but the schedule has been soft enough that the seed feels a little borrowed.`
      : (team.calibration.underseedSignal ?? 0) >= 0.24 && rank !== null
        ? `Rank ${rank} is lower than the underlying play suggests. This one looks underseeded.`
        : rank !== null
          ? `Rank ${rank} with a ${formatRecord(qualification.record)} record.`
          : `The record is ${formatRecord(qualification.record)}, but the ranking snapshot is incomplete.`;
  const line2 =
    (qualification.scheduleDifficulty ?? 0) >= 0.2
      ? "The opponents have been stronger than average, so the surface rank undersells the work."
      : (team.calibration.scheduleAdvantage ?? 0) >= 0.2
        ? "The opponents have been weak enough that the record deserves some skepticism."
        : "The schedule has been fairly normal, so the current rank is not obviously inflated.";
  const line3 =
    (qualification.consistency ?? 0) <= -0.12
      ? "This team is volatile: high highs, ugly lows, almost no middle."
      : (qualification.consistency ?? 0) >= 0.22
        ? "Contribution looks steady rather than random."
        : "The performance band is mixed, but not out of control yet.";
  const line4 =
    (qualification.trend ?? 0) >= 0.18
      ? "Recent form is climbing."
      : (qualification.trend ?? 0) <= -0.18
        ? "Recent form has cooled off."
        : "Recent form is mostly flat.";
  const line5 =
    qualification.confidence >= 0.72
      ? `Confidence is ${formatConfidence(qualification.confidence)}. This read is solid enough to use.`
      : qualification.confidence >= 0.42
        ? `Confidence is ${formatConfidence(qualification.confidence)}. Useful, but not gospel.`
        : `Confidence is only ${formatConfidence(qualification.confidence)}. Do not overreact yet.`;

  return [line1, `${line2} ${line3}`, `${line4} ${line5}`];
}

function getEnPlayoffInsights(team: TeamScore): string[] {
  const playoff = team.playoff;

  if (!playoff) {
    return [
      "No playoff data exists for this team yet.",
      "Without alliance context, there is nothing serious to say about elimination strength.",
      "Wait until the bracket actually starts doing bracket things.",
    ];
  }

  const line1 = playoff.positionCode
    ? playoff.isBackup
      ? `${playoff.positionCode} is the backup slot, so the role is real but the match sample may stay thin.`
      : `${playoff.positionCode} puts the alliance position front and center.`
    : "Alliance position data is incomplete.";
  const line2 =
    playoff.matchesPlayed === 0
      ? "Alliance selection is done, but there still are no elimination matches to judge."
      : playoff.score !== null && playoff.score >= 2
        ? "The alliance has actually backed up the seed with playoff results."
        : playoff.score !== null && playoff.score <= -1.5
          ? "The alliance has not held up well once the bracket tightened."
          : "The playoff sample is real, but not dominant.";
  const line3 =
    team.qualification.score >= 2 && (playoff.score ?? 0) >= 2
      ? "Qualification strength and playoff context are telling the same story."
      : team.qualification.score < 0 && (playoff.score ?? 0) >= 1.5
        ? "This looks more alliance-powered than individually dominant."
        : "Remember that playoff strength here is alliance context, not solo carry mythology.";
  const line4 =
    playoff.confidence >= 0.72
      ? `Confidence is ${formatConfidence(playoff.confidence)}.`
      : playoff.confidence >= 0.42
        ? `Confidence is ${formatConfidence(playoff.confidence)} and still growing.`
        : `Confidence is only ${formatConfidence(playoff.confidence)}, so keep the bracket takes modest.`;

  return [`${line1} ${line2}`, line3, line4];
}

export function buildTeamInsights(
  team: TeamScore,
  locale: Locale,
  analysisTab: AnalysisTab,
): string[] {
  if (locale === "zh-TW") {
    return analysisTab === "playoff"
      ? getZhPlayoffInsights(team)
      : getZhQualificationInsights(team);
  }

  return analysisTab === "playoff"
    ? getEnPlayoffInsights(team)
    : getEnQualificationInsights(team);
}
