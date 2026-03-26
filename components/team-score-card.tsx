"use client";

import type { CSSProperties } from "react";

import { getDictionary } from "@/lib/i18n";
import {
  buildRelativeComparisonText,
  buildTeamSummary,
  formatConfidence,
  formatRecord,
  formatSignedScore,
  getCategoryTheme,
} from "@/lib/presenters";
import type { Locale, ScoreCategory, TeamScore } from "@/lib/types";

import { ScoreGauge } from "@/components/score-gauge";
import styles from "@/components/team-score-card.module.css";

type TeamScoreCardProps = {
  team: TeamScore;
  locale: Locale;
  displayedScore: number;
  displayedCategory: ScoreCategory;
  isReference: boolean;
  referenceTeam: TeamScore | null;
  useRelativeMode: boolean;
};

export function TeamScoreCard({
  team,
  locale,
  displayedScore,
  displayedCategory,
  isReference,
  referenceTeam,
  useRelativeMode,
}: TeamScoreCardProps) {
  const dictionary = getDictionary(locale);
  const theme = getCategoryTheme(displayedCategory);
  const categoryLabel = dictionary.categories[displayedCategory];
  const caption = dictionary.categoryCaptions[displayedCategory];
  const summary = buildTeamSummary(team, locale);
  const rankText = team.ranking
    ? `${dictionary.rankLabel} #${team.ranking.rank}`
    : dictionary.unrankedLabel;
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
      <div className={styles.top}>
        <div className={styles.identity}>
          <div className={styles.chipRow}>
            <span className={styles.rankChip}>{rankText}</span>
            {isReference ? (
              <span className={styles.referenceChip}>
                {dictionary.referenceBadge}
              </span>
            ) : null}
          </div>

          <div className={styles.teamNumber}>#{team.teamNumber}</div>
          <div className={styles.teamName}>{team.teamName}</div>
        </div>

        <div className={styles.gaugeWrap}>
          <ScoreGauge score={displayedScore} category={displayedCategory} />
        </div>
      </div>

      <div className={styles.tierPanel}>
        <div className={styles.tierLabel}>{categoryLabel}</div>
        <div className={styles.tierCaption}>{caption}</div>
        {relativeLine ? (
          <div className={styles.relativeLine}>{relativeLine}</div>
        ) : null}
        {useRelativeMode ? (
          <div className={styles.absoluteLine}>
            {dictionary.overallScoreLabel} {formatSignedScore(team.score)}
          </div>
        ) : null}
      </div>

      <p className={styles.summary}>{summary}</p>

      <div className={styles.metaRow}>
        <div className={styles.meta}>
          <span className={styles.metaLabel}>{dictionary.sampleMatchesLabel}</span>
          <strong className={styles.metaValue}>{team.sampleSize}</strong>
        </div>
        <div className={styles.meta}>
          <span className={styles.metaLabel}>{dictionary.recordLabel}</span>
          <strong className={styles.metaValue}>{formatRecord(team.record)}</strong>
        </div>
        <div className={styles.meta}>
          <span className={styles.metaLabel}>{dictionary.confidenceLabel}</span>
          <strong className={styles.metaValue}>
            {formatConfidence(team.confidence)}
          </strong>
        </div>
      </div>
    </article>
  );
}
