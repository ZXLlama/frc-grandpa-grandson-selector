"use client";

import type { Dictionary } from "@/lib/i18n";
import type { SortDirection, TeamSortKey } from "@/lib/types";

import styles from "@/components/team-sort-controls.module.css";

type TeamSortControlsProps = {
  dictionary: Dictionary;
  sortKey: TeamSortKey;
  sortDirection: SortDirection;
  onSortKeyChange: (value: TeamSortKey) => void;
  onSortDirectionChange: (value: SortDirection) => void;
};

export function TeamSortControls({
  dictionary,
  sortKey,
  sortDirection,
  onSortKeyChange,
  onSortDirectionChange,
}: TeamSortControlsProps) {
  return (
    <div className={styles.card}>
      <label className={styles.field}>
        <span className={styles.label}>{dictionary.sortByLabel}</span>
        <select
          className={styles.select}
          value={sortKey}
          onChange={(event) => onSortKeyChange(event.target.value as TeamSortKey)}
        >
          <option value="score">{dictionary.sortOptions.score}</option>
          <option value="teamNumber">{dictionary.sortOptions.teamNumber}</option>
          <option value="ranking">{dictionary.sortOptions.ranking}</option>
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>{dictionary.sortDirectionLabel}</span>
        <select
          className={styles.select}
          value={sortDirection}
          onChange={(event) =>
            onSortDirectionChange(event.target.value as SortDirection)
          }
        >
          <option value="desc">{dictionary.sortDirections.desc}</option>
          <option value="asc">{dictionary.sortDirections.asc}</option>
        </select>
      </label>
    </div>
  );
}
