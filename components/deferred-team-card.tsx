"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";

import { TeamScoreCard } from "@/components/team-score-card";
import styles from "@/components/deferred-team-card.module.css";

type DeferredTeamCardProps = ComponentProps<typeof TeamScoreCard>;

const VIEWPORT_ROOT_MARGIN = "720px 0px";

export function DeferredTeamCard(props: DeferredTeamCardProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isMounted) {
      return;
    }

    const node = shellRef.current;

    if (!node) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      const handle = window.setTimeout(() => setIsMounted(true), 0);
      return () => window.clearTimeout(handle);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) {
          setIsMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: VIEWPORT_ROOT_MARGIN },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isMounted]);

  return (
    <div
      ref={shellRef}
      className={styles.shell}
      data-mounted={isMounted ? "true" : "false"}
    >
      {isMounted ? (
        <TeamScoreCard {...props} />
      ) : (
        <div className={styles.placeholder} aria-hidden="true">
          <div className={styles.placeholderNumber} />
          <div className={styles.placeholderName} />
          <div className={styles.placeholderBody}>
            <div className={styles.placeholderGauge} />
            <div className={styles.placeholderPanel} />
          </div>
        </div>
      )}
    </div>
  );
}
