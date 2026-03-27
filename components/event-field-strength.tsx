"use client";

import { getDictionary, getEventTierLabel } from "@/lib/i18n";
import { getFieldDistributionEntries, getFieldStrengthReview, getFieldStrengthSummary } from "@/lib/event-field-strength-copy";
import { getCategoryTheme } from "@/lib/presenters";
import type { EventSummary, Locale } from "@/lib/types";

import styles from "@/components/event-field-strength.module.css";

type EventFieldStrengthProps = {
  event: EventSummary;
  locale: Locale;
};

export function EventFieldStrength({ event, locale }: EventFieldStrengthProps) {
  const dictionary = getDictionary(locale);
  const summary = getFieldStrengthSummary(locale, event);
  const review = event.isFinished ? getFieldStrengthReview(locale, event) : [];
  const distributionEntries = getFieldDistributionEntries(dictionary, event);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.label}>{dictionary.eventStrengthLabel}</div>
          <div className={styles.tier}>
            {getEventTierLabel(locale, event.fieldStrength.category)}
          </div>
        </div>
      </div>

      <p className={styles.summary}>{summary}</p>

      <div className={styles.distributionLabel}>
        {dictionary.fieldDistributionLabel}
      </div>
      <div className={styles.distributionBar} aria-hidden="true">
        {distributionEntries.map((entry) => {
          if (entry.ratio <= 0) {
            return null;
          }

          return (
            <span
              key={entry.category}
              className={styles.segment}
              style={{
                width: `${entry.ratio * 100}%`,
                background: getCategoryTheme(entry.category).accent,
              }}
            />
          );
        })}
      </div>

      <div className={styles.legend}>
        {distributionEntries.map((entry) => (
          <div key={entry.category} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: getCategoryTheme(entry.category).accent }}
            />
            <span className={styles.legendLabel}>{entry.label}</span>
            <strong className={styles.legendValue}>
              {Math.round(entry.ratio * 100)}%
            </strong>
          </div>
        ))}
      </div>

      {event.isFinished ? (
        <div className={styles.reviewBlock}>
          <div className={styles.reviewLabel}>{dictionary.finishedReviewLabel}</div>
          <div className={styles.reviewList}>
            {review.map((line, index) => (
              <p key={`${event.key}-review-${index}`} className={styles.reviewLine}>
                {line}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
