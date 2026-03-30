import { clamp, getConfidenceLevel, roundTo } from "@/lib/constants";
import type {
  PlayoffContext,
  PlayoffFinish,
  TeamRecord,
} from "@/lib/types";
import type {
  TbaAlliance,
  TbaEventTeamStatuses,
  TbaMatchSimple,
  TbaTeamSimple,
} from "@/lib/server/tba";
import { mean, normalizeDistribution, standardDeviation } from "@/lib/scoring/math";
import { getMatchOrder, getWinRate, isPlayedMatch } from "@/lib/scoring/shared";

type AllianceAggregate = {
  key: string;
  label: string | null;
  seed: number | null;
  picks: string[];
  backupIn: string | null;
  backupOut: string | null;
  members: Set<string>;
  backupTeams: Set<string>;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  margins: number[];
  deepestLevel: string | null;
  finalWins: number;
  finalLosses: number;
  status: string | null;
  isComplete: boolean;
};

export type PlayoffAllianceSummary = {
  key: string;
  label: string | null;
  seed: number | null;
  picks: string[];
  backupIn: string | null;
  backupOut: string | null;
  members: string[];
  matchesPlayed: number;
  record: TeamRecord;
  winRate: number | null;
  advancement: PlayoffFinish;
  score: number | null;
  confidence: number;
  consistency: number | null;
  isComplete: boolean;
  wonEvent: boolean;
};

const LEVEL_ORDER: Record<string, number> = {
  ef: 1,
  qf: 2,
  sf: 3,
  f: 4,
};

function getSeedFromAlliance(alliance: TbaAlliance, index: number): number | null {
  const fromName = alliance.name?.match(/(\d+)/)?.[1];

  if (fromName) {
    const parsed = Number.parseInt(fromName, 10);
    return Number.isFinite(parsed) ? parsed : index + 1;
  }

  return index + 1;
}

function getAllianceKey(seed: number | null, index: number): string {
  return `alliance:${seed ?? index + 1}`;
}

function getMembers(alliance: TbaAlliance): string[] {
  const members = new Set<string>(alliance.picks ?? []);

  if (alliance.backup?.in) {
    members.add(alliance.backup.in);
  }

  if (alliance.backup?.out) {
    members.add(alliance.backup.out);
  }

  return [...members];
}

function toRecord(aggregate: AllianceAggregate): TeamRecord {
  return {
    wins: aggregate.wins,
    losses: aggregate.losses,
    ties: aggregate.ties,
  };
}

function getAdvancement(
  aggregate: AllianceAggregate,
): PlayoffFinish {
  if (aggregate.status?.toLowerCase() === "won") {
    return "champion";
  }

  if (aggregate.deepestLevel === "f") {
    return aggregate.finalWins > aggregate.finalLosses ? "champion" : "finalist";
  }

  if (aggregate.deepestLevel === "sf") {
    return "semifinalist";
  }

  if (aggregate.deepestLevel === "qf") {
    return "quarterfinalist";
  }

  if (aggregate.deepestLevel === "ef") {
    return "octofinalist";
  }

  return "none";
}

function getAdvancementSignal(finish: PlayoffFinish): number {
  switch (finish) {
    case "champion":
      return 1;
    case "finalist":
      return 0.72;
    case "semifinalist":
      return 0.42;
    case "quarterfinalist":
      return 0.16;
    case "octofinalist":
      return 0.04;
    default:
      return 0;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getTeamPlayoffStatus(status: unknown): string | null {
  if (!isRecord(status)) {
    return null;
  }

  const playoff = isRecord(status.playoff) ? status.playoff : null;
  const playoffStatus = playoff && typeof playoff.status === "string"
    ? playoff.status
    : null;

  return playoffStatus;
}

function isClosedPlayoffStatus(status: string | null): boolean {
  if (!status) {
    return false;
  }

  const normalized = status.toLowerCase();
  return normalized === "won" || normalized === "eliminated";
}

function weightedAverageSignals(
  values: Array<{ value: number | null | undefined; weight: number }>,
): number | null {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const { value, weight } of values) {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      !Number.isFinite(weight) ||
      weight <= 0
    ) {
      continue;
    }

    weightedSum += value * weight;
    totalWeight += weight;
  }

  if (totalWeight <= 0) {
    return null;
  }

  return clamp(weightedSum / totalWeight, -1, 1);
}

export function analyzePlayoffs(input: {
  teams: TbaTeamSimple[];
  matches: TbaMatchSimple[];
  alliances: TbaAlliance[] | null;
  teamStatuses: TbaEventTeamStatuses | null;
}): {
  alliances: PlayoffAllianceSummary[];
  playoffMatches: TbaMatchSimple[];
  results: Map<string, PlayoffContext>;
} {
  const teams = [...input.teams].sort(
    (left, right) => left.team_number - right.team_number,
  );
  const teamSet = new Set(teams.map((team) => team.key));
  const playoffMatches = input.matches
    .filter((match) => isPlayedMatch(match) && match.comp_level !== "qm")
    .sort((left, right) => getMatchOrder(left) - getMatchOrder(right));
  const aggregates = new Map<string, AllianceAggregate>();
  const teamToAlliance = new Map<string, string>();
  const teamStatuses = new Map(Object.entries(input.teamStatuses ?? {}));

  for (const [index, alliance] of (input.alliances ?? []).entries()) {
    const seed = getSeedFromAlliance(alliance, index);
    const allianceKey = getAllianceKey(seed, index);
    const members = getMembers(alliance).filter((teamKey) => teamSet.has(teamKey));

    aggregates.set(allianceKey, {
      key: allianceKey,
      label: alliance.name ?? (seed ? `Alliance ${seed}` : null),
      seed,
      picks: [...(alliance.picks ?? [])],
      backupIn: alliance.backup?.in ?? null,
      backupOut: alliance.backup?.out ?? null,
      members: new Set(members),
      backupTeams: new Set(
        alliance.backup?.in && teamSet.has(alliance.backup.in)
          ? [alliance.backup.in]
          : [],
      ),
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      margins: [],
      deepestLevel: alliance.status?.level ?? null,
      finalWins: 0,
      finalLosses: 0,
      status: alliance.status?.status ?? null,
      isComplete: false,
    });

    for (const teamKey of members) {
      teamToAlliance.set(teamKey, allianceKey);
    }
  }

  const ensureFallbackAlliance = (teamKeys: string[]) => {
    const knownKey = teamKeys.find((teamKey) => teamToAlliance.has(teamKey));

    if (knownKey) {
      return teamToAlliance.get(knownKey) ?? null;
    }

    const cleanedTeamKeys = teamKeys.filter((teamKey) => teamSet.has(teamKey));

    if (!cleanedTeamKeys.length) {
      return null;
    }

    const fallbackKey = `alliance:fallback:${cleanedTeamKeys
      .slice()
      .sort()
      .join("-")}`;

    if (!aggregates.has(fallbackKey)) {
      aggregates.set(fallbackKey, {
        key: fallbackKey,
        label: null,
        seed: null,
        picks: [...cleanedTeamKeys],
        backupIn: null,
        backupOut: null,
        members: new Set(cleanedTeamKeys),
        backupTeams: new Set<string>(),
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        margins: [],
        deepestLevel: null,
        finalWins: 0,
        finalLosses: 0,
        status: null,
        isComplete: false,
      });

      for (const teamKey of cleanedTeamKeys) {
        teamToAlliance.set(teamKey, fallbackKey);
      }
    }

    return fallbackKey;
  };

  for (const match of playoffMatches) {
    const processAlliance = (
      ownAlliance: TbaMatchSimple["alliances"]["red"],
      opponentAlliance: TbaMatchSimple["alliances"]["blue"],
    ) => {
      const allianceKey =
        ensureFallbackAlliance(ownAlliance.team_keys) ??
        ensureFallbackAlliance(opponentAlliance.team_keys);

      if (!allianceKey) {
        return;
      }

      const aggregate = aggregates.get(allianceKey);

      if (!aggregate) {
        return;
      }

      const margin = ownAlliance.score - opponentAlliance.score;

      aggregate.matchesPlayed += 1;
      aggregate.margins.push(margin);
      aggregate.deepestLevel =
        !aggregate.deepestLevel ||
        (LEVEL_ORDER[match.comp_level] ?? 0) > (LEVEL_ORDER[aggregate.deepestLevel] ?? 0)
          ? match.comp_level
          : aggregate.deepestLevel;

      if (margin > 0) {
        aggregate.wins += 1;
      } else if (margin < 0) {
        aggregate.losses += 1;
      } else {
        aggregate.ties += 1;
      }

      if (match.comp_level === "f") {
        if (margin > 0) {
          aggregate.finalWins += 1;
        } else if (margin < 0) {
          aggregate.finalLosses += 1;
        }
      }

      for (const teamKey of ownAlliance.team_keys) {
        if (teamSet.has(teamKey)) {
          aggregate.members.add(teamKey);
          teamToAlliance.set(teamKey, allianceKey);
        }
      }
    };

    processAlliance(match.alliances.red, match.alliances.blue);
    processAlliance(match.alliances.blue, match.alliances.red);
  }

  const allianceCount = Math.max(aggregates.size, 1);
  const rawSignals = new Map<string, number | null>();
  const consistencyValues = new Map<string, number | null>();
  const marginValues = new Map<string, number | null>();

  for (const aggregate of aggregates.values()) {
    const consistency =
      aggregate.margins.length < 2
        ? null
        : clamp((1 - standardDeviation(aggregate.margins) / 20) * 2 - 1, -1, 1);

    consistencyValues.set(aggregate.key, consistency);
    marginValues.set(
      aggregate.key,
      aggregate.margins.length ? mean(aggregate.margins) : null,
    );
  }

  const normalizedConsistency = normalizeDistribution(consistencyValues, 1.2);
  const normalizedMargins = normalizeDistribution(marginValues, 1.2);

  for (const aggregate of aggregates.values()) {
    const record = toRecord(aggregate);
    const advancement = getAdvancement(aggregate);
    const winRate = getWinRate(record, aggregate.matchesPlayed);
    const winRateSignal =
      winRate === null ? 0 : clamp((winRate - 0.5) * 2, -1, 1);
    const seedSignal =
      aggregate.seed === null || allianceCount <= 1
        ? 0
        : clamp((1 - (aggregate.seed - 1) / (allianceCount - 1)) * 2 - 1, -1, 1);
    const marginStrength = normalizedMargins.get(aggregate.key) ?? 0;
    const advancementStrength = getAdvancementSignal(advancement);
    const allianceControl = clamp(
      winRateSignal * 0.58 + marginStrength * 0.42,
      -1,
      1,
    );
    const upsetStrength = clamp(
      advancementStrength - seedSignal * 0.62 + marginStrength * 0.16,
      -1,
      1,
    );

    rawSignals.set(
      aggregate.key,
      weightedAverageSignals([
        { value: advancementStrength, weight: 0.38 },
        { value: allianceControl, weight: 0.28 },
        { value: seedSignal, weight: 0.12 },
        { value: upsetStrength, weight: 0.22 },
      ]) ?? 0,
    );
  }

  const normalizedSignals = normalizeDistribution(rawSignals, 1.45);
  const results = new Map<string, PlayoffContext>();
  const alliances: PlayoffAllianceSummary[] = [];

  const getSlotForTeam = (
    aggregate: AllianceAggregate,
    teamKey: string,
  ): { slot: number | null; code: string | null } => {
    if (aggregate.seed === null) {
      return { slot: null, code: null };
    }

    if (aggregate.backupIn === teamKey) {
      return {
        slot: 4,
        code: `${aggregate.seed}-4`,
      };
    }

    const pickIndex = aggregate.picks.findIndex((pick) => pick === teamKey);

    if (pickIndex < 0) {
      return {
        slot: null,
        code: `${aggregate.seed}-?`,
      };
    }

    const slot = pickIndex === 0 ? 0 : pickIndex + 1;

    return {
      slot,
      code: `${aggregate.seed}-${slot}`,
    };
  };

  for (const aggregate of aggregates.values()) {
    const record = toRecord(aggregate);
    const advancement = getAdvancement(aggregate);
    const winRate = getWinRate(record, aggregate.matchesPlayed);
    const consistency = normalizedConsistency.get(aggregate.key) ?? null;
    const marginStrength = normalizedMargins.get(aggregate.key) ?? null;
    const seedSignal =
      aggregate.seed === null || allianceCount <= 1
        ? null
        : clamp((1 - (aggregate.seed - 1) / (allianceCount - 1)) * 2 - 1, -1, 1);
    const winRateSignal =
      winRate === null ? null : clamp((winRate - 0.5) * 2, -1, 1);
    const advancementStrength = getAdvancementSignal(advancement);
    const allianceControl =
      winRateSignal === null && marginStrength === null
        ? null
        : clamp(
            (winRateSignal ?? 0) * 0.58 + (marginStrength ?? 0) * 0.42,
            -1,
            1,
          );
    const upsetSignal =
      seedSignal === null
        ? null
        : clamp(
            advancementStrength - seedSignal * 0.62 + (marginStrength ?? 0) * 0.16,
            -1,
            1,
          );
    const isComplete =
      isClosedPlayoffStatus(aggregate.status) ||
      [...aggregate.members].some((teamKey) =>
        isClosedPlayoffStatus(getTeamPlayoffStatus(teamStatuses.get(teamKey))),
      );
    aggregate.isComplete = isComplete;
    const confidence = isComplete
      ? 1
      : clamp(
          Math.min(aggregate.matchesPlayed / 5, 1) * 0.72 +
            (aggregate.seed !== null ? 0.16 : 0) +
            (aggregate.status ? 0.08 : 0),
          0.14,
          1,
        );
    const sampleCompleteness = isComplete
      ? 1
      : clamp(
          aggregate.matchesPlayed / 4 +
            (aggregate.seed !== null ? 0.12 : 0) +
            (aggregate.status ? 0.08 : 0),
          0,
          1,
        );
    const baseSignal = rawSignals.get(aggregate.key) ?? 0;
    const fieldSignal = normalizedSignals.get(aggregate.key) ?? baseSignal;
    const combinedSignal = clamp(baseSignal * 0.82 + fieldSignal * 0.18, -1, 1);
    const confidenceShrink =
      1 - (1 - (confidence * 0.55 + sampleCompleteness * 0.45)) * 0.24;
    const score =
      aggregate.matchesPlayed === 0 && aggregate.seed === null
        ? null
        : roundTo(
            clamp(combinedSignal * confidenceShrink * 10, -10, 10),
            1,
          );
    const wonEvent =
      advancement === "champion" || aggregate.status?.toLowerCase() === "won";

    alliances.push({
      key: aggregate.key,
      label: aggregate.label,
      seed: aggregate.seed,
      picks: aggregate.picks,
      backupIn: aggregate.backupIn,
      backupOut: aggregate.backupOut,
      members: [...aggregate.members].sort(),
      matchesPlayed: aggregate.matchesPlayed,
      record,
      winRate,
      advancement,
      score,
      confidence,
      consistency,
      isComplete,
      wonEvent,
    });

    for (const teamKey of aggregate.members) {
      if (!teamSet.has(teamKey)) {
        continue;
      }

      const slotInfo = getSlotForTeam(aggregate, teamKey);

      results.set(teamKey, {
        allianceBased: true,
        allianceLabel: aggregate.label,
        seed: aggregate.seed,
        slot: slotInfo.slot,
        positionCode: slotInfo.code,
        isBackup: aggregate.backupTeams.has(teamKey),
        matchesPlayed: aggregate.matchesPlayed,
        record,
        winRate,
        advancement,
        score,
        marginStrength,
        upsetSignal,
        confidence,
        confidenceLevel: getConfidenceLevel(confidence),
        consistency,
        isComplete,
        breakdown: {
          advancementStrength,
          allianceControl,
          seedStrength: seedSignal,
          upsetStrength: upsetSignal,
          consistencyStrength: consistency,
        },
      });
    }
  }

  return {
    alliances: alliances.sort((left, right) => {
      const leftSeed = left.seed ?? Number.POSITIVE_INFINITY;
      const rightSeed = right.seed ?? Number.POSITIVE_INFINITY;
      return leftSeed - rightSeed;
    }),
    playoffMatches,
    results,
  };
}
