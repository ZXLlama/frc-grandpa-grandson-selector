import type { AnalysisTab, Locale, TeamScore } from "@/lib/types";

import {
  formatConfidence,
  formatRecord,
  getPlayoffPositionText,
} from "@/lib/presenters";

function joinSentences(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function formatRank(rank: number | null): string | null {
  return rank === null ? null : `第 ${rank}`;
}

function getZhSparseQualificationInsights(team: TeamScore): string[] {
  const qualification = team.qualification;
  const rankText = formatRank(team.ranking?.rank ?? null);

  return [
    joinSentences([
      rankText
        ? `目前排位 ${rankText}，戰績 ${formatRecord(qualification.record)}。`
        : `目前戰績 ${formatRecord(qualification.record)}，但排位資料還不完整。`,
      "只是場次太少，現在下重結論很容易翻車。",
    ]),
    "樣本還薄，對手強弱、隊友分配、單場波動都還在亂晃，暫時分不太出真底子和運氣。",
    qualification.scorePotential !== null && qualification.scorePotential >= 0.2
      ? "得分上限先看起來不差，但還缺更多場次去確認是不是能穩定複製。"
      : "目前還看不出穩定做分的輪廓，先不要急著把這隊吹太高或踩太死。",
    `現在可信度 ${formatConfidence(qualification.confidence)}，先把它當成早期觀察，不要當成最終判決。`,
  ];
}

function getZhQualificationInsights(team: TeamScore): string[] {
  const qualification = team.qualification;
  const rank = team.ranking?.rank ?? null;

  if (qualification.matchesPlayed <= 2) {
    return getZhSparseQualificationInsights(team);
  }

  const line1 = (() => {
    if (rank !== null && (qualification.inflationRisk ?? 0) >= 0.32) {
      return `目前排位第 ${rank}，戰績 ${formatRecord(qualification.record)}；名次比底層內容更好看，灌水味偏重。`;
    }

    if (rank !== null && (team.calibration.underseedSignal ?? 0) >= 0.28) {
      return `目前排位第 ${rank}，戰績 ${formatRecord(qualification.record)}；名次壓得比內容還低，屬於被低估。`;
    }

    if (rank !== null) {
      return `目前排位第 ${rank}，戰績 ${formatRecord(qualification.record)}；表面名次和內容大致對得上。`;
    }

    return `目前戰績 ${formatRecord(qualification.record)}，但排位快照不完整，先以場上內容為主。`;
  })();

  const line2 = (() => {
    if (
      (qualification.scheduleDifficulty ?? 0) >= 0.24 &&
      (qualification.opponentStrength ?? 0) >= 0.14
    ) {
      return "對手偏強，隊友也沒有特別罩，這份成績的含金量比表面更高。";
    }

    if (
      (team.calibration.scheduleAdvantage ?? 0) >= 0.25 &&
      (qualification.partnerStrength ?? 0) >= 0.12
    ) {
      return "隊友偏硬、對手偏軟，戰績有吃到賽程紅利，不能把勝場全算成單獨扛出來的。";
    }

    if ((qualification.partnerStrength ?? 0) >= 0.22) {
      return "這段樣本裡隊友加成偏多，所以成績有一部分是搭到順風車。";
    }

    if ((qualification.opponentStrength ?? 0) >= 0.2) {
      return "對手強度不低，表面名次普通，但實際內容沒有那麼弱。";
    }

    return "賽程強度大致正常，這隊現在看到的樣子和表面成績差不多。";
  })();

  const line3 = (() => {
    const parts: string[] = [];

    if ((qualification.foulReliance ?? 0) >= 0.22) {
      parts.push("分數有明顯一段靠對手犯規送進來，乾淨得分沒有表面那麼漂亮。");
    } else if ((qualification.cleanScoring ?? 0) >= 0.3) {
      parts.push("不太靠送分，自己就能把有效分數做出來。");
    } else if ((qualification.cleanScoring ?? 0) <= -0.25) {
      parts.push("乾淨得分偏弱，場面內容需要比戰績再打折一點。");
    }

    if (
      (qualification.autonomousImpact ?? 0) >= 0.24 &&
      (qualification.endgameImpact ?? 0) >= 0.24
    ) {
      parts.push("開局和收尾都有產值，功能完整。");
    } else if ((qualification.autonomousImpact ?? 0) >= 0.24) {
      parts.push("開局得分有存在感，常常先搶節奏。");
    } else if ((qualification.endgameImpact ?? 0) >= 0.24) {
      parts.push("收尾價值高，關鍵時刻比較能補分。");
    }

    if (
      qualification.scoringCeiling !== null &&
      qualification.scoringFloor !== null &&
      qualification.scoringCeiling - qualification.scoringFloor >= 0.55
    ) {
      parts.push("上限和下限差很大，爆場和熄火都看過。");
    } else if ((qualification.scoringFloor ?? 0) >= 0.24) {
      parts.push("下限守得住，不太會整場失溫。");
    } else if ((qualification.scoringCeiling ?? 0) >= 0.4) {
      parts.push("上限夠高，真的有能力打一場很兇的。");
    }

    if (!parts.length) {
      parts.push("得分輪廓還算普通，沒有看到特別偏科或特別誇張的做分方式。");
    }

    return joinSentences(parts);
  })();

  const line4 = (() => {
    if ((qualification.trend ?? 0) >= 0.22 && (qualification.consistency ?? 0) >= 0.18) {
      return "最近越打越順，而且不是偶發一場，場次之間的內容也撐得住。";
    }

    if ((qualification.trend ?? 0) >= 0.22) {
      return "最近有往上走，但穩定性還沒完全鎖住，還需要再看幾場。";
    }

    if ((qualification.trend ?? 0) <= -0.22 && (qualification.consistency ?? 0) <= -0.12) {
      return "最近往下掉，而且波動還大，好一場壞一場，現在很難放心。";
    }

    if ((qualification.consistency ?? 0) <= -0.16) {
      return "波動偏大，高高低低都出現過，這種隊伍最怕你剛好看到最好那一場就信了。";
    }

    if ((qualification.consistency ?? 0) >= 0.24) {
      return "場次之間落差小，輸贏之外也能維持內容，穩定度算是這隊的優點。";
    }

    return "近期表現沒有大起大落，屬於中性偏穩的走勢。";
  })();

  const line5 = (() => {
    const context: string[] = [];

    if (qualification.matchesPlayed <= 4 || qualification.confidence < 0.42) {
      context.push(`目前可信度 ${formatConfidence(qualification.confidence)}，樣本還不夠厚，先別急著封神或判死。`);
    } else if (qualification.confidence >= 0.74) {
      context.push(`目前可信度 ${formatConfidence(qualification.confidence)}，這份判讀已經可以拿來當正式場邊參考。`);
    } else {
      context.push(`目前可信度 ${formatConfidence(qualification.confidence)}，能用，但還不到完全鐵板一塊。`);
    }

    if (team.playoff) {
      context.push("另外這隊若已進淘汰賽，淘汰賽那邊要看聯盟脈絡，不能直接拿回來灌進積分賽評分。");
    } else if (qualification.districtPointTotal !== null && qualification.districtPointTotal >= 30) {
      context.push("額外積分面也不差，看起來不像只靠短樣本剛好順一波。");
    }

    return joinSentences(context);
  })();

  return [line1, line2, line3, line4, line5];
}

function getZhPlayoffInsights(team: TeamScore): string[] {
  const playoff = team.playoff;

  if (!playoff) {
    return [
      "1. 這隊還沒有淘汰賽樣本，所以這裡沒有能認真講的淘汰賽內容。",
      "2. 淘汰賽評分一定要先有聯盟脈絡，沒有聯盟名單就只是在腦補。",
      "3. 等真的進淘汰賽再來看，現在硬講只會比資料還大聲。",
    ];
  }

  const positionText = getPlayoffPositionText("zh-TW", playoff);

  const line1 = (() => {
    if (playoff.positionCode && playoff.isBackup) {
      return `${playoff.positionCode}，${positionText ?? "備用位置"}；這是備用機器人位置，角色存在，但出場樣本可能會很薄。`;
    }

    if (playoff.positionCode && positionText) {
      return `${playoff.positionCode}，${positionText}；聯盟定位很清楚，不是在邊角偷偷混進來。`;
    }

    return "聯盟位置資料不完整，但可以確定這隊已經進入淘汰賽脈絡。";
  })();

  const line2 = (() => {
    if (playoff.matchesPlayed === 0) {
      return "已經被選進淘汰賽，但對戰表還沒真正打起來，現在主要只能看選盟位置。";
    }

    if ((playoff.score ?? 0) >= 2.2) {
      return `淘汰賽戰績 ${formatRecord(playoff.record)}，而且內容有兌現，聯盟不是只靠名單好看。`;
    }

    if ((playoff.score ?? 0) <= -1.6) {
      return `淘汰賽戰績 ${formatRecord(playoff.record)}，但高壓局面下沒有把內容撐住，進榜不等於真能打。`;
    }

    return `淘汰賽戰績 ${formatRecord(playoff.record)}，目前有內容，但還不到可以無腦吹的程度。`;
  })();

  const line3 = (() => {
    if (team.qualification.score >= 2 && (playoff.score ?? 0) >= 1.8) {
      return "積分賽底子本來就夠，淘汰賽也有兌現，這不是突然抱到大腿才浮上來。";
    }

    if (team.qualification.score < 0 && (playoff.score ?? 0) >= 1.4) {
      return "這份淘汰賽加分主要來自聯盟脈絡，不宜直接翻譯成個人統治力。";
    }

    if (team.qualification.score >= 2 && (playoff.score ?? 0) < 0) {
      return "個體底子不差，但聯盟整體在高壓局沒有把效果整合出來。";
    }

    return "這裡看的本來就是聯盟脈絡，不該硬翻成單兵戰力神話。";
  })();

  const line4 = (() => {
    if (playoff.matchesPlayed <= 1) {
      return "場次還少，現在比較像看方向，不像看定論。";
    }

    if ((playoff.winRate ?? 0) >= 0.7 && (playoff.consistency ?? 0) >= 0.16) {
      return "聯盟勝率和內容都站得住，場次之間沒有明顯掉速。";
    }

    if ((playoff.consistency ?? 0) <= -0.16) {
      return "聯盟波動偏大，一場像樣一場失溫，很吃臨場手感。";
    }

    if ((playoff.winRate ?? 0) <= 0.35) {
      return "結果偏苦，代表壓力局沒有把優勢穩穩收進口袋。";
    }

    return "聯盟樣本有了，但還在變動，不算完全定型。";
  })();

  const line5 =
    playoff.matchesPlayed === 0
      ? `目前可信度 ${formatConfidence(playoff.confidence)}，因為還沒真正開打，所以先看聯盟位置，不急著神化。`
      : playoff.confidence >= 0.72
        ? `目前可信度 ${formatConfidence(playoff.confidence)}，這份淘汰賽判讀已經有實際參考價值。`
        : `目前可信度 ${formatConfidence(playoff.confidence)}，樣本還不夠厚，先別把幾場淘汰賽講成鐵律。`;

  return [line1, line2, line3, line4, line5];
}

function getEnSparseQualificationInsights(team: TeamScore): string[] {
  const qualification = team.qualification;
  const rank = team.ranking?.rank ?? null;

  return [
    joinSentences([
      rank !== null
        ? `Rank ${rank} with a ${formatRecord(qualification.record)} record.`
        : `Current record: ${formatRecord(qualification.record)}.`,
      "The sample is still tiny, so any strong conclusion would be fake certainty.",
    ]),
    "There are not enough matches yet to separate true strength from schedule noise, partner luck, or one weird outlier.",
    qualification.scorePotential !== null && qualification.scorePotential >= 0.2
      ? "The scoring ceiling looks promising, but it still needs more volume before that read becomes trustworthy."
      : "The scoring profile is still thin enough that overreacting here would be lazy scouting.",
    `Confidence is only ${formatConfidence(qualification.confidence)}, so treat this as an early read, not a verdict.`,
  ];
}

function getEnQualificationInsights(team: TeamScore): string[] {
  const qualification = team.qualification;
  const rank = team.ranking?.rank ?? null;

  if (qualification.matchesPlayed <= 2) {
    return getEnSparseQualificationInsights(team);
  }

  const line1 = (() => {
    if (rank !== null && (qualification.inflationRisk ?? 0) >= 0.32) {
      return `Rank ${rank} with a ${formatRecord(qualification.record)} record, but the seed looks softer than the underlying play.`;
    }

    if (rank !== null && (team.calibration.underseedSignal ?? 0) >= 0.28) {
      return `Rank ${rank} with a ${formatRecord(qualification.record)} record, and still lower than the underlying play suggests.`;
    }

    if (rank !== null) {
      return `Rank ${rank} with a ${formatRecord(qualification.record)} record. The surface result mostly matches the underlying play.`;
    }

    return `The record is ${formatRecord(qualification.record)}, but the ranking snapshot is incomplete, so the read leans on match content instead.`;
  })();

  const line2 = (() => {
    if (
      (qualification.scheduleDifficulty ?? 0) >= 0.24 &&
      (qualification.opponentStrength ?? 0) >= 0.14
    ) {
      return "The schedule has actually been tough, so the current result deserves more respect than the seed alone gives it.";
    }

    if (
      (team.calibration.scheduleAdvantage ?? 0) >= 0.25 &&
      (qualification.partnerStrength ?? 0) >= 0.12
    ) {
      return "Strong partners and softer opposition have helped. The record is useful, but not pure individual muscle.";
    }

    if ((qualification.partnerStrength ?? 0) >= 0.22) {
      return "Partner help has been above average, so not every win here should be credited as a solo carry job.";
    }

    if ((qualification.opponentStrength ?? 0) >= 0.2) {
      return "The opposition has been real, so a middling seed may still hide stronger actual play.";
    }

    return "The schedule looks fairly normal, so the current rank is not obviously being distorted by matchup luck.";
  })();

  const line3 = (() => {
    const parts: string[] = [];

    if ((qualification.foulReliance ?? 0) >= 0.22) {
      parts.push("A noticeable slice of the score has come from opponent fouls, so the clean scoring picture is weaker than the headline result.");
    } else if ((qualification.cleanScoring ?? 0) >= 0.3) {
      parts.push("The team can generate real points without leaning on gifts.");
    } else if ((qualification.cleanScoring ?? 0) <= -0.25) {
      parts.push("Clean scoring has been soft, which is why the surface result deserves some skepticism.");
    }

    if (
      (qualification.autonomousImpact ?? 0) >= 0.24 &&
      (qualification.endgameImpact ?? 0) >= 0.24
    ) {
      parts.push("Both the opening and the closing phases matter here, which points to a more complete scoring profile.");
    } else if ((qualification.autonomousImpact ?? 0) >= 0.24) {
      parts.push("The early phase shows up in the numbers.");
    } else if ((qualification.endgameImpact ?? 0) >= 0.24) {
      parts.push("Late-match value is doing real work.");
    }

    if (
      qualification.scoringCeiling !== null &&
      qualification.scoringFloor !== null &&
      qualification.scoringCeiling - qualification.scoringFloor >= 0.55
    ) {
      parts.push("The ceiling is real, but the floor can disappear.");
    } else if ((qualification.scoringFloor ?? 0) >= 0.24) {
      parts.push("The floor is sturdier than average.");
    } else if ((qualification.scoringCeiling ?? 0) >= 0.4) {
      parts.push("There is genuine spike potential here.");
    }

    if (!parts.length) {
      parts.push("The scoring profile looks fairly ordinary, without one giant strength or one giant flaw taking over the story.");
    }

    return joinSentences(parts);
  })();

  const line4 = (() => {
    if ((qualification.trend ?? 0) >= 0.22 && (qualification.consistency ?? 0) >= 0.18) {
      return "Recent form is improving and the match-to-match shape is stable. That is a useful combination.";
    }

    if ((qualification.trend ?? 0) >= 0.22) {
      return "Recent form is climbing, but the stability has not fully caught up yet.";
    }

    if ((qualification.trend ?? 0) <= -0.22 && (qualification.consistency ?? 0) <= -0.12) {
      return "The recent direction is down and the volatility is still loud. That is not a comforting mix.";
    }

    if ((qualification.consistency ?? 0) <= -0.16) {
      return "This team is volatile. The good matches and bad matches barely look related.";
    }

    if ((qualification.consistency ?? 0) >= 0.24) {
      return "The performance band is steady enough to trust more than the typical mid-event sample.";
    }

    return "Form is mostly neutral and the performance band is manageable.";
  })();

  const line5 = (() => {
    const parts: string[] = [];

    if (qualification.matchesPlayed <= 4 || qualification.confidence < 0.42) {
      parts.push(`Confidence is ${formatConfidence(qualification.confidence)}, so the sample still needs more volume before anyone should get dramatic.`);
    } else if (qualification.confidence >= 0.74) {
      parts.push(`Confidence is ${formatConfidence(qualification.confidence)}. This read is sturdy enough to use.`);
    } else {
      parts.push(`Confidence is ${formatConfidence(qualification.confidence)}. Useful, but not sacred.`);
    }

    if (team.playoff) {
      parts.push("If this team is already in elims, keep that context in the playoff tab instead of smearing it back into the qualification read.");
    } else if (qualification.districtPointTotal !== null && qualification.districtPointTotal >= 30) {
      parts.push("The broader event resume also has some weight, which helps this read feel less fluky.");
    }

    return joinSentences(parts);
  })();

  return [line1, line2, line3, line4, line5];
}

function getEnPlayoffInsights(team: TeamScore): string[] {
  const playoff = team.playoff;

  if (!playoff) {
    return [
      "No playoff sample exists for this team yet.",
      "Elimination analysis needs alliance context first, and that context does not exist here yet.",
      "Wait until the team actually reaches elims before pretending the bracket read means anything.",
    ];
  }

  const positionText = getPlayoffPositionText("en", playoff);

  const line1 = (() => {
    if (playoff.positionCode && playoff.isBackup) {
      return `${playoff.positionCode}, ${positionText ?? "backup slot"}. The role is real, but the match sample may stay thin.`;
    }

    if (playoff.positionCode && positionText) {
      return `${playoff.positionCode}, ${positionText}. The alliance role is clear and visible.`;
    }

    return "Alliance slot data is incomplete, but the team is still inside the playoff context.";
  })();

  const line2 = (() => {
    if (playoff.matchesPlayed === 0) {
      return "Alliance selection is done, but the bracket has not really started yet, so this is still mostly a lineup read.";
    }

    if ((playoff.score ?? 0) >= 2.2) {
      return `The playoff record is ${formatRecord(playoff.record)}, and the alliance has actually backed up the seed with real output.`;
    }

    if ((playoff.score ?? 0) <= -1.6) {
      return `The playoff record is ${formatRecord(playoff.record)}, but the alliance has not held up well under bracket pressure.`;
    }

    return `The playoff record is ${formatRecord(playoff.record)}. There is substance here, but not enough to start mythmaking.`;
  })();

  const line3 = (() => {
    if (team.qualification.score >= 2 && (playoff.score ?? 0) >= 1.8) {
      return "Qualification strength and playoff context are telling the same story. This is not just a lucky seat on the couch.";
    }

    if (team.qualification.score < 0 && (playoff.score ?? 0) >= 1.4) {
      return "The playoff boost looks more alliance-powered than individually dominant.";
    }

    if (team.qualification.score >= 2 && (playoff.score ?? 0) < 0) {
      return "The team looked stronger in qualification than the alliance has managed to cash out in elims.";
    }

    return "Remember that this tab is grading alliance context, not pretending three teams magically became one solo rating.";
  })();

  const line4 = (() => {
    if (playoff.matchesPlayed <= 1) {
      return "The sample is still light, so this is a directional read more than a settled one.";
    }

    if ((playoff.winRate ?? 0) >= 0.7 && (playoff.consistency ?? 0) >= 0.16) {
      return "The alliance is winning and doing it with a stable shape.";
    }

    if ((playoff.consistency ?? 0) <= -0.16) {
      return "The alliance is volatile enough that each round still feels like a different personality.";
    }

    if ((playoff.winRate ?? 0) <= 0.35) {
      return "The alliance has struggled to convert pressure matches into actual progress.";
    }

    return "The alliance sample is real, but still moving around.";
  })();

  const line5 =
    playoff.matchesPlayed === 0
      ? `Confidence is ${formatConfidence(playoff.confidence)}. Until the bracket starts, this stays mostly about lineup context.`
      : playoff.confidence >= 0.72
        ? `Confidence is ${formatConfidence(playoff.confidence)}. This playoff read is sturdy enough to matter.`
        : `Confidence is ${formatConfidence(playoff.confidence)}. The elim sample still needs more weight before anyone gets carried away.`;

  return [line1, line2, line3, line4, line5];
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
