"use client";

import { getDictionary } from "@/lib/i18n";
import type { EventSummary, Locale } from "@/lib/types";

import styles from "@/components/event-progress.module.css";

type EventProgressProps = {
  event: EventSummary;
  locale: Locale;
};

export function EventProgress({ event, locale }: EventProgressProps) {
  const dictionary = getDictionary(locale);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.label}>{dictionary.progressLabel}</div>
          <div className={styles.stage}>
            {dictionary.progressStages[event.progress.stage]}
          </div>
        </div>
        <div className={styles.percent}>{event.progress.percent}%</div>
      </div>

      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${event.progress.percent}%` }}
        />
      </div>

      <div className={styles.meta}>
        <span>
          {dictionary.qualificationMatchesLabel}: {event.qualificationMatches}
        </span>
        <span>
          {dictionary.playoffMatchesLabel}: {event.playoffMatches}
        </span>
      </div>
    </div>
  );
}
