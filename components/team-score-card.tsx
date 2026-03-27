"use client";

import { useState, type CSSProperties } from "react";

import {
  getConfidenceLevelLabel,
  getDictionary,
  getPlayoffAdvancementLabel,
} from "@/lib/i18n";
import { buildTeamInsights } from "@/lib/insights";
import {
  buildRelativeComparisonText,
  formatConfidence,
  formatPercent,
  formatRecord,
  formatSignedScore,
  formatMetaList,
  getCategoryTheme,
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
  isReference: boolean;
  referenceTeam: TeamScore | null;
  useRelativeMode: boolean;
};

export function TeamScoreCard({
  team,
  locale,
  analysisTab,
  displayedScore,
  displayedCategory,
  isReference,
  referenceTeam,
  useRelativeMode,
}: TeamScoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dictionary = getDictionary(locale);
  const theme = getCategoryTheme(displayedCategory);
  const insights = buildTeamInsights(team, locale, analysisTab);
  const currentScore =
    analysisTab === "playoff" ? team.playoff?.score ?? 0 : team.qualification.score;
  const currentLabel =
    analysisTab === "playoff"
      ? dictionary.playoffContextLabel
      : dictionary.qualificationStrengthLabel;
  const detailMeta =
    analysisTab === "playoff"
      ? formatMetaList([
          team.playoff?.seed ? `${dictionary.seedLabel} #${team.playoff.seed}` : null,
          team.playoff
            ? getPlayoffAdvancementLabel(locale, team.playoff.advancement)
            : null,
          team.playoff?.matchesPlayed ? formatRecord(team.playoff.record) : null,
        ])
      : formatMetaList([
          team.ranking ? `${dictionary.rankLabel} #${team.ranking.rank}` : dictionary.unrankedLabel,
          formatRecord(team.qualification.record),
          formatPercent(team.qualification.winRate),
        ]);
  const currentConfidence =
    analysisTab === "playoff"
      ? team.playoff?.confidence ?? 0
      : team.qualification.confidence;
  const currentConfidenceLevel =
    analysisTab === "playoff"
      ? team.playoff?.confidenceLevel ?? team.confidenceLevel
      : team.qualification.confidenceLevel;
  const relativeLine =
    useRelativeMode && referenceTeam
      ? buildRelativeComparisonText({
          locale,
          referenceTeamNumber: referenceTeam.teamNumber,
          displayedScore,
          isReference,
        })
      : null;
  const cssVars = {
    "--accent": theme.accent,
    "--tint": theme.tint,
    "--border": theme.border,
    "--glow": theme.glow,
    "--text-strong": theme.text,
  } as CSSProperties;

  return (
    <article
      className={`${styles.card} ${isReference ? styles.cardReference : ""}`.trim()}
      style={cssVars}
    >
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((value) => !value)}
      >
        <div className={styles.badgeRow}>
          {isReference ? (
            <span className={styles.referenceChip}>{dictionary.referenceBadge}</span>
          ) : null}
          {analysisTab === "playoff" && team.playoff?.isBackup ? (
            <span className={styles.backupChip}>{dictionary.backupLabel}</span>
          ) : null}
        </div>

        <div className={styles.top}>
          <div className={styles.identity}>
            <div className={styles.teamNumber}>#{team.teamNumber}</div>
            <div className={styles.teamName}>{team.teamName}</div>
          </div>

          <div className={styles.gaugeWrap}>
            <ScoreGauge score={displayedScore} category={displayedCategory} />
          </div>
        </div>

        <div className={styles.tierPanel}>
          <div className={styles.tierLabel}>
            {dictionary.categories[displayedCategory]}
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
          <div className={styles.toggleHint}>
            {isExpanded
              ? dictionary.collapseDetailsLabel
              : dictionary.expandDetailsLabel}
          </div>
        </div>
      </button>

      <div
        className={`${styles.detailsShell} ${isExpanded ? styles.detailsShellExpanded : ""}`.trim()}
      >
        <div className={styles.detailsInner}>
          <div className={styles.detailsHeader}>
            <div className={styles.detailsTitle}>{dictionary.scoutingNotesLabel}</div>
            <div className={styles.detailsConfidence}>
              {dictionary.confidenceLabel} {formatConfidence(currentConfidence)} ·{" "}
              {getConfidenceLevelLabel(locale, currentConfidenceLevel)}
            </div>
          </div>

          <div className={styles.detailsMeta}>{detailMeta}</div>

          <div className={styles.summaryBlock}>
            {insights.map((insight, index) => (
              <p key={`${team.teamKey}-${analysisTab}-${index}`} className={styles.summary}>
                {insight}
              </p>
            ))}
          </div>

          {analysisTab === "playoff" ? (
            <div className={styles.detailsFoot}>{dictionary.playoffAllianceNote}</div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
