"use client";

import type { Dictionary } from "@/lib/i18n";
import type { DashboardTab } from "@/lib/types";

import styles from "@/components/analysis-tabs.module.css";

type AnalysisTabsProps = {
  activeTab: DashboardTab;
  availableTabs: DashboardTab[];
  dictionary: Dictionary;
  onChange: (tab: DashboardTab) => void;
};

export function AnalysisTabs({
  activeTab,
  availableTabs,
  dictionary,
  onChange,
}: AnalysisTabsProps) {
  return (
    <div
      className={styles.tabs}
      role="tablist"
      aria-label="Analysis tabs"
      style={{
        gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))`,
      }}
    >
      {availableTabs.map((tab) => {
        const isActive = tab === activeTab;

        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={isActive ? styles.activeTab : styles.tab}
            onClick={() => onChange(tab)}
          >
            {dictionary.analysisTabs[tab]}
          </button>
        );
      })}
    </div>
  );
}
