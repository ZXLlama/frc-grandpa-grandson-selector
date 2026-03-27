"use client";

import { getEventTypeLabel, type Dictionary } from "@/lib/i18n";
import {
  formatEventDateRange,
  formatEventLocation,
  formatMetaList,
} from "@/lib/presenters";
import type { EventOption, Locale } from "@/lib/types";

import styles from "@/components/event-selector.module.css";

type EventSelectorProps = {
  locale: Locale;
  dictionary: Dictionary;
  year: number;
  yearOptions: number[];
  districtFilter: string;
  districtOptions: Array<{ value: string; label: string }>;
  competitionFilter: string;
  competitionOptions: Array<{ value: string; label: string }>;
  selectedEventKey: string;
  selectedEvent: EventOption | null;
  filteredEvents: EventOption[];
  isLoadingEvents: boolean;
  eventsError: string | null;
  isAnalyzing: boolean;
  onYearChange: (year: number) => void;
  onDistrictChange: (value: string) => void;
  onCompetitionChange: (value: string) => void;
  onEventChange: (eventKey: string) => void;
  onAnalyze: () => void;
};

function buildEventLabel(event: EventOption, locale: Locale) {
  return formatMetaList([
    event.name,
    getEventTypeLabel(locale, event.eventType),
    formatEventDateRange(locale, event),
    event.districtDisplay,
    formatEventLocation(event),
  ]);
}

export function EventSelector({
  locale,
  dictionary,
  year,
  yearOptions,
  districtFilter,
  districtOptions,
  competitionFilter,
  competitionOptions,
  selectedEventKey,
  selectedEvent,
  filteredEvents,
  isLoadingEvents,
  eventsError,
  isAnalyzing,
  onYearChange,
  onDistrictChange,
  onCompetitionChange,
  onEventChange,
  onAnalyze,
}: EventSelectorProps) {
  const previewMeta = selectedEvent
    ? formatMetaList([
        getEventTypeLabel(locale, selectedEvent.eventType),
        selectedEvent.districtDisplay,
        formatEventDateRange(locale, selectedEvent),
        formatEventLocation(selectedEvent),
      ])
    : null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.primaryGrid}>
        <label className={styles.field}>
          <span className={styles.label}>{dictionary.yearLabel}</span>
          <select
            className={styles.select}
            value={year}
            onChange={(event) => onYearChange(Number(event.target.value))}
          >
            {yearOptions.map((optionYear) => (
              <option key={optionYear} value={optionYear}>
                {optionYear}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>{dictionary.eventLabel}</span>
          <select
            className={styles.select}
            value={selectedEventKey}
            onChange={(event) => onEventChange(event.target.value)}
            disabled={isLoadingEvents || !filteredEvents.length}
          >
            {filteredEvents.length === 0 ? (
              <option value="">
                {isLoadingEvents
                  ? dictionary.loadingEvents
                  : dictionary.noEventsAvailable}
              </option>
            ) : null}
            {filteredEvents.map((event) => (
              <option key={event.key} value={event.key}>
                {buildEventLabel(event, locale)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.secondaryGrid}>
        <label className={styles.field}>
          <span className={styles.label}>{dictionary.districtLabel}</span>
          <select
            className={styles.select}
            value={districtFilter}
            onChange={(event) => onDistrictChange(event.target.value)}
            disabled={isLoadingEvents || !districtOptions.length}
          >
            <option value="all">{dictionary.allDistricts}</option>
            {districtOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>{dictionary.competitionLabel}</span>
          <select
            className={styles.select}
            value={competitionFilter}
            onChange={(event) => onCompetitionChange(event.target.value)}
            disabled={isLoadingEvents || !competitionOptions.length}
          >
            <option value="all">{dictionary.allCompetitionTypes}</option>
            {competitionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedEvent ? (
        <div className={styles.preview}>
          <div className={styles.previewTitle}>{selectedEvent.name}</div>
          {previewMeta ? (
            <div className={styles.previewMeta}>{previewMeta}</div>
          ) : null}
        </div>
      ) : null}

      <div className={styles.footer}>
        <div className={styles.state}>
          {eventsError
            ? eventsError
            : isLoadingEvents
              ? dictionary.loadingEvents
              : null}
        </div>

        <button
          type="button"
          className={styles.button}
          onClick={onAnalyze}
          disabled={!selectedEventKey || isLoadingEvents || isAnalyzing}
        >
          {isAnalyzing ? dictionary.analyzing : dictionary.analyze}
        </button>
      </div>
    </div>
  );
}
