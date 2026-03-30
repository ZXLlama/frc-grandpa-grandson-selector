"use client";

import { useState } from "react";

import { clamp } from "@/lib/constants";
import { buildTeamInsights } from "@/lib/insights";
import type { AnalysisTab, Locale, TeamScore } from "@/lib/types";

import styles from "@/components/team-breakdown-dashboard.module.css";

type MetricMode = "signed" | "unsigned";

type BreakdownMetric = {
  key: string;
  label: string;
  value: number | null;
  mode: MetricMode;
  formulaLabel: string;
  formula: string;
  highLabel: string;
  highMeaning: string;
  lowLabel: string;
  lowMeaning: string;
};

type TeamBreakdownDashboardProps = {
  team: TeamScore;
  locale: Locale;
  analysisTab: AnalysisTab;
  isEventFinished: boolean;
};

function formatSignedMetric(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }

  const rounded = Math.round(clamp(value, -1, 1) * 100);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

function formatUnsignedMetric(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }

  return `${Math.round(clamp(value, 0, 1) * 100)}%`;
}

function getSignedTrackWidth(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "0%";
  }

  return `${Math.abs(clamp(value, -1, 1)) * 50}%`;
}

function getUnsignedTrackWidth(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "0%";
  }

  return `${clamp(value, 0, 1) * 100}%`;
}

function getQualificationMetrics(
  team: TeamScore,
  locale: Locale,
): BreakdownMetric[] {
  const qualification = team.qualification;

  if (locale === "zh-TW") {
    return [
      {
        key: "rankingForm",
        label: "排位表現",
        value: qualification.breakdown.resumeStrength,
        mode: "signed",
        formulaLabel: "怎麼算",
        formula:
          "看排名、排名分、總排名分、戰績和排位相關排序值，再一起整理成排位履歷分。",
        highLabel: "高分代表",
        highMeaning: "名次和排名資料都很硬，排位本身站得住。",
        lowLabel: "低分代表",
        lowMeaning: "現在的名次、排名分或總排名分不夠有說服力。",
      },
      {
        key: "trueStrength",
        label: "真實實力",
        value: qualification.breakdown.underlyingStrength,
        mode: "signed",
        formulaLabel: "怎麼算",
        formula:
          "看調整後表現、OPR、CCWM、平均分差、防守抗性和乾淨得分，不直接吃排位表面。",
        highLabel: "高分代表",
        highMeaning: "就算把賽程運氣扣掉，隊伍本體還是很強。",
        lowLabel: "低分代表",
        lowMeaning: "底層內容偏弱，排位可能比真實內容更好看。",
      },
      {
        key: "scheduleImpact",
        label: "賽程影響",
        value: qualification.breakdown.scheduleAdjustedStrength,
        mode: "signed",
        formulaLabel: "怎麼算",
        formula:
          "看隊友強度、對手強度、被帶飛風險、排位灌水風險和硬賽程加權後的修正結果。",
        highLabel: "高分代表",
        highMeaning: "賽程修正後還是站得住，沒有太靠甜表。",
        lowLabel: "低分代表",
        lowMeaning: "可能吃了好賽程或強隊友紅利，這張成績要保守看。",
      },
      {
        key: "scoring",
        label: "得分能力",
        value: qualification.breakdown.scoringStrength,
        mode: "signed",
        formulaLabel: "怎麼算",
        formula:
          "看乾淨得分、自主、尾段、得分天花板和各得分項目分布，不只看總分。",
        highLabel: "高分代表",
        highMeaning: "自己拿分的能力完整，自主和尾段也能補分。",
        lowLabel: "低分代表",
        lowMeaning: "主動得分手段有限，或太依賴外部條件撐分。",
      },
      {
        key: "stability",
        label: "穩定度",
        value: qualification.breakdown.stabilityStrength,
        mode: "signed",
        formulaLabel: "怎麼算",
        formula:
          "看場次波動、分數下限、平均分差穩定度和高低落差懲罰。",
        highLabel: "高分代表",
        highMeaning: "每場輸出差不多，下限穩，不太會亂飄。",
        lowLabel: "低分代表",
        lowMeaning: "場次起伏大，好壞局差很多。",
      },
      {
        key: "ceiling",
        label: "隊伍上限",
        value: qualification.breakdown.ceilingStrength,
        mode: "signed",
        formulaLabel: "怎麼算",
        formula:
          "看單場上限、得分潛力、分差上限，以及自主和尾段能不能把天花板拉高。",
        highLabel: "高分代表",
        highMeaning: "最好那幾場真的能打很高，上限夠嚇人。",
        lowLabel: "低分代表",
        lowMeaning: "通常打不到太高，天花板比較早封頂。",
      },
      {
        key: "confidence",
        label: "資料信心",
        value: qualification.confidence,
        mode: "unsigned",
        formulaLabel: "怎麼算",
        formula:
          "看已打場次、排名資料、OPR、COPR、score breakdown、status 和其他可用資料是否齊。",
        highLabel: "高分代表",
        highMeaning: "資料夠完整，這些分數比較可信。",
        lowLabel: "低分代表",
        lowMeaning: "樣本還薄或資料缺口多，先別太早下定論。",
      },
    ];
  }

  return [
    {
      key: "rankingForm",
      label: "Ranking Form",
      value: qualification.breakdown.resumeStrength,
      mode: "signed",
      formulaLabel: "How it's scored",
      formula:
        "Built from rank, ranking score, total RP, record, and other ranking-related sort values.",
      highLabel: "High means",
      highMeaning: "The current seed and ranking outputs are hard to argue with.",
      lowLabel: "Low means",
      lowMeaning: "The rank, ranking score, or total RP does not look convincing yet.",
    },
    {
      key: "trueStrength",
      label: "True Strength",
      value: qualification.breakdown.underlyingStrength,
      mode: "signed",
      formulaLabel: "How it's scored",
      formula:
        "Built from adjusted performance, OPR, CCWM, average margin, defensive resistance, and clean scoring.",
      highLabel: "High means",
      highMeaning: "The team still looks strong after removing schedule noise.",
      lowLabel: "Low means",
      lowMeaning: "The underlying play looks softer than the surface results.",
    },
    {
      key: "scheduleImpact",
      label: "Schedule Impact",
      value: qualification.breakdown.scheduleAdjustedStrength,
      mode: "signed",
      formulaLabel: "How it's scored",
      formula:
        "Uses partner strength, opponent strength, carry risk, inflation risk, and hard-schedule credit.",
      highLabel: "High means",
      highMeaning: "The team still holds up after schedule correction.",
      lowLabel: "Low means",
      lowMeaning: "Easy matches or strong partners may be lifting the record.",
    },
    {
      key: "scoring",
      label: "Scoring Ability",
      value: qualification.breakdown.scoringStrength,
      mode: "signed",
      formulaLabel: "How it's scored",
      formula:
        "Uses clean scoring, auto, endgame, scoring ceiling, and component-level scoring distribution.",
      highLabel: "High means",
      highMeaning: "The team can generate points across multiple parts of the match.",
      lowLabel: "Low means",
      lowMeaning: "Point generation is limited or too dependent on outside help.",
    },
    {
      key: "stability",
      label: "Stability",
      value: qualification.breakdown.stabilityStrength,
      mode: "signed",
      formulaLabel: "How it's scored",
      formula:
        "Uses match-to-match consistency, scoring floor, margin stability, and volatility penalties.",
      highLabel: "High means",
      highMeaning: "The baseline shows up repeatedly and the floor stays firm.",
      lowLabel: "Low means",
      lowMeaning: "The profile swings a lot from match to match.",
    },
    {
      key: "ceiling",
      label: "Team Ceiling",
      value: qualification.breakdown.ceilingStrength,
      mode: "signed",
      formulaLabel: "How it's scored",
      formula:
        "Uses single-match ceiling, score potential, margin upside, plus auto and endgame burst.",
      highLabel: "High means",
      highMeaning: "The best-case matches are genuinely dangerous.",
      lowLabel: "Low means",
      lowMeaning: "The team tends to top out early.",
    },
    {
      key: "confidence",
      label: "Data Confidence",
      value: qualification.confidence,
      mode: "unsigned",
      formulaLabel: "How it's scored",
      formula:
        "Uses match count, rankings coverage, OPR/COPR presence, score breakdown coverage, and status completeness.",
      highLabel: "High means",
      highMeaning: "The sample is healthy and the score is more trustworthy.",
      lowLabel: "Low means",
      lowMeaning: "The data is still thin or incomplete.",
    },
  ];
}

function getPlayoffSampleCompleteness(team: TeamScore): number | null {
  const playoff = team.playoff;

  if (!playoff) {
    return null;
  }

  if (playoff.isComplete) {
    return 1;
  }

  return clamp(
    playoff.matchesPlayed / 4 +
      (playoff.seed !== null ? 0.12 : 0) +
      (playoff.positionCode ? 0.08 : 0),
    0,
    1,
  );
}

function getPlayoffMetrics(
  team: TeamScore,
  locale: Locale,
): BreakdownMetric[] {
  const playoff = team.playoff;

  if (locale === "zh-TW") {
    return [
      {
        key: "allianceResult",
        label: "聯盟成績",
        value: playoff?.breakdown.advancementStrength ?? null,
        mode: "signed",
        formulaLabel: "怎麼算",
        formula: "看聯盟走多深、淘汰賽戰績和最終停在哪一輪。",
        highLabel: "高分代表",
        highMeaning: "聯盟真的有走深，不只是進場而已。",
        lowLabel: "低分代表",
        lowMeaning: "聯盟很早出局，或結果沒什麼深度。",
      },
      {
        key: "allianceControl",
        label: "聯盟壓制力",
        value: playoff?.breakdown.allianceControl ?? null,
        mode: "signed",
        formulaLabel: "怎麼算",
        formula: "看淘汰賽勝率和平均分差，判斷聯盟是不是靠內容壓住對手。",
        highLabel: "高分代表",
        highMeaning: "聯盟能穩穩贏，不只是險勝。",
        lowLabel: "低分代表",
        lowMeaning: "聯盟抗壓不夠，內容沒有把對手壓住。",
      },
      {
        key: "seedEdge",
        label: "種子優勢",
        value: playoff?.breakdown.seedStrength ?? null,
        mode: "signed",
        formulaLabel: "怎麼算",
        formula: "主要看聯盟種子本身的位置，高種子分數自然比較高。",
        highLabel: "高分代表",
        highMeaning: "這組聯盟本來就握有不錯的種子優勢。",
        lowLabel: "低分代表",
        lowMeaning: "這組聯盟一開始就不是靠高種子進場。",
      },
      {
        key: "overperform",
        label: "超常發揮",
        value: playoff?.breakdown.upsetStrength ?? null,
        mode: "signed",
        formulaLabel: "怎麼算",
        formula: "看聯盟最後走多深，有沒有超過原本種子應該打到的位置。",
        highLabel: "高分代表",
        highMeaning: "聯盟有打穿預期，屬於超額演出。",
        lowLabel: "低分代表",
        lowMeaning: "聯盟沒有打到種子該有的深度，甚至低於預期。",
      },
      {
        key: "sampleCompleteness",
        label: "樣本完整度",
        value: getPlayoffSampleCompleteness(team),
        mode: "unsigned",
        formulaLabel: "怎麼算",
        formula: "看淘汰賽打了幾場、聯盟資訊是否到位，以及聯盟故事有沒有封盤。",
        highLabel: "高分代表",
        highMeaning: "淘汰賽輪廓已經差不多完整。",
        lowLabel: "低分代表",
        lowMeaning: "樣本還薄，聯盟故事還沒講完。",
      },
      {
        key: "confidence",
        label: "資料信心",
        value: playoff?.confidence ?? null,
        mode: "unsigned",
        formulaLabel: "怎麼算",
        formula: "看淘汰賽資料完整度、樣本量和聯盟狀態是否已經關帳。",
        highLabel: "高分代表",
        highMeaning: "淘汰賽評分已經很穩。",
        lowLabel: "低分代表",
        lowMeaning: "淘汰賽資料還太少，先別太武斷。",
      },
    ];
  }

  return [
    {
      key: "allianceResult",
      label: "Alliance Result",
      value: playoff?.breakdown.advancementStrength ?? null,
      mode: "signed",
      formulaLabel: "How it's scored",
      formula:
        "Built from playoff depth, playoff record, and where the alliance actually finished.",
      highLabel: "High means",
      highMeaning: "The alliance really made a deep run.",
      lowLabel: "Low means",
      lowMeaning: "The alliance exited early or never built real depth.",
    },
    {
      key: "allianceControl",
      label: "Alliance Control",
      value: playoff?.breakdown.allianceControl ?? null,
      mode: "signed",
      formulaLabel: "How it's scored",
      formula:
        "Uses playoff win rate and average margin to judge how much the alliance controlled matches.",
      highLabel: "High means",
      highMeaning: "The alliance was winning with real control.",
      lowLabel: "Low means",
      lowMeaning: "The alliance was not imposing itself on the bracket.",
    },
    {
      key: "seedEdge",
      label: "Seed Edge",
      value: playoff?.breakdown.seedStrength ?? null,
      mode: "signed",
      formulaLabel: "How it's scored",
      formula: "Mostly reflects the alliance seed itself. High seeds start higher here.",
      highLabel: "High means",
      highMeaning: "The alliance started with a strong seed advantage.",
      lowLabel: "Low means",
      lowMeaning: "The alliance did not enter from a privileged seed.",
    },
    {
      key: "overperform",
      label: "Overperform",
      value: playoff?.breakdown.upsetStrength ?? null,
      mode: "signed",
      formulaLabel: "How it's scored",
      formula:
        "Compares how far the alliance went against what the seed would normally suggest.",
      highLabel: "High means",
      highMeaning: "The alliance outperformed expectation.",
      lowLabel: "Low means",
      lowMeaning: "The alliance came in below what the seed suggested.",
    },
    {
      key: "sampleCompleteness",
      label: "Sample Completeness",
      value: getPlayoffSampleCompleteness(team),
      mode: "unsigned",
      formulaLabel: "How it's scored",
      formula:
        "Uses number of playoff matches, alliance metadata, and whether the bracket story is already closed.",
      highLabel: "High means",
      highMeaning: "The playoff picture is mostly complete.",
      lowLabel: "Low means",
      lowMeaning: "The sample is still thin and the story is unfinished.",
    },
    {
      key: "confidence",
      label: "Data Confidence",
      value: playoff?.confidence ?? null,
      mode: "unsigned",
      formulaLabel: "How it's scored",
      formula:
        "Uses playoff sample size, data completeness, and whether alliance status is already closed out.",
      highLabel: "High means",
      highMeaning: "The playoff score is already fairly stable.",
      lowLabel: "Low means",
      lowMeaning: "There is still too little playoff evidence.",
    },
  ];
}

export function TeamBreakdownDashboard({
  team,
  locale,
  analysisTab,
  isEventFinished,
}: TeamBreakdownDashboardProps) {
  const metrics =
    analysisTab === "playoff"
      ? getPlayoffMetrics(team, locale)
      : getQualificationMetrics(team, locale);
  const takeaways = buildTeamInsights(team, locale, analysisTab, isEventFinished).slice(1, 3);
  const [openMetricKey, setOpenMetricKey] = useState<string | null>(null);
  const trackCaption =
    locale === "zh-TW"
      ? analysisTab === "playoff"
        ? "中線右側代表聯盟這項內容更站得住。"
        : "中線右側代表這項內容更硬。"
      : analysisTab === "playoff"
        ? "Right of center means stronger playoff context."
        : "Right of center means a stronger profile in that area.";
  const infoButtonLabel =
    locale === "zh-TW" ? "查看這項評分說明" : "Open scoring explanation";

  return (
    <div className={styles.dashboard}>
      <div className={styles.metricGrid}>
        {metrics.map((metric) => {
          const isOpen = openMetricKey === metric.key;

          return (
            <div key={`${analysisTab}-${metric.key}`} className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <div className={styles.metricTitleRow}>
                  <span className={styles.metricLabel}>{metric.label}</span>
                  <button
                    type="button"
                    className={styles.infoButton}
                    aria-expanded={isOpen}
                    aria-label={infoButtonLabel}
                    onClick={() =>
                      setOpenMetricKey((current) =>
                        current === metric.key ? null : metric.key,
                      )
                    }
                  >
                    i
                  </button>
                </div>
                <strong className={styles.metricValue}>
                  {metric.mode === "unsigned"
                    ? formatUnsignedMetric(metric.value)
                    : formatSignedMetric(metric.value)}
                </strong>
              </div>

              {metric.mode === "unsigned" ? (
                <div className={styles.unsignedTrack} aria-hidden="true">
                  <span
                    className={styles.unsignedFill}
                    style={{ width: getUnsignedTrackWidth(metric.value) }}
                  />
                </div>
              ) : (
                <div className={styles.signedTrack} aria-hidden="true">
                  <span className={styles.signedCenter} />
                  {(metric.value ?? 0) < 0 ? (
                    <span
                      className={styles.signedNegative}
                      style={{ width: getSignedTrackWidth(metric.value) }}
                    />
                  ) : (
                    <span
                      className={styles.signedPositive}
                      style={{ width: getSignedTrackWidth(metric.value) }}
                    />
                  )}
                </div>
              )}

              {isOpen ? (
                <div className={styles.infoPanel}>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>{metric.formulaLabel}</span>
                    <span className={styles.infoText}>{metric.formula}</span>
                  </div>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>{metric.highLabel}</span>
                    <span className={styles.infoText}>{metric.highMeaning}</span>
                  </div>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>{metric.lowLabel}</span>
                    <span className={styles.infoText}>{metric.lowMeaning}</span>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className={styles.trackCaption}>{trackCaption}</div>

      {takeaways.length ? (
        <div className={styles.takeaways}>
          {takeaways.map((takeaway, index) => (
            <div
              key={`${team.teamKey}-${analysisTab}-takeaway-${index}`}
              className={styles.takeaway}
            >
              {takeaway}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
