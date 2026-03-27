import { clamp, roundTo } from "@/lib/constants";
import type { EventProgress, EventProgressStage, TeamScore } from "@/lib/types";
import type { TbaEventSimple } from "@/lib/server/tba";

import { mean } from "@/lib/scoring/math";

function getExpectedQualificationMatches(event: TbaEventSimple): number {
  if (event.event_type === 4) {
    return 0;
  }

  if (event.event_type === 3 || event.event_type === 5) {
    return 10;
  }

  return 12;
}

function getPlayoffCompletion(input: {
  playoffMatches: number;
  isFinished: boolean;
  event: TbaEventSimple;
}): number | null {
  if (input.isFinished) {
    return 1;
  }

  if (input.playoffMatches <= 0) {
    return input.event.event_type === 4 ? 0.08 : null;
  }

  const targetMatches = input.event.event_type === 4 ? 10 : 13;
  return clamp(input.playoffMatches / targetMatches, 0.12, 0.94);
}

export function getEventProgress(input: {
  event: TbaEventSimple;
  playoffMatches: number;
  isFinished: boolean;
  teams: TeamScore[];
}): EventProgress {
  const qualificationMatches = input.teams
    .map((team) => team.qualification.matchesPlayed)
    .filter((matches) => matches > 0);
  const expectedQualificationMatches = getExpectedQualificationMatches(input.event);
  const qualificationCompletion =
    expectedQualificationMatches <= 0
      ? null
      : clamp(
          mean(qualificationMatches.length ? qualificationMatches : [0]) /
            expectedQualificationMatches,
          0,
          1,
        );
  const playoffCompletion = getPlayoffCompletion({
    playoffMatches: input.playoffMatches,
    isFinished: input.isFinished,
    event: input.event,
  });

  let stage: EventProgressStage;
  let percent: number;

  if (input.isFinished) {
    stage = "finished";
    percent = 100;
  } else if (input.playoffMatches > 0 || input.event.event_type === 4) {
    stage = "playoffs";
    percent = 72 + (playoffCompletion ?? 0.12) * 26;
  } else if ((qualificationCompletion ?? 0) < 0.42) {
    stage = "qualificationEarly";
    percent = 8 + (qualificationCompletion ?? 0) * 42;
  } else {
    stage = "qualificationMidLate";
    percent = 48 + (qualificationCompletion ?? 0) * 24;
  }

  return {
    stage,
    percent: roundTo(clamp(percent, 0, 100), 0),
    qualificationCompletion:
      qualificationCompletion === null ? null : roundTo(qualificationCompletion, 2),
    playoffCompletion:
      playoffCompletion === null ? null : roundTo(playoffCompletion, 2),
  };
}
