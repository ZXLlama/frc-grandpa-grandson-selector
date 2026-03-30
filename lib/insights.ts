import type {
  AnalysisTab,
  Locale,
  PlayoffFinish,
  TeamScore,
} from "@/lib/types";

import {
  formatConfidence,
  formatNumber,
  formatRecord,
  getPlayoffPositionText,
} from "@/lib/presenters";

type InsightCandidate = {
  group: string;
  weight: number;
  text: string;
};

function pushInsight(
  candidates: InsightCandidate[],
  group: string,
  weight: number,
  text: string | null,
) {
  if (!text) {
    return;
  }

  candidates.push({ group, weight, text });
}

function selectInsightTexts(
  mandatory: string[],
  candidates: InsightCandidate[],
  trailing: string[],
  limit: number,
): string[] {
  const selected = [...mandatory];
  const usedGroups = new Set<string>();

  for (const candidate of candidates.sort((left, right) => right.weight - left.weight)) {
    if (selected.length >= limit - trailing.length) {
      break;
    }

    if (usedGroups.has(candidate.group)) {
      continue;
    }

    usedGroups.add(candidate.group);
    selected.push(candidate.text);
  }

  return [...selected, ...trailing].slice(0, limit);
}

function getZhAdvancementLabel(finish: PlayoffFinish): string {
  switch (finish) {
    case "champion":
      return "冠軍";
    case "finalist":
      return "亞軍";
    case "semifinalist":
      return "四強";
    case "quarterfinalist":
      return "八強";
    case "octofinalist":
      return "十六強";
    default:
      return "尚未定型";
  }
}

function getEnAdvancementLabel(finish: PlayoffFinish): string {
  switch (finish) {
    case "champion":
      return "champion";
    case "finalist":
      return "finalist";
    case "semifinalist":
      return "semifinalist";
    case "quarterfinalist":
      return "quarterfinalist";
    case "octofinalist":
      return "octofinalist";
    default:
      return "not settled";
  }
}

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
  const underlyingStrength = qualification.breakdown.underlyingStrength ?? 0;
  const resumeStrength = qualification.breakdown.resumeStrength ?? 0;
  const scoringStrength = qualification.breakdown.scoringStrength ?? 0;
  const stabilityStrength = qualification.breakdown.stabilityStrength ?? 0;
  const scheduleAdjustedStrength =
    qualification.breakdown.scheduleAdjustedStrength ?? 0;
  const carryRisk = qualification.allianceCarryRisk ?? 0;
  const trend = qualification.trend ?? 0;
  const confidence = formatConfidence(qualification.confidence);
  const ceilingGap =
    qualification.scoringCeiling !== null && qualification.scoringFloor !== null
      ? qualification.scoringCeiling - qualification.scoringFloor
      : null;
  const summary =
    rank !== null && rankingScore !== null && totalRankingPoints !== null
      ? `排名第${rank}，戰績 ${formatRecord(qualification.record)}，排名分 ${formatNumber(rankingScore)}，總排名分 ${formatNumber(totalRankingPoints)}。`
      : rank !== null && rankingScore !== null
        ? `排名第${rank}，戰績 ${formatRecord(qualification.record)}，排名分 ${formatNumber(rankingScore)}。`
        : rank !== null
          ? `排名第${rank}，戰績 ${formatRecord(qualification.record)}。`
          : `戰績 ${formatRecord(qualification.record)}，但排位資料不完整。`;
  const candidates: InsightCandidate[] = [];

  pushInsight(
    candidates,
    "calibration",
    0.98,
    inflationRisk >= 0.46
      ? "名次明顯灌水，底層內容撐不起這個排位。"
      : inflationRisk >= 0.32
        ? "名次偏漂亮，這張排位要先打折。"
        : underseedSignal >= 0.46
          ? "名次偏低，內容比排位更強。"
          : underseedSignal >= 0.28
            ? "排位低估了，底層數據還沒完全反映出來。"
            : resumeStrength - underlyingStrength >= 0.24
              ? "履歷比內容好看，排位可信度普通。"
              : underlyingStrength - resumeStrength >= 0.24
                ? "內容比履歷更硬，名次還沒追上。"
                : rankingScore !== null && totalRankingPoints !== null && rankingScore >= 4
                  ? "排名分和總排名分都站得住，不只是名次好看。"
                  : "排位和底層內容大致一致。",
  );

  pushInsight(
    candidates,
    "schedule",
    0.92,
    scheduleAdvantage >= 0.3 && carryRisk >= 0.2
      ? "賽程偏甜，隊友又夠硬，勝場有被墊高。"
      : scheduleAdvantage >= 0.24
        ? "對手偏軟，這張戰績不能照單全收。"
        : (qualification.scheduleDifficulty ?? 0) >= 0.26 &&
            (qualification.opponentStrength ?? 0) >= 0.18
          ? "對手偏強，這份成績其實比較難打。"
          : carryRisk >= 0.28
            ? "隊友紅利吃得不小，單看戰績會高估。"
            : scheduleAdjustedStrength >= 0.22
              ? "賽程修正後反而更站得住。"
              : "賽程大致正常，沒有太明顯吃表。",
  );

  pushInsight(
    candidates,
    "scoring",
    0.88,
    (qualification.foulReliance ?? 0) >= 0.28
      ? "犯規分吃很重，內容沒比分那麼漂亮。"
      : (qualification.cleanScoring ?? 0) >= 0.28 &&
          (qualification.autonomousImpact ?? 0) >= 0.22 &&
          (qualification.endgameImpact ?? 0) >= 0.22
        ? "自主、正規得分、尾段都有量，得分結構很完整。"
        : (qualification.defensiveResistance ?? 0) >= 0.24 &&
            (qualification.marginStrength ?? 0) >= 0.18
          ? "攻守都站得住，平均分差也撐得住。"
          : (qualification.autonomousImpact ?? 0) >= 0.3
            ? "自主段明顯有料，開局就能搶分。"
            : (qualification.endgameImpact ?? 0) >= 0.3
              ? "尾段拿分很關鍵，收尾能力不差。"
              : scoringStrength >= 0.2
                ? "主動得分能力不差，內容不是靠運氣。"
                : "得分結構普通，沒有特別突出的段落。",
  );

  pushInsight(
    candidates,
    "profile",
    0.82,
    stabilityStrength >= 0.28 && (qualification.scoringFloor ?? 0) >= 0.16
      ? "下限穩，場場都能交出基本盤。"
      : ceilingGap !== null && ceilingGap >= 0.72
        ? "上限有，但波動也大。"
        : (qualification.consistency ?? 0) >= 0.22
          ? "整體波動不大，輸出算穩。"
          : (qualification.marginStrength ?? 0) <= -0.24
            ? "常常打成逆風，內容不像表面那麼舒服。"
            : "穩定度一般，偶爾會飄。",
  );

  pushInsight(
    candidates,
    "trajectory",
    0.76,
    isEventFinished && trend >= 0.24
      ? "後半段明顯拉起來，狀態是往上走的。"
      : isEventFinished && trend <= -0.24
        ? "後半段有掉速，尾盤沒有守住。"
        : (qualification.districtPointTotal ?? 0) >= 20
          ? "區域積分也不差，不只靠這一場衝起來。"
          : qualification.matchesPlayed >= 9
            ? "樣本量夠，這個輪廓已經算清楚。"
            : "樣本還在累積，別急著把話說死。",
  );

  const trailing = [`資料信心 ${confidence}。`];

  return selectInsightTexts([summary], candidates, trailing, 6);
}

function getZhPlayoffInsights(team: TeamScore): string[] {
  const playoff = team.playoff;

  if (!playoff) {
    return [
      "還沒有淘汰賽資料。",
      "沒有聯盟脈絡，就不能硬判淘汰賽強度。",
      "等真正進入聯盟名單再看。",
      "目前這頁沒有更多可分析的內容。",
    ];
  }

  const positionText = getPlayoffPositionText("zh-TW", playoff);
  const candidates: InsightCandidate[] = [];
  const summary = playoff.positionCode && positionText
    ? `${playoff.positionCode}，${positionText}，淘汰賽 ${formatRecord(playoff.record)}，結果 ${getZhAdvancementLabel(playoff.advancement)}。`
    : playoff.positionCode
      ? `${playoff.positionCode}，淘汰賽 ${formatRecord(playoff.record)}，結果 ${getZhAdvancementLabel(playoff.advancement)}。`
      : `淘汰賽 ${formatRecord(playoff.record)}，結果 ${getZhAdvancementLabel(playoff.advancement)}。`;

  pushInsight(
    candidates,
    "control",
    0.92,
    (playoff.breakdown.allianceControl ?? 0) >= 0.42
      ? "聯盟內容夠硬，不只是撿到晉級。"
      : (playoff.breakdown.allianceControl ?? 0) <= -0.28
        ? "聯盟控制力不夠，壓力一上來就鬆了。"
        : (playoff.marginStrength ?? 0) >= 0.22
          ? "平均分差站得住，贏得不算勉強。"
          : "有內容，但離輾壓還有一段。",
  );

  pushInsight(
    candidates,
    "seed",
    0.88,
    (playoff.upsetSignal ?? 0) >= 0.34
      ? "以種子來看算超額演出，聯盟有打穿預期。"
      : (playoff.upsetSignal ?? 0) <= -0.28
        ? "以種子來看沒有打到該有的深度。"
        : (playoff.breakdown.seedStrength ?? 0) >= 0.45
          ? "高種子進場，聯盟本來就有基本盤。"
          : playoff.seed !== null
            ? "種子普通，能走多遠主要看聯盟臨場。"
            : "這組聯盟沒有完整種子資料。",
  );

  pushInsight(
    candidates,
    "relation",
    0.84,
    team.qualification.score >= 2 && (playoff.score ?? 0) >= 2
      ? "積分賽內容和淘汰賽結果對得上。"
      : team.qualification.score < 0 && (playoff.score ?? 0) >= 1.6
        ? "這波淘汰賽加成比較像聯盟帶起來的。"
        : team.qualification.score >= 2 && (playoff.score ?? 0) < 0
          ? "積分賽夠硬，但聯盟兌現度不高。"
          : "這頁看的是聯盟脈絡，不是單兵神話。",
  );

  pushInsight(
    candidates,
    "stability",
    0.74,
    playoff.isBackup
      ? "這隊是備援，樣本本來就更吃聯盟情境。"
      : (playoff.consistency ?? 0) >= 0.22
        ? "聯盟波動不大，輸贏輪廓算清楚。"
        : playoff.matchesPlayed <= 1
          ? "樣本很薄，一兩場還不夠定生死。"
          : "聯盟波動偏大，單看戰績不夠。",
  );

  const trailing = [
    playoff.isComplete
      ? "聯盟賽程已封盤，淘汰賽信心 100%。"
      : `淘汰賽信心 ${formatConfidence(playoff.confidence)}。`,
  ];

  return selectInsightTexts([summary], candidates, trailing, 5);
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
  const underlyingStrength = qualification.breakdown.underlyingStrength ?? 0;
  const resumeStrength = qualification.breakdown.resumeStrength ?? 0;
  const scoringStrength = qualification.breakdown.scoringStrength ?? 0;
  const stabilityStrength = qualification.breakdown.stabilityStrength ?? 0;
  const scheduleAdjustedStrength =
    qualification.breakdown.scheduleAdjustedStrength ?? 0;
  const carryRisk = qualification.allianceCarryRisk ?? 0;
  const trend = qualification.trend ?? 0;
  const confidence = formatConfidence(qualification.confidence);
  const ceilingGap =
    qualification.scoringCeiling !== null && qualification.scoringFloor !== null
      ? qualification.scoringCeiling - qualification.scoringFloor
      : null;
  const summary =
    rank !== null && rankingScore !== null && totalRankingPoints !== null
      ? `Rank ${rank}, record ${formatRecord(qualification.record)}, ranking score ${formatNumber(rankingScore)}, total RP ${formatNumber(totalRankingPoints)}.`
      : rank !== null && rankingScore !== null
        ? `Rank ${rank}, record ${formatRecord(qualification.record)}, ranking score ${formatNumber(rankingScore)}.`
        : rank !== null
          ? `Rank ${rank}, record ${formatRecord(qualification.record)}.`
          : `Record ${formatRecord(qualification.record)}, but the ranking snapshot is incomplete.`;
  const candidates: InsightCandidate[] = [];

  pushInsight(
    candidates,
    "calibration",
    0.98,
    inflationRisk >= 0.46
      ? "The seed is clearly inflated and the underlying play does not fully back it."
      : inflationRisk >= 0.32
        ? "The seed looks a bit prettier than the play underneath."
        : underseedSignal >= 0.46
          ? "The seed is too low and the underlying data points higher."
          : underseedSignal >= 0.28
            ? "The team looks slightly underseeded."
            : resumeStrength - underlyingStrength >= 0.24
              ? "The resume looks better than the underlying play."
              : underlyingStrength - resumeStrength >= 0.24
                ? "The underlying play is stronger than the current seed."
                : rankingScore !== null && totalRankingPoints !== null && rankingScore >= 4
                  ? "Ranking score and total RP both support the seed."
                  : "The seed and the underlying data mostly agree.",
  );

  pushInsight(
    candidates,
    "schedule",
    0.92,
    scheduleAdvantage >= 0.3 && carryRisk >= 0.2
      ? "The schedule was soft, partner help was real, and the win column got a boost."
      : scheduleAdvantage >= 0.24
        ? "Opposition quality was soft, so the record needs context."
        : (qualification.scheduleDifficulty ?? 0) >= 0.26 &&
            (qualification.opponentStrength ?? 0) >= 0.18
          ? "The schedule was hard, which makes the result more credible."
          : carryRisk >= 0.28
            ? "Partner help mattered a lot."
            : scheduleAdjustedStrength >= 0.22
              ? "The team looks better after schedule correction."
              : "The schedule looks fairly normal.",
  );

  pushInsight(
    candidates,
    "scoring",
    0.88,
    (qualification.foulReliance ?? 0) >= 0.28
      ? "Too much of the score came from opponent fouls."
      : (qualification.cleanScoring ?? 0) >= 0.28 &&
          (qualification.autonomousImpact ?? 0) >= 0.22 &&
          (qualification.endgameImpact ?? 0) >= 0.22
        ? "Auto, clean scoring, and endgame all matter here."
        : (qualification.defensiveResistance ?? 0) >= 0.24 &&
            (qualification.marginStrength ?? 0) >= 0.18
          ? "Both sides of the ball look solid, and the average margin agrees."
          : (qualification.autonomousImpact ?? 0) >= 0.3
            ? "Auto is a real differentiator."
            : (qualification.endgameImpact ?? 0) >= 0.3
              ? "Endgame contribution is doing real work."
              : scoringStrength >= 0.2
                ? "The team can generate real points without leaning on luck."
                : "The scoring profile is fairly ordinary.",
  );

  pushInsight(
    candidates,
    "profile",
    0.82,
    stabilityStrength >= 0.28 && (qualification.scoringFloor ?? 0) >= 0.16
      ? "The floor is stable and the baseline shows up every match."
      : ceilingGap !== null && ceilingGap >= 0.72
        ? "The ceiling is real, but the volatility comes with it."
        : (qualification.consistency ?? 0) >= 0.22
          ? "The match-to-match profile stays fairly steady."
          : (qualification.marginStrength ?? 0) <= -0.24
            ? "Too many matches turned into uphill work."
            : "Stability is only average.",
  );

  pushInsight(
    candidates,
    "trajectory",
    0.76,
    isEventFinished && trend >= 0.24
      ? "The back half of the event was stronger than the front half."
      : isEventFinished && trend <= -0.24
        ? "The team faded late."
        : (qualification.districtPointTotal ?? 0) >= 20
          ? "District points say this is not just a one-week spike."
          : qualification.matchesPlayed >= 9
            ? "The sample is large enough to trust the outline."
            : "The sample is still a little thin.",
  );

  const trailing = [`Confidence sits at ${confidence}.`];

  return selectInsightTexts([summary], candidates, trailing, 6);
}

function getEnPlayoffInsights(team: TeamScore): string[] {
  const playoff = team.playoff;

  if (!playoff) {
    return [
      "No playoff data exists yet.",
      "Without alliance context, this tab should stay empty.",
      "Wait until the team actually enters the bracket.",
      "There is no clean playoff read yet.",
    ];
  }

  const positionText = getPlayoffPositionText("en", playoff);
  const candidates: InsightCandidate[] = [];
  const summary = playoff.positionCode && positionText
    ? `${playoff.positionCode}, ${positionText}, playoff record ${formatRecord(playoff.record)}, finish ${getEnAdvancementLabel(playoff.advancement)}.`
    : playoff.positionCode
      ? `${playoff.positionCode}, playoff record ${formatRecord(playoff.record)}, finish ${getEnAdvancementLabel(playoff.advancement)}.`
      : `Playoff record ${formatRecord(playoff.record)}, finish ${getEnAdvancementLabel(playoff.advancement)}.`;

  pushInsight(
    candidates,
    "control",
    0.92,
    (playoff.breakdown.allianceControl ?? 0) >= 0.42
      ? "The alliance had real control and did more than just survive."
      : (playoff.breakdown.allianceControl ?? 0) <= -0.28
        ? "The alliance cracked once the pressure rose."
        : (playoff.marginStrength ?? 0) >= 0.22
          ? "The average margin supports the result."
          : "There was substance, but not domination.",
  );

  pushInsight(
    candidates,
    "seed",
    0.88,
    (playoff.upsetSignal ?? 0) >= 0.34
      ? "Relative to seed, this was an over-performance."
      : (playoff.upsetSignal ?? 0) <= -0.28
        ? "Relative to seed, the alliance came up short."
        : (playoff.breakdown.seedStrength ?? 0) >= 0.45
          ? "A high seed gave the alliance a strong starting point."
          : playoff.seed !== null
            ? "The seed was ordinary, so the bracket path mattered."
            : "Seed data is incomplete for this alliance.",
  );

  pushInsight(
    candidates,
    "relation",
    0.84,
    team.qualification.score >= 2 && (playoff.score ?? 0) >= 2
      ? "Qualification strength and playoff context point in the same direction."
      : team.qualification.score < 0 && (playoff.score ?? 0) >= 1.6
        ? "This playoff bump looks more alliance-driven than individual."
        : team.qualification.score >= 2 && (playoff.score ?? 0) < 0
          ? "Qualification looked stronger than the bracket result."
          : "This tab grades alliance context, not solo mythology.",
  );

  pushInsight(
    candidates,
    "stability",
    0.74,
    playoff.isBackup
      ? "This team entered as a backup, so the sample is even more alliance-dependent."
      : (playoff.consistency ?? 0) >= 0.22
        ? "The alliance profile stayed fairly steady."
        : playoff.matchesPlayed <= 1
          ? "The playoff sample is still thin."
          : "The alliance was hard to read from match to match.",
  );

  const trailing = [
    playoff.isComplete
      ? "The alliance is done, so playoff confidence is 100%."
      : `Playoff confidence sits at ${formatConfidence(playoff.confidence)}.`,
  ];

  return selectInsightTexts([summary], candidates, trailing, 5);
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
