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
  const labels =
    locale === "zh-TW"
      ? {
          overall: "整體進度",
          qualification: "積分賽完成度",
          playoff: "淘汰賽完成度",
          total: "已回傳場次",
          notStarted: "尚未開始",
          notApplicable: "不適用",
          stageNote:
            event.progress.stage === "finished"
              ? "資料基本齊了，現在看整體輪廓會比看短期波動更準。"
              : event.progress.stage === "playoffs"
                ? "淘汰賽已經介入，之後的判讀要更重視聯盟脈絡。"
                : event.progress.stage === "qualificationMidLate"
                  ? "積分賽樣本已經夠厚，多數隊伍的真實輪廓開始浮出來。"
                  : "現在還在前段，名次和戰績都還很容易被賽程推著跑。",
        }
      : {
          overall: "Overall Progress",
          qualification: "Qualification Coverage",
          playoff: "Playoff Coverage",
          total: "Reported Matches",
          notStarted: "Not started",
          notApplicable: "N/A",
          stageNote:
            event.progress.stage === "finished"
              ? "The dataset is basically complete, so the field read is now more trustworthy than early-match noise."
              : event.progress.stage === "playoffs"
                ? "Elims are active now, so alliance context matters more than raw qualification snapshots."
                : event.progress.stage === "qualificationMidLate"
                  ? "Qualification volume is thick enough that most teams are starting to look like themselves."
                  : "This is still early, so rank and record are both vulnerable to schedule noise.",
        };
  const qualificationPercent =
    event.progress.qualificationCompletion === null
      ? labels.notApplicable
      : `${Math.round(event.progress.qualificationCompletion * 100)}%`;
  const playoffPercent =
    event.progress.playoffCompletion === null
      ? labels.notStarted
      : `${Math.round(event.progress.playoffCompletion * 100)}%`;

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

      <div className={styles.snapshotGrid}>
        <div className={styles.snapshot}>
          <span>{labels.qualification}</span>
          <strong>{qualificationPercent}</strong>
        </div>
        <div className={styles.snapshot}>
          <span>{labels.playoff}</span>
          <strong>{playoffPercent}</strong>
        </div>
        <div className={styles.snapshot}>
          <span>{labels.total}</span>
          <strong>{event.completedMatches}</strong>
        </div>
      </div>

      <p className={styles.note}>{labels.stageNote}</p>

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
