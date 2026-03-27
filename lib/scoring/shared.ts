import { clamp } from "@/lib/constants";
import type {
  TeamRecord,
} from "@/lib/types";
import type {
  TbaAward,
  TbaMatchSimple,
  TbaRankingEntry,
  TbaTeamSimple,
} from "@/lib/server/tba";

const COMP_LEVEL_ORDER: Record<string, number> = {
  qm: 1,
  ef: 2,
  qf: 3,
  sf: 4,
  f: 5,
};

export function isPlayedMatch(match: TbaMatchSimple): boolean {
  return (
    match.alliances.red.score >= 0 &&
    match.alliances.blue.score >= 0 &&
    match.alliances.red.team_keys.length > 0 &&
    match.alliances.blue.team_keys.length > 0
  );
}

export function getMatchOrder(match: TbaMatchSimple): number {
  const timestamp =
    match.actual_time ?? match.predicted_time ?? match.time ?? 0;

  return (
    timestamp * 100_000 +
    (COMP_LEVEL_ORDER[match.comp_level] ?? 9) * 10_000 +
    match.set_number * 100 +
    match.match_number
  );
}

export function resolveTeamName(team: TbaTeamSimple): string {
  return team.nickname?.trim() || team.name?.trim() || `Team ${team.team_number}`;
}

export function buildAwardMap(awards: TbaAward[]): Map<string, string[]> {
  const awardsByTeam = new Map<string, string[]>();

  for (const award of awards) {
    for (const recipient of award.recipient_list) {
      if (!recipient.team_key) {
        continue;
      }

      const teamAwards = awardsByTeam.get(recipient.team_key) ?? [];
      teamAwards.push(award.name);
      awardsByTeam.set(recipient.team_key, teamAwards);
    }
  }

  return awardsByTeam;
}

export function scoreAwards(awards: string[]): number {
  if (!awards.length) {
    return 0;
  }

  const total = awards.reduce((sum, awardName) => {
    const normalized = awardName.toLowerCase();

    if (
      normalized.includes("winner") ||
      normalized.includes("impact") ||
      normalized.includes("chairman") ||
      normalized.includes("engineering inspiration")
    ) {
      return sum + 0.28;
    }

    if (
      normalized.includes("finalist") ||
      normalized.includes("rookie all star") ||
      normalized.includes("industrial design") ||
      normalized.includes("quality")
    ) {
      return sum + 0.18;
    }

    return sum + 0.1;
  }, 0);

  return clamp(total, 0, 0.4);
}

export function getRankingRecord(
  ranking: TbaRankingEntry | null,
  fallback: TeamRecord,
): TeamRecord {
  return {
    wins: ranking?.record?.wins ?? fallback.wins,
    losses: ranking?.record?.losses ?? fallback.losses,
    ties: ranking?.record?.ties ?? fallback.ties,
  };
}

export function getWinRate(record: TeamRecord, matchesPlayed: number): number | null {
  if (matchesPlayed <= 0) {
    return null;
  }

  return (record.wins + record.ties * 0.5) / matchesPlayed;
}
