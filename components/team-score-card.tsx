"use client";

import type { CSSProperties } from "react";

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
  const insights = buildTeamInsights(team, locale);
  const rankText = team.ranking
    ? `${dictionary.rankLabel} #${team.ranking.rank}`
    : dictionary.unrankedLabel;
  const qualificationMeta = formatMetaList([
    team.ranking ? `${dictionary.rankLabel} #${team.ranking.rank}` : dictionary.unrankedLabel,
    formatRecord(team.qualification.record),
    formatPercent(team.qualification.winRate),
  ]);
  const playoffMeta = team.playoff
    ? formatMetaList([
        team.playoff.seed ? `${dictionary.seedLabel} #${team.playoff.seed}` : null,
        getPlayoffAdvancementLabel(locale, team.playoff.advancement),
        team.playoff.matchesPlayed > 0 ? formatRecord(team.playoff.record) : null,
      ])
    : null;
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
            <span className={styles.confidenceChip}>
              {dictionary.confidenceLevelLabel}{" "}
              {getConfidenceLevelLabel(locale, team.confidenceLevel)}
            </span>
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
        <div className={styles.tierMain}>
          <div className={styles.tierLabel}>{categoryLabel}</div>
          <div className={styles.tierCaption}>{caption}</div>
        </div>

        <div className={styles.scoreStack}>
          <div className={styles.scoreRow}>
            <span className={styles.scoreLabel}>
              {useRelativeMode
                ? dictionary.relativeScoreLabel
                : dictionary.overallScoreLabel}
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
              {dictionary.overallScoreLabel} {formatSignedScore(team.score)}
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.sectionGrid}>
        <section className={styles.sectionCard}>
          <span className={styles.sectionLabel}>
            {dictionary.qualificationStrengthLabel}
          </span>
          <div className={styles.sectionValue}>
            {formatSignedScore(team.qualification.score)}
          </div>
          <div className={styles.sectionMeta}>{qualificationMeta}</div>
          <div className={styles.sectionFoot}>
            {dictionary.sampleMatchesLabel} {team.qualification.matchesPlayed}
          </div>
        </section>

        <section className={styles.sectionCard}>
          <span className={styles.sectionLabel}>
            {dictionary.playoffContextLabel}
          </span>
          <div className={styles.sectionValue}>
            {team.playoff?.score !== null && team.playoff
              ? formatSignedScore(team.playoff.score)
              : team.playoff?.seed
                ? `${dictionary.seedLabel} #${team.playoff.seed}`
                : dictionary.noPlayoffDataLabel}
          </div>
          <div className={styles.sectionMeta}>
            {team.playoff
              ? playoffMeta ?? dictionary.noPlayoffMatchesYet
              : dictionary.noPlayoffDataLabel}
          </div>
          <div className={styles.sectionFoot}>{dictionary.playoffAllianceNote}</div>
        </section>
      </div>

      <div className={styles.summaryBlock}>
        {insights.map((insight, index) => (
          <p key={`${team.teamKey}-${index}`} className={styles.summary}>
            {insight}
          </p>
        ))}
      </div>

      <div className={styles.metaRow}>
        <div className={styles.meta}>
          <span className={styles.metaLabel}>{dictionary.confidenceLabel}</span>
          <strong className={styles.metaValue}>{formatConfidence(team.confidence)}</strong>
        </div>
        <div className={styles.meta}>
          <span className={styles.metaLabel}>{dictionary.recordLabel}</span>
          <strong className={styles.metaValue}>{formatRecord(team.record)}</strong>
        </div>
        <div className={styles.meta}>
          <span className={styles.metaLabel}>
            {dictionary.playoffMatchesLabel}
          </span>
          <strong className={styles.metaValue}>
            {team.playoff?.matchesPlayed ?? 0}
          </strong>
        </div>
      </div>
    </article>
  );
}
