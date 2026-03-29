"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_FRC_YEAR,
  DEFAULT_REFERENCE_TEAM_KEY,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_SORT_KEY,
  LAST_EVENT_QUERY_STORAGE_KEY,
  MIN_FRC_YEAR,
  PINNED_TEAM_STORAGE_KEY,
  clamp,
  getCategoryForScore,
} from "@/lib/constants";
import {
  DEFAULT_LOCALE,
  getDictionary,
  getEventTypeLabel,
} from "@/lib/i18n";
import {
  formatEventDateRange,
  formatEventLocation,
  formatMetaList,
} from "@/lib/presenters";
import { sortDisplayedTeams, type DisplayedTeamEntry } from "@/lib/sorting";
import type {
  AnalysisTab,
  DashboardTab,
  EventOption,
  EventScoresResponse,
  EventsResponse,
  Locale,
  SortDirection,
  TeamScore,
  TeamSortKey,
} from "@/lib/types";

import { AnalysisTabs } from "@/components/analysis-tabs";
import { AwardsPanel } from "@/components/awards-panel";
import { EventFieldStrength } from "@/components/event-field-strength";
import { EventProgress } from "@/components/event-progress";
import { EventSelector } from "@/components/event-selector";
import { LanguageToggle } from "@/components/language-toggle";
import { PinnedTeamSelector } from "@/components/pinned-team-selector";
import { ReferenceTeamSelector } from "@/components/reference-team-selector";
import { TeamScoreCard } from "@/components/team-score-card";
import { TeamSortControls } from "@/components/team-sort-controls";
import styles from "@/components/home-client.module.css";

type StoredLastEventQuery = {
  year: number;
  districtFilter: string;
  competitionFilter: string;
  eventKey: string;
};

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

function getTabScore(team: TeamScore, analysisTab: AnalysisTab): number | null {
  return analysisTab === "playoff"
    ? team.playoff?.score ?? null
    : team.qualification.score;
}

function isAnalysisTab(tab: DashboardTab): tab is AnalysisTab {
  return tab === "qualification" || tab === "playoff";
}

function isStoredLastEventQuery(value: unknown): value is StoredLastEventQuery {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredLastEventQuery>;
  return (
    typeof candidate.year === "number" &&
    Number.isFinite(candidate.year) &&
    typeof candidate.districtFilter === "string" &&
    typeof candidate.competitionFilter === "string" &&
    typeof candidate.eventKey === "string" &&
    candidate.eventKey.length > 0
  );
}

function readStoredLastEventQuery(): StoredLastEventQuery | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LAST_EVENT_QUERY_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    return isStoredLastEventQuery(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persistLastEventQuery(query: StoredLastEventQuery) {
  try {
    window.localStorage.setItem(
      LAST_EVENT_QUERY_STORAGE_KEY,
      JSON.stringify(query),
    );
  } catch {
    // Ignore storage failures and keep the app usable.
  }
}

const YEAR_OPTIONS = buildYearOptions();
const REPO_URL = "https://github.com/ZXLlama/frc-grandpa-grandson-selector";

export function HomeClient() {
  const initialStoredQuery = readStoredLastEventQuery();
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const dictionary = getDictionary(locale);
  const heroSubtitle =
    locale === "zh-TW"
      ? "用 The Blue Alliance 即時資料快速了解爸爸去哪兒"
      : "Use live The Blue Alliance data to quickly see where the dads are.";
  const tbaEventLabel = locale === "zh-TW" ? "開啟 TBA 頁面" : "Open in TBA";
  const [year, setYear] = useState(initialStoredQuery?.year ?? DEFAULT_FRC_YEAR);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [districtFilter, setDistrictFilter] = useState(
    initialStoredQuery?.districtFilter ?? "all",
  );
  const [competitionFilter, setCompetitionFilter] = useState(
    initialStoredQuery?.competitionFilter ?? "all",
  );
  const [selectedEventKey, setSelectedEventKey] = useState(
    initialStoredQuery?.eventKey ?? "",
  );
  const [pendingAutoLoadEventKey, setPendingAutoLoadEventKey] = useState<string | null>(
    initialStoredQuery?.eventKey ?? null,
  );
  const [referenceTeamKey, setReferenceTeamKey] = useState(
    DEFAULT_REFERENCE_TEAM_KEY,
  );
  const [pinnedTeamKey, setPinnedTeamKey] = useState("");
  const [sortKey, setSortKey] = useState<TeamSortKey>(DEFAULT_SORT_KEY);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    DEFAULT_SORT_DIRECTION,
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>("qualification");
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [scores, setScores] = useState<EventScoresResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scoresError, setScoresError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PINNED_TEAM_STORAGE_KEY);
      if (stored) {
        setPinnedTeamKey(stored);
      }
    } catch {
      // Ignore storage failures and keep the app usable.
    }
  }, []);

  useEffect(() => {
    try {
      if (pinnedTeamKey) {
        window.localStorage.setItem(PINNED_TEAM_STORAGE_KEY, pinnedTeamKey);
      } else {
        window.localStorage.removeItem(PINNED_TEAM_STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures and keep the app usable.
    }
  }, [pinnedTeamKey]);

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
        setPendingAutoLoadEventKey(null);
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
    if (!scores?.event.key) {
      return;
    }

    setActiveTab(scores.event.isPlayoffOnly ? "playoff" : "qualification");
  }, [scores?.event.key, scores?.event.isPlayoffOnly]);

  const selectedEvent =
    filteredEvents.find((event) => event.key === selectedEventKey) ??
    events.find((event) => event.key === selectedEventKey) ??
    null;

  const eventMeta = selectedEvent
    ? formatMetaList([
        getEventTypeLabel(locale, selectedEvent.eventType),
        selectedEvent.districtDisplay,
        formatEventDateRange(locale, selectedEvent),
        formatEventLocation(selectedEvent),
      ])
    : null;

  const availableTabs: DashboardTab[] = useMemo(() => {
    if (!scores) {
      return ["qualification", "playoff"];
    }

    const tabs: DashboardTab[] = scores.event.isPlayoffOnly
      ? ["playoff"]
      : ["qualification", "playoff"];

    if (scores.event.isFinished) {
      tabs.push("awards");
    }

    return tabs;
  }, [scores]);

  const playoffStarted = (scores?.event.playoffMatches ?? 0) > 0;
  const currentAnalysisTab: AnalysisTab | null = isAnalysisTab(activeTab)
    ? activeTab
    : null;

  const analysisTeams = useMemo(
    () =>
      currentAnalysisTab && scores
        ? scores.teams.filter((team) => {
            if (currentAnalysisTab === "playoff") {
              return playoffStarted && Boolean(team.playoff);
            }

            return true;
          })
        : [],
    [currentAnalysisTab, playoffStarted, scores],
  );

  useEffect(() => {
    if (!currentAnalysisTab) {
      return;
    }

    if (!analysisTeams.length) {
      setReferenceTeamKey(DEFAULT_REFERENCE_TEAM_KEY);
      return;
    }

    if (
      referenceTeamKey &&
      !analysisTeams.some((team) => team.teamKey === referenceTeamKey)
    ) {
      setReferenceTeamKey(DEFAULT_REFERENCE_TEAM_KEY);
    }
  }, [analysisTeams, currentAnalysisTab, referenceTeamKey]);

  const referenceTeam =
    analysisTeams.find((team) => team.teamKey === referenceTeamKey) ?? null;
  const useRelativeMode = Boolean(referenceTeam && currentAnalysisTab);
  const visiblePinnedTeamKey = scores?.teams.some(
    (team) => team.teamKey === pinnedTeamKey,
  )
    ? pinnedTeamKey
    : "";

  const displayedTeams =
    currentAnalysisTab === null
      ? []
      : sortDisplayedTeams(
          analysisTeams
            .map((team) => {
              const baseScore = getTabScore(team, currentAnalysisTab);

              if (baseScore === null) {
                return null;
              }

              const referenceScore = referenceTeam
                ? getTabScore(referenceTeam, currentAnalysisTab)
                : null;
              const displayedScore =
                referenceScore === null
                  ? baseScore
                  : clamp(baseScore - referenceScore, -10, 10);

              return {
                team,
                displayedScore,
                displayedCategory: getCategoryForScore(displayedScore),
                isReference: referenceTeam?.teamKey === team.teamKey,
              };
            })
            .filter((entry): entry is DisplayedTeamEntry => entry !== null),
          sortKey,
          sortDirection,
          currentAnalysisTab,
        );

  async function runAnalysis(eventKey: string, persistQuery = true) {
    setIsAnalyzing(true);
    setScoresError(null);
    setReferenceTeamKey(DEFAULT_REFERENCE_TEAM_KEY);

    try {
      const payload = await fetchJson<EventScoresResponse>(
        `/api/event/${eventKey}/scores`,
      );

      setScores(payload);

      if (persistQuery) {
        persistLastEventQuery({
          year,
          districtFilter,
          competitionFilter,
          eventKey,
        });
      }
    } catch (error) {
      setScores(null);
      setScoresError(
        error instanceof Error ? error.message : dictionary.scoreLoadFailed,
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  useEffect(() => {
    if (!pendingAutoLoadEventKey) {
      return;
    }

    if (isLoadingEvents || isAnalyzing || eventsError) {
      return;
    }

    const storedEventStillExists = events.some(
      (event) => event.key === pendingAutoLoadEventKey,
    );

    if (!storedEventStillExists) {
      setPendingAutoLoadEventKey(null);
      return;
    }

    if (selectedEventKey !== pendingAutoLoadEventKey) {
      return;
    }

    setPendingAutoLoadEventKey(null);
    setIsAnalyzing(true);
    setScoresError(null);
    setReferenceTeamKey(DEFAULT_REFERENCE_TEAM_KEY);

    void fetchJson<EventScoresResponse>(
      `/api/event/${pendingAutoLoadEventKey}/scores`,
    )
      .then((payload) => {
        setScores(payload);
      })
      .catch((error) => {
        setScores(null);
        setScoresError(
          error instanceof Error ? error.message : dictionary.scoreLoadFailed,
        );
      })
      .finally(() => {
        setIsAnalyzing(false);
      });
  }, [
    pendingAutoLoadEventKey,
    isLoadingEvents,
    isAnalyzing,
    eventsError,
    events,
    selectedEventKey,
    dictionary.scoreLoadFailed,
  ]);

  function handleAnalyze() {
    if (!selectedEventKey) {
      return;
    }

    setPendingAutoLoadEventKey(null);
    void runAnalysis(selectedEventKey);
  }

  function resetDerivedState() {
    setScores(null);
    setScoresError(null);
    setReferenceTeamKey(DEFAULT_REFERENCE_TEAM_KEY);
    setActiveTab("qualification");
  }

  function handleYearChange(nextYear: number) {
    setPendingAutoLoadEventKey(null);
    setYear(nextYear);
    setDistrictFilter("all");
    setCompetitionFilter("all");
    setSelectedEventKey("");
    resetDerivedState();
  }

  function handleDistrictChange(value: string) {
    setPendingAutoLoadEventKey(null);
    setDistrictFilter(value);
    resetDerivedState();
  }

  function handleCompetitionChange(value: string) {
    setPendingAutoLoadEventKey(null);
    setCompetitionFilter(value);
    resetDerivedState();
  }

  function handleEventChange(eventKey: string) {
    setPendingAutoLoadEventKey(null);
    setSelectedEventKey(eventKey);
    resetDerivedState();
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>{dictionary.appTitle}</h1>
            <p className={styles.subtitle}>{heroSubtitle}</p>
          </div>
          <LanguageToggle
            locale={locale}
            dictionary={dictionary}
            onChange={setLocale}
          />
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
                <div className={styles.eventTitleRow}>
                  <h2 className={styles.eventName}>{selectedEvent.name}</h2>
                  <a
                    className={styles.eventLink}
                    href={`https://www.thebluealliance.com/event/${selectedEvent.key}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className={styles.eventLinkIcon}
                    >
                      <path
                        fill="currentColor"
                        d="M14 3h7v7h-2V6.41l-8.29 8.3-1.42-1.42 8.3-8.29H14V3Zm4 16H6V7h5V5H6a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-5h-2v5Z"
                      />
                    </svg>
                    {tbaEventLabel}
                  </a>
                </div>
                {eventMeta ? (
                  <div className={styles.eventMeta}>{eventMeta}</div>
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
                <span>{dictionary.qualificationMatchesLabel}</span>
                <strong>{scores.event.qualificationMatches}</strong>
              </div>
              <div className={styles.stat}>
                <span>{dictionary.playoffMatchesLabel}</span>
                <strong>{scores.event.playoffMatches}</strong>
              </div>
            </div>
          ) : null}
        </div>

        {scores ? (
          <div className={styles.summaryDeck}>
            <EventFieldStrength event={scores.event} locale={locale} />
            <EventProgress event={scores.event} locale={locale} />
          </div>
        ) : null}

        {scores ? (
          <AnalysisTabs
            activeTab={activeTab}
            availableTabs={availableTabs}
            dictionary={dictionary}
            onChange={setActiveTab}
          />
        ) : null}

        {scores && currentAnalysisTab && displayedTeams.length > 0 ? (
          <div className={styles.toolbarGrid}>
            <PinnedTeamSelector
              dictionary={dictionary}
              pinnedTeamKey={visiblePinnedTeamKey}
              teams={scores.teams}
              onChange={setPinnedTeamKey}
            />
            <ReferenceTeamSelector
              dictionary={dictionary}
              referenceTeamKey={referenceTeamKey}
              teams={analysisTeams}
              onChange={setReferenceTeamKey}
            />
            <TeamSortControls
              dictionary={dictionary}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSortKeyChange={setSortKey}
              onSortDirectionChange={setSortDirection}
            />
          </div>
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
          activeTab === "awards" ? (
            <AwardsPanel awards={scores.awards} locale={locale} />
          ) : activeTab === "playoff" && !playoffStarted ? (
            <div className={styles.messageCard}>
              {dictionary.playoffUnavailableMessage}
            </div>
          ) : activeTab === "qualification" && scores.event.isPlayoffOnly ? (
            <div className={styles.messageCard}>
              {dictionary.qualificationNotApplicableMessage}
            </div>
          ) : displayedTeams.length ? (
            <div className={styles.grid}>
              {displayedTeams.map(
                ({
                  team,
                  displayedScore,
                  displayedCategory,
                  isReference,
                }) => (
                  <TeamScoreCard
                    key={`${activeTab}-${team.teamKey}`}
                    team={team}
                    locale={locale}
                    analysisTab={currentAnalysisTab as AnalysisTab}
                    displayedScore={displayedScore}
                    displayedCategory={displayedCategory}
                    isPinned={team.teamKey === pinnedTeamKey}
                    isReference={isReference}
                    referenceTeam={referenceTeam}
                    useRelativeMode={useRelativeMode}
                    isEventFinished={scores.event.isFinished}
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
          className={styles.footerLink}
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub repository"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={styles.githubIcon}
          >
            <path
              fill="currentColor"
              d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.19-.02-2.16-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.78 1.19 1.78 1.19 1.03 1.76 2.7 1.25 3.36.95.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.9 10.9 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.73.8 1.18 1.82 1.18 3.07 0 4.42-2.69 5.38-5.26 5.67.41.35.77 1.03.77 2.08 0 1.5-.01 2.7-.01 3.07 0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
            />
          </svg>
        </a>
      </footer>
    </main>
  );
}
