"use client";

import type { Dictionary } from "@/lib/i18n";
import type { TeamScore } from "@/lib/types";

import styles from "@/components/reference-team-selector.module.css";

type ReferenceTeamSelectorProps = {
  dictionary: Dictionary;
  referenceTeamKey: string;
  teams: TeamScore[];
  onChange: (teamKey: string) => void;
};

export function ReferenceTeamSelector({
  dictionary,
  referenceTeamKey,
  teams,
  onChange,
}: ReferenceTeamSelectorProps) {
  return (
    <div className={styles.card}>
      <label className={styles.field}>
        <span className={styles.label}>{dictionary.referenceModeLabel}</span>
        <select
          className={styles.select}
          value={referenceTeamKey}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{dictionary.defaultReferenceOption}</option>
          {teams.map((team) => (
            <option key={team.teamKey} value={team.teamKey}>
              #{team.teamNumber} {team.teamName}
            </option>
          ))}
        </select>
      </label>
      <p className={styles.hint}>{dictionary.referenceModeHint}</p>
    </div>
  );
}
