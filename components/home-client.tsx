"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_FRC_YEAR,
  DEFAULT_REFERENCE_TEAM_KEY,
  MIN_FRC_YEAR,
  clamp,
  getCategoryForScore,
} from "@/lib/constants";
import {
  DEFAULT_LOCALE,
  getDictionary,
  getEventTypeLabel,
} from "@/lib/i18n";
import { formatEventDateRange, formatEventLocation } from "@/lib/presenters";
import type {
  EventOption,
  EventScoresResponse,
  EventsResponse,
  Locale,
} from "@/lib/types";

import { EventSelector } from "@/components/event-selector";
import { LanguageToggle } from "@/components/language-toggle";
import { ReferenceTeamSelector } from "@/components/reference-team-selector";
import { TeamScoreCard } from "@/components/team-score-card";
import styles from "@/components/home-client.module.css";

function getErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const candidate = data as { error?: unknown };
  return typeof candidate.error === "string" ? candidate.error : null;
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(getErrorMessage(data) ?? "Request failed.");
  }

  return data as T;
}

function buildYearOptions() {
  const currentYear = Math.max(DEFAULT_FRC_YEAR, new Date().getFullYear());
  const years: number[] = [];

  for (let year = currentYear; year >= MIN_FRC_YEAR; year -= 1) {
    years.push(year);
  }

  return years;
}

const YEAR_OPTIONS = buildYearOptions();

export function HomeClient() {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const dictionary = getDictionary(locale);
  const [year, setYear] = useState(DEFAULT_FRC_YEAR);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [districtFilter, setDistrictFilter] = useState("all");
  const [competitionFilter, setCompetitionFilter] = useState("all");
  const [selectedEventKey, setSelectedEventKey] = useState("");
  const [referenceTeamKey, setReferenceTeamKey] = useState(
    DEFAULT_REFERENCE_TEAM_KEY,
  );
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [scores, setScores] = useState<EventScoresResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scoresError, setScoresError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {
      setIsLoadingEvents(true);
      setEventsError(null);

      try {
        const payload = await fetchJson<EventsResponse>(
          `/api/events?year=${year}`,
          controller.signal,
        );

        setEvents(payload.events);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setEvents([]);
        setSelectedEventKey("");
        setEventsError(
          error instanceof Error ? error.message : dictionary.eventLoadFailed,
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingEvents(false);
        }
      }
    }

    void loadEvents();

    return () => controller.abort();
  }, [year, dictionary.eventLoadFailed]);

  const districtOptions = Array.from(
    new Map(
      events
        .filter((event) => event.districtKey && event.districtDisplay)
        .map((event) => [
          event.districtKey as string,
          {
            value: event.districtKey as string,
            label: event.districtDisplay as string,
          },
        ]),
    ).values(),
  ).sort((left, right) => left.label.localeCompare(right.label));

  const competitionOptions = Array.from(
    new Map(
      events.map((event) => [
        String(event.eventType),
        {
          value: String(event.eventType),
          label: getEventTypeLabel(locale, event.eventType),
        },
      ]),
    ).values(),
  ).sort((left, right) => left.label.localeCompare(right.label));

  const filteredEvents = events.filter((event) => {
    const matchesDistrict =
      districtFilter === "all" || event.districtKey === districtFilter;
    const matchesCompetition =
      competitionFilter === "all" ||
      String(event.eventType) === competitionFilter;

    return matchesDistrict && matchesCompetition;
  });

  useEffect(() => {
    if (!filteredEvents.length) {
      setSelectedEventKey("");
      return;
    }

    if (!filteredEvents.some((event) => event.key === selectedEventKey)) {
      setSelectedEventKey(filteredEvents[0].key);
    }
  }, [filteredEvents, selectedEventKey]);

  useEffect(() => {
    if (!scores?.teams.length) {
      setReferenceTeamKey(DEFAULT_REFERENCE_TEAM_KEY);
      return;
    }

    if (
      referenceTeamKey &&
      !scores.teams.some((team) => team.teamKey === referenceTeamKey)
    ) {
      setReferenceTeamKey(DEFAULT_REFERENCE_TEAM_KEY);
    }
  }, [scores, referenceTeamKey]);

  const selectedEvent =
    filteredEvents.find((event) => event.key === selectedEventKey) ??
    events.find((event) => event.key === selectedEventKey) ??
    null;

  const referenceTeam =
    scores?.teams.find((team) => team.teamKey === referenceTeamKey) ?? null;
  const useRelativeMode = Boolean(referenceTeam);

  async function handleAnalyze() {
    if (!selectedEventKey) {
      return;
    }

    setIsAnalyzing(true);
    setScoresError(null);
    setReferenceTeamKey(DEFAULT_REFERENCE_TEAM_KEY);

    try {
      const payload = await fetchJson<EventScoresResponse>(
        `/api/event/${selectedEventKey}/scores`,
      );

      setScores(payload);
    } catch (error) {
      setScores(null);
      setScoresError(
        error instanceof Error ? error.message : dictionary.scoreLoadFailed,
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function resetDerivedState() {
    setScores(null);
    setScoresError(null);
    setReferenceTeamKey(DEFAULT_REFERENCE_TEAM_KEY);
  }

  function handleYearChange(nextYear: number) {
    setYear(nextYear);
    setDistrictFilter("all");
    setCompetitionFilter("all");
    setSelectedEventKey("");
    resetDerivedState();
  }

  function handleDistrictChange(value: string) {
    setDistrictFilter(value);
    resetDerivedState();
  }

  function handleCompetitionChange(value: string) {
    setCompetitionFilter(value);
    resetDerivedState();
  }

  function handleEventChange(eventKey: string) {
    setSelectedEventKey(eventKey);
    resetDerivedState();
  }

  const eventMeta = selectedEvent
    ? [
        getEventTypeLabel(locale, selectedEvent.eventType),
        selectedEvent.districtDisplay,
        formatEventDateRange(locale, selectedEvent),
        formatEventLocation(selectedEvent),
      ].filter(Boolean)
    : [];

  const displayedTeams =
    scores?.teams.map((team) => {
      const displayedScore = referenceTeam
        ? clamp(team.score - referenceTeam.score, -10, 10)
        : team.score;

      return {
        team,
        displayedScore,
        displayedCategory: getCategoryForScore(displayedScore),
        isReference: referenceTeam?.teamKey === team.teamKey,
      };
    }) ?? [];

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.heroCopy}>
            <div className={styles.kicker}>FRC Event Strength Snapshot</div>
            <h1 className={styles.title}>{dictionary.appTitle}</h1>
            <p className={styles.subtitle}>{dictionary.appSubtitle}</p>
          </div>
          <LanguageToggle
            locale={locale}
            dictionary={dictionary}
            onChange={setLocale}
          />
        </div>

        <div className={styles.heroStrip}>
          <div>
            <div className={styles.stripLabel}>{dictionary.controlsTitle}</div>
            <div className={styles.stripText}>{dictionary.modelHint}</div>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <EventSelector
          locale={locale}
          dictionary={dictionary}
          year={year}
          yearOptions={YEAR_OPTIONS}
          districtFilter={districtFilter}
          districtOptions={districtOptions}
          competitionFilter={competitionFilter}
          competitionOptions={competitionOptions}
          selectedEventKey={selectedEventKey}
          selectedEvent={selectedEvent}
          filteredEvents={filteredEvents}
          isLoadingEvents={isLoadingEvents}
          eventsError={eventsError}
          isAnalyzing={isAnalyzing}
          onYearChange={handleYearChange}
          onDistrictChange={handleDistrictChange}
          onCompetitionChange={handleCompetitionChange}
          onEventChange={handleEventChange}
          onAnalyze={handleAnalyze}
        />
      </section>

      <section className={styles.resultsSection}>
        <div className={styles.resultsHeader}>
          <div className={styles.resultsMain}>
            <div className={styles.resultsTitle}>{dictionary.resultsTitle}</div>
            {selectedEvent ? (
              <>
                <h2 className={styles.eventName}>{selectedEvent.name}</h2>
                {eventMeta.length ? (
                  <div className={styles.eventMeta}>{eventMeta.join(" · ")}</div>
                ) : null}
              </>
            ) : (
              <div className={styles.eventMeta}>{dictionary.emptyTitle}</div>
            )}
          </div>

          {scores ? (
            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <span>{dictionary.teamsLabel}</span>
                <strong>{scores.event.teamCount}</strong>
              </div>
              <div className={styles.stat}>
                <span>{dictionary.matchesLabel}</span>
                <strong>{scores.event.completedMatches}</strong>
              </div>
            </div>
          ) : null}
        </div>

        {scores ? (
          <ReferenceTeamSelector
            dictionary={dictionary}
            referenceTeamKey={referenceTeamKey}
            teams={scores.teams}
            onChange={setReferenceTeamKey}
          />
        ) : null}

        {scoresError ? (
          <div className={styles.messageCard}>{scoresError}</div>
        ) : isAnalyzing ? (
          <div className={styles.grid}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={styles.skeletonCard}>
                <div className={styles.skeletonHeader} />
                <div className={styles.skeletonBadge} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLineShort} />
              </div>
            ))}
          </div>
        ) : scores ? (
          scores.teams.length ? (
            <div className={styles.grid}>
              {displayedTeams.map(
                ({
                  team,
                  displayedScore,
                  displayedCategory,
                  isReference,
                }) => (
                  <TeamScoreCard
                    key={team.teamKey}
                    team={team}
                    locale={locale}
                    displayedScore={displayedScore}
                    displayedCategory={displayedCategory}
                    isReference={isReference}
                    referenceTeam={referenceTeam}
                    useRelativeMode={useRelativeMode}
                  />
                ),
              )}
            </div>
          ) : (
            <div className={styles.messageCard}>{dictionary.noTeamsTitle}</div>
          )
        ) : (
          <div className={styles.messageCard}>{dictionary.emptyBody}</div>
        )}
      </section>

      <footer className={styles.footer}>
        <a
          href="https://www.thebluealliance.com/"
          target="_blank"
          rel="noreferrer"
        >
          {dictionary.poweredBy}
        </a>
      </footer>
    </main>
  );
}
