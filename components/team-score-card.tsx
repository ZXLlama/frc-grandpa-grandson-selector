"use client";

import type { CSSProperties } from "react";

import { getDictionary } from "@/lib/i18n";
import {
  buildTeamSummary,
  formatConfidence,
  formatRecord,
  getCategoryTheme,
} from "@/lib/presenters";
import type { Locale, TeamScore } from "@/lib/types";

import { ScoreGauge } from "@/components/score-gauge";
import styles from "@/components/team-score-card.module.css";

type TeamScoreCardProps = {
  team: TeamScore;
  locale: Locale;
};

export function TeamScoreCard({ team, locale }: TeamScoreCardProps) {
  const dictionary = getDictionary(locale);
  const theme = getCategoryTheme(team.category);
  const categoryLabel = dictionary.categories[team.category];
  const caption = dictionary.categoryCaptions[team.category];
  const summary = buildTeamSummary(team, locale);
  const cssVars = {
    "--accent": theme.accent,
    "--tint": theme.tint,
    "--border": theme.border,
    "--glow": theme.glow,
    "--text-strong": theme.text,
  } as CSSProperties;

  return (
    <article className={styles.card} style={cssVars}>
      <div className={styles.top}>
        <div className={styles.identity}>
          <div className={styles.teamNumber}>#{team.teamNumber}</div>
          <div className={styles.teamName}>{team.teamName}</div>
        </div>

        <div className={styles.gaugeWrap}>
          <ScoreGauge score={team.score} category={team.category} />
        </div>
      </div>

      <div className={styles.badgeRow}>
        <span className={styles.badge}>{categoryLabel}</span>
        <span className={styles.caption}>{caption}</span>
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
          <strong className={styles.metaValue}>{formatConfidence(team.confidence)}</strong>
        </div>
      </div>
    </article>
  );
}
