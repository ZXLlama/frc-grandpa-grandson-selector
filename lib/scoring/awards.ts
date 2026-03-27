import type {
  AwardRecipientSummary,
  AwardSummary,
  ChampionshipQualifier,
  ChampionshipQualifierReason,
  TeamScore,
} from "@/lib/types";
import type { TbaAward } from "@/lib/server/tba";

import type { PlayoffAllianceSummary } from "@/lib/scoring/playoffs";

function normalizeAwardName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isImpactAward(name: string): boolean {
  const normalized = normalizeAwardName(name);
  return (
    normalized.includes("impact award") ||
    normalized.includes("chairmans award") ||
    normalized.includes("chairman's award")
  );
}

function isEngineeringInspirationAward(name: string): boolean {
  return normalizeAwardName(name).includes("engineering inspiration");
}

function isRookieAllStarAward(name: string): boolean {
  return normalizeAwardName(name).includes("rookie all star");
}

function sortReasons(
  reasons: ChampionshipQualifierReason[],
): ChampionshipQualifierReason[] {
  const order: ChampionshipQualifierReason[] = [
    "winnerCaptain",
    "winnerFirstPick",
    "impactAward",
    "engineeringInspirationAward",
    "rookieAllStarAward",
  ];

  return [...reasons].sort(
    (left, right) => order.indexOf(left) - order.indexOf(right),
  );
}

export function getEventFinishedState(input: {
  awards: TbaAward[];
  alliances: PlayoffAllianceSummary[];
  endDate: string | null | undefined;
}): boolean {
  if (input.alliances.some((alliance) => alliance.wonEvent)) {
    return true;
  }

  if (input.awards.length > 0) {
    return true;
  }

  if (!input.endDate) {
    return false;
  }

  const endDate = new Date(`${input.endDate}T23:59:59Z`);
  return Number.isFinite(endDate.getTime()) && endDate.getTime() < Date.now();
}

export function buildAwardsSummary(input: {
  awards: TbaAward[];
  alliances: PlayoffAllianceSummary[];
  teams: TeamScore[];
}): {
  championshipQualifiers: ChampionshipQualifier[];
  allAwards: AwardSummary[];
} {
  const teamMap = new Map(input.teams.map((team) => [team.teamKey, team]));
  const qualifiers = new Map<string, ChampionshipQualifier>();

  const addQualifier = (
    teamKey: string,
    reason: ChampionshipQualifierReason,
  ) => {
    const team = teamMap.get(teamKey);

    if (!team) {
      return;
    }

    const existing = qualifiers.get(teamKey);

    if (existing) {
      if (!existing.reasons.includes(reason)) {
        existing.reasons.push(reason);
        existing.reasons = sortReasons(existing.reasons);
      }
      return;
    }

    qualifiers.set(teamKey, {
      teamKey,
      teamNumber: team.teamNumber,
      teamName: team.teamName,
      reasons: [reason],
    });
  };

  const winningAlliance =
    input.alliances.find((alliance) => alliance.wonEvent) ?? null;

  if (winningAlliance) {
    const captain = winningAlliance.picks[0];
    const firstPick = winningAlliance.picks[1];

    if (captain) {
      addQualifier(captain, "winnerCaptain");
    }

    if (firstPick) {
      addQualifier(firstPick, "winnerFirstPick");
    }
  }

  for (const award of input.awards) {
    let qualifierReason: ChampionshipQualifierReason | null = null;

    if (isImpactAward(award.name)) {
      qualifierReason = "impactAward";
    } else if (isEngineeringInspirationAward(award.name)) {
      qualifierReason = "engineeringInspirationAward";
    } else if (isRookieAllStarAward(award.name)) {
      qualifierReason = "rookieAllStarAward";
    }

    if (!qualifierReason) {
      continue;
    }

    for (const recipient of award.recipient_list) {
      if (recipient.team_key) {
        addQualifier(recipient.team_key, qualifierReason);
      }
    }
  }

  const allAwards = input.awards.map((award) => {
    const recipients: AwardRecipientSummary[] = award.recipient_list.map(
      (recipient) => {
        const team = recipient.team_key ? teamMap.get(recipient.team_key) : null;

        return {
          teamKey: recipient.team_key ?? null,
          teamNumber: team?.teamNumber ?? null,
          teamName: team?.teamName ?? null,
          awardee: recipient.awardee ?? null,
        };
      },
    );

    return {
      name: award.name,
      recipients,
    };
  });

  return {
    championshipQualifiers: [...qualifiers.values()].sort((left, right) => {
      if (left.teamNumber !== right.teamNumber) {
        return left.teamNumber - right.teamNumber;
      }

      return left.teamName.localeCompare(right.teamName);
    }),
    allAwards,
  };
}
