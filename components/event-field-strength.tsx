"use client";

import { getFieldDistributionEntries, getFieldStrengthReview, getFieldStrengthSummary } from "@/lib/event-field-strength-copy";
import { getCategoryTheme } from "@/lib/presenters";
import type { EventSummary, Locale, ScoreCategory } from "@/lib/types";

import styles from "@/components/event-field-strength.module.css";

type EventFieldStrengthProps = {
  event: EventSummary;
  locale: Locale;
};

export function EventFieldStrength({ event, locale }: EventFieldStrengthProps) {
  const labels =
    locale === "zh-TW"
      ? {
          title: "賽區概況",
          distribution: "區段比例",
          review: "完賽總評",
        }
      : {
          title: "Field Snapshot",
          distribution: "Distribution",
          review: "Finished Review",
        };
  const categoryLabels: Record<ScoreCategory, string> =
    locale === "zh-TW"
      ? {
          grandpa: "爺爺",
          father: "爸爸",
          peer: "平輩",
          son: "兒子",
          grandson: "孫子",
        }
      : {
          grandpa: "Grandpa",
          father: "Father",
          peer: "Peer",
          son: "Son",
          grandson: "Grandson",
        };
  const summary = getFieldStrengthSummary(locale, event);
  const review = event.isFinished ? getFieldStrengthReview(locale, event) : [];
  const distributionEntries = getFieldDistributionEntries(categoryLabels, event);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.label}>{labels.title}</div>
      </div>

      <p className={styles.summary}>{summary}</p>

      <div className={styles.distributionLabel}>{labels.distribution}</div>
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
          <div className={styles.reviewLabel}>{labels.review}</div>
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
