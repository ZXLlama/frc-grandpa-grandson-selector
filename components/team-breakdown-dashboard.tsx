"use client";

import { clamp } from "@/lib/constants";
import { buildTeamInsights } from "@/lib/insights";
import type { AnalysisTab, Locale, TeamScore } from "@/lib/types";

import styles from "@/components/team-breakdown-dashboard.module.css";

type MetricMode = "signed" | "unsigned";

type BreakdownMetric = {
  label: string;
  value: number | null;
  mode: MetricMode;
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
      { label: "排位表現", value: qualification.breakdown.resumeStrength, mode: "signed" },
      { label: "真實實力", value: qualification.breakdown.underlyingStrength, mode: "signed" },
      { label: "賽程影響", value: qualification.breakdown.scheduleAdjustedStrength, mode: "signed" },
      { label: "得分能力", value: qualification.breakdown.scoringStrength, mode: "signed" },
      { label: "穩定度", value: qualification.breakdown.stabilityStrength, mode: "signed" },
      { label: "隊伍上限", value: qualification.breakdown.ceilingStrength, mode: "signed" },
      { label: "資料信心", value: qualification.confidence, mode: "unsigned" },
    ];
  }

  return [
    { label: "Ranking Form", value: qualification.breakdown.resumeStrength, mode: "signed" },
    { label: "True Strength", value: qualification.breakdown.underlyingStrength, mode: "signed" },
    { label: "Schedule Impact", value: qualification.breakdown.scheduleAdjustedStrength, mode: "signed" },
    { label: "Scoring Ability", value: qualification.breakdown.scoringStrength, mode: "signed" },
    { label: "Stability", value: qualification.breakdown.stabilityStrength, mode: "signed" },
    { label: "Ceiling", value: qualification.breakdown.ceilingStrength, mode: "signed" },
    { label: "Data Confidence", value: qualification.confidence, mode: "unsigned" },
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
      { label: "聯盟成績", value: playoff?.breakdown.advancementStrength ?? null, mode: "signed" },
      { label: "聯盟壓制力", value: playoff?.breakdown.allianceControl ?? null, mode: "signed" },
      { label: "種子優勢", value: playoff?.breakdown.seedStrength ?? null, mode: "signed" },
      { label: "超常發揮", value: playoff?.breakdown.upsetStrength ?? null, mode: "signed" },
      { label: "樣本完整度", value: getPlayoffSampleCompleteness(team), mode: "unsigned" },
      { label: "資料信心", value: playoff?.confidence ?? null, mode: "unsigned" },
    ];
  }

  return [
    { label: "Alliance Result", value: playoff?.breakdown.advancementStrength ?? null, mode: "signed" },
    { label: "Alliance Control", value: playoff?.breakdown.allianceControl ?? null, mode: "signed" },
    { label: "Seed Edge", value: playoff?.breakdown.seedStrength ?? null, mode: "signed" },
    { label: "Overperform", value: playoff?.breakdown.upsetStrength ?? null, mode: "signed" },
    { label: "Sample Completeness", value: getPlayoffSampleCompleteness(team), mode: "unsigned" },
    { label: "Data Confidence", value: playoff?.confidence ?? null, mode: "unsigned" },
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
  const trackCaption =
    locale === "zh-TW"
      ? analysisTab === "playoff"
        ? "中線右側代表聯盟更站得住。"
        : "中線右側代表這項內容更硬。"
      : analysisTab === "playoff"
        ? "Right of center means stronger playoff context."
        : "Right of center means a stronger profile in that area.";

  return (
    <div className={styles.dashboard}>
      <div className={styles.metricGrid}>
        {metrics.map((metric) => (
          <div key={`${analysisTab}-${metric.label}`} className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>{metric.label}</span>
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
          </div>
        ))}
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
