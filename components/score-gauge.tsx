"use client";

import type { CSSProperties } from "react";

import {
  formatSignedScore,
  getCategoryTheme,
  getGaugeFill,
} from "@/lib/presenters";
import type { ScoreCategory } from "@/lib/types";

import styles from "@/components/score-gauge.module.css";

type ScoreGaugeProps = {
  score: number;
  category: ScoreCategory;
};

export function ScoreGauge({ score, category }: ScoreGaugeProps) {
  const fill = getGaugeFill(score);
  const theme = getCategoryTheme(category);
  const angleDegrees = 180 + fill * 1.8;
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const needleX = 60 + Math.cos(angleRadians) * 34;
  const needleY = 60 + Math.sin(angleRadians) * 34;
  const cssVars = {
    "--accent": theme.accent,
    "--track": theme.gaugeTrack,
    "--glow": theme.glow,
  } as CSSProperties;

  return (
    <div className={styles.gauge} style={cssVars}>
      <svg className={styles.svg} viewBox="0 0 120 78" aria-hidden="true">
        <path
          className={styles.track}
          d="M 16 60 A 44 44 0 0 1 104 60"
          pathLength={100}
        />
        <path
          className={styles.value}
          d="M 16 60 A 44 44 0 0 1 104 60"
          pathLength={100}
          strokeDasharray={`${fill} 100`}
        />
        <line
          className={styles.needle}
          x1="60"
          y1="60"
          x2={needleX}
          y2={needleY}
        />
        <circle className={styles.dot} cx="60" cy="60" r="5.5" />
      </svg>
      <div className={styles.score}>{formatSignedScore(score)}</div>
      <div className={styles.scale}>
        <span>-10</span>
        <span>0</span>
        <span>+10</span>
      </div>
    </div>
  );
}
