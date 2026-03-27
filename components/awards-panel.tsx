"use client";

import {
  getDictionary,
  getQualifierReasonLabel,
} from "@/lib/i18n";
import type { EventAwardsSummary, Locale } from "@/lib/types";

import styles from "@/components/awards-panel.module.css";

type AwardsPanelProps = {
  awards: EventAwardsSummary;
  locale: Locale;
};

export function AwardsPanel({ awards, locale }: AwardsPanelProps) {
  const dictionary = getDictionary(locale);

  return (
    <div className={styles.wrapper}>
      <section className={styles.card}>
        <div className={styles.title}>{dictionary.championshipQualifiersTitle}</div>
        {awards.championshipQualifiers.length ? (
          <div className={styles.qualifierGrid}>
            {awards.championshipQualifiers.map((team) => (
              <article key={team.teamKey} className={styles.qualifierCard}>
                <div className={styles.qualifierNumber}>#{team.teamNumber}</div>
                <div className={styles.qualifierName}>{team.teamName}</div>
                <div className={styles.qualifierReasonLabel}>
                  {dictionary.qualifiedByLabel}
                </div>
                <div className={styles.qualifierReasons}>
                  {team.reasons.map((reason) =>
                    getQualifierReasonLabel(locale, reason),
                  ).join(" · ")}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>{dictionary.awardsUnavailableMessage}</div>
        )}
      </section>

      <section className={styles.card}>
        <div className={styles.title}>{dictionary.allAwardsTitle}</div>
        {awards.allAwards.length ? (
          <div className={styles.awardList}>
            {awards.allAwards.map((award) => (
              <article key={award.name} className={styles.awardItem}>
                <div className={styles.awardName}>{award.name}</div>
                {award.recipients.length ? (
                  <div className={styles.recipientList}>
                    {award.recipients.map((recipient, index) => (
                      <div
                        key={`${award.name}-${recipient.teamKey ?? recipient.awardee ?? index}`}
                        className={styles.recipient}
                      >
                        {recipient.teamNumber !== null ? (
                          <strong>#{recipient.teamNumber}</strong>
                        ) : null}{" "}
                        {recipient.teamName ?? recipient.awardee ?? dictionary.noAwardRecipients}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.empty}>{dictionary.noAwardRecipients}</div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>{dictionary.awardsUnavailableMessage}</div>
        )}
      </section>
    </div>
  );
}
