"use client";

import type { Dictionary } from "@/lib/i18n";
import type { TeamScore } from "@/lib/types";

import styles from "@/components/reference-team-selector.module.css";

type PinnedTeamSelectorProps = {
  dictionary: Dictionary;
  pinnedTeamKey: string;
  teams: TeamScore[];
  onChange: (teamKey: string) => void;
};

export function PinnedTeamSelector({
  dictionary,
  pinnedTeamKey,
  teams,
  onChange,
}: PinnedTeamSelectorProps) {
  const sortedTeams = [...teams].sort(
    (left, right) => Number(left.teamNumber) - Number(right.teamNumber),
  );

  return (
    <div className={styles.card}>
      <label className={styles.field}>
        <span className={styles.label}>{dictionary.pinnedModeLabel}</span>
        <select
          className={styles.select}
          value={pinnedTeamKey}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{dictionary.defaultPinnedOption}</option>
          {sortedTeams.map((team) => (
            <option key={team.teamKey} value={team.teamKey}>
              #{team.teamNumber} {team.teamName}
            </option>
          ))}
        </select>
      </label>
      <p className={styles.hint}>{dictionary.pinnedModeHint}</p>
    </div>
  );
}
