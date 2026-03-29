"use client";

import { memo, useState, type CSSProperties } from "react";

import { getDictionary } from "@/lib/i18n";
import { buildTeamInsights } from "@/lib/insights";
import {
  buildRelativeComparisonText,
  formatConfidence,
  formatNumber,
  formatRecord,
  formatSignedScore,
  formatMetaList,
  getCategoryTheme,
  getPlayoffPositionText,
} from "@/lib/presenters";
import type { AnalysisTab, Locale, ScoreCategory, TeamScore } from "@/lib/types";

import { ScoreGauge } from "@/components/score-gauge";
import styles from "@/components/team-score-card.module.css";

type TeamScoreCardProps = {
  team: TeamScore;
  locale: Locale;
  analysisTab: AnalysisTab;
  displayedScore: number;
  displayedCategory: ScoreCategory;
  isPinned: boolean;
  isReference: boolean;
  referenceTeam: TeamScore | null;
  useRelativeMode: boolean;
  isEventFinished: boolean;
};

function TeamScoreCardComponent({
  team,
  locale,
  analysisTab,
  displayedScore,
  displayedCategory,
  isPinned,
  isReference,
  referenceTeam,
  useRelativeMode,
  isEventFinished,
}: TeamScoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dictionary = getDictionary(locale);
  const theme = getCategoryTheme(displayedCategory);
  const rankingScoreLabel = locale === "zh-TW" ? "排名分" : "Ranking Score";
  const totalRankingPointsLabel =
    locale === "zh-TW" ? "總排名分" : "Total Ranking Points";
  const currentScore =
    analysisTab === "playoff" ? team.playoff?.score ?? 0 : team.qualification.score;
  const currentLabel =
    analysisTab === "playoff"
      ? dictionary.playoffContextLabel
      : dictionary.qualificationStrengthLabel;
  const currentConfidence =
    analysisTab === "playoff"
      ? team.playoff?.confidence ?? 0
      : team.qualification.confidence;
  const relativeLine =
    useRelativeMode && referenceTeam
      ? buildRelativeComparisonText({
          locale,
          referenceTeamNumber: referenceTeam.teamNumber,
          displayedScore,
          isReference,
        })
      : null;
  const playoffPositionText = getPlayoffPositionText(locale, team.playoff);
  const topRightBadge =
    analysisTab === "qualification"
      ? team.ranking
        ? `#${team.ranking.rank}`
        : dictionary.unrankedLabel
      : team.playoff?.positionCode ??
        (team.playoff?.seed ? `#${team.playoff.seed}` : dictionary.noPlayoffDataLabel);
  const detailMeta =
    analysisTab === "playoff"
      ? formatMetaList([
          team.playoff?.positionCode,
          playoffPositionText,
          team.playoff ? formatRecord(team.playoff.record) : null,
        ])
      : formatMetaList([
          team.ranking ? `${dictionary.rankLabel} #${team.ranking.rank}` : dictionary.unrankedLabel,
          formatRecord(team.qualification.record),
          `${dictionary.confidenceLabel} ${formatConfidence(team.qualification.confidence)}`,
          team.qualification.rankingScore !== null
            ? `${rankingScoreLabel} ${formatNumber(team.qualification.rankingScore)}`
            : null,
          team.qualification.totalRankingPoints !== null
            ? `${totalRankingPointsLabel} ${formatNumber(team.qualification.totalRankingPoints)}`
            : null,
        ]);
  const cssVars = {
    "--accent": theme.accent,
    "--tint": theme.tint,
    "--border": theme.border,
    "--glow": theme.glow,
    "--text-strong": theme.text,
  } as CSSProperties;

  return (
    <article
      className={[
        styles.card,
        isReference ? styles.cardReference : "",
        isPinned ? styles.cardPinned : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={cssVars}
    >
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((value) => !value)}
      >
        <div className={styles.headerRow}>
          <div className={styles.identity}>
            <div className={styles.teamNumber}>#{team.teamNumber}</div>
            <div className={styles.nameBlock}>
              <div className={styles.teamName}>{team.teamName}</div>
              {analysisTab === "playoff" && team.playoff?.positionCode ? (
                <div className={styles.inlineMeta}>
                  <span className={styles.slotChip}>{team.playoff.positionCode}</span>
                  {playoffPositionText ? (
                    <span className={styles.slotText}>{playoffPositionText}</span>
                  ) : null}
                  {team.playoff.isBackup ? (
                    <span className={styles.backupChip}>{dictionary.backupLabel}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.rankBadge}>{topRightBadge}</div>
        </div>

        <div className={styles.mainRow}>
          <div className={styles.gaugeWrap}>
            <ScoreGauge score={displayedScore} category={displayedCategory} />
          </div>

          <div className={styles.summaryPanel}>
            <div className={styles.categoryRow}>
              <div className={styles.tierLabel}>
                {dictionary.categories[displayedCategory]}
              </div>
              {isPinned ? (
                <span className={styles.pinnedMarker}>{dictionary.pinnedBadge}</span>
              ) : null}
            </div>

            <div className={styles.scoreRow}>
              <span className={styles.scoreLabel}>
                {useRelativeMode ? dictionary.relativeScoreLabel : currentLabel}
              </span>
              <strong className={styles.scoreValue}>
                {formatSignedScore(displayedScore)}
              </strong>
            </div>

            {relativeLine ? (
              <div className={styles.relativeLine}>{relativeLine}</div>
            ) : null}
            {useRelativeMode ? (
              <div className={styles.absoluteLine}>
                {currentLabel} {formatSignedScore(currentScore)}
              </div>
            ) : null}

            <div className={styles.metricsRow}>
              <div className={styles.metric}>
                <span>{dictionary.recordShortLabel}</span>
                <strong>
                  {formatRecord(
                    analysisTab === "playoff" && team.playoff
                      ? team.playoff.record
                      : team.qualification.record,
                  )}
                </strong>
              </div>
              <div className={styles.metric}>
                <span>{dictionary.confidenceShortLabel}</span>
                <strong>{formatConfidence(currentConfidence)}</strong>
              </div>
              <div className={`${styles.metric} ${styles.metricFull}`.trim()}>
                <span>{rankingScoreLabel}</span>
                <strong>{formatNumber(team.qualification.rankingScore)}</strong>
              </div>
            </div>

            <div className={styles.toggleHint}>
              {isExpanded
                ? dictionary.collapseDetailsLabel
                : dictionary.expandDetailsLabel}
            </div>
          </div>
        </div>
      </button>

      <div
        className={`${styles.detailsShell} ${isExpanded ? styles.detailsShellExpanded : ""}`.trim()}
      >
        {isExpanded ? (
          <div className={styles.detailsInner}>
            <div className={styles.detailsHeader}>
              <div className={styles.detailsTitle}>{dictionary.scoutingNotesLabel}</div>
              <div className={styles.detailsConfidence}>
                {dictionary.confidenceLabel} {formatConfidence(currentConfidence)}
              </div>
            </div>

            <div className={styles.detailsMeta}>{detailMeta}</div>

            <ol className={styles.analysisList}>
              {buildTeamInsights(team, locale, analysisTab, isEventFinished).map(
                (insight, index) => (
                  <li
                    key={`${team.teamKey}-${analysisTab}-${index}`}
                    className={styles.analysisItem}
                  >
                    {insight}
                  </li>
                ),
              )}
            </ol>

            {analysisTab === "playoff" ? (
              <div className={styles.detailsFoot}>{dictionary.playoffAllianceNote}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export const TeamScoreCard = memo(TeamScoreCardComponent);
