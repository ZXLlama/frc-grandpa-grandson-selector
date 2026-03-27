import type {
  ScoreCategory,
  SortDirection,
  TeamScore,
  TeamSortKey,
} from "@/lib/types";

export type DisplayedTeamEntry = {
  team: TeamScore;
  displayedScore: number;
  displayedCategory: ScoreCategory;
  isReference: boolean;
};

function compareNumbers(
  left: number,
  right: number,
  direction: SortDirection,
): number {
  return direction === "asc" ? left - right : right - left;
}

export function sortDisplayedTeams(
  teams: DisplayedTeamEntry[],
  sortKey: TeamSortKey,
  direction: SortDirection,
): DisplayedTeamEntry[] {
  return [...teams].sort((left, right) => {
    if (sortKey === "teamNumber") {
      return compareNumbers(left.team.teamNumber, right.team.teamNumber, direction);
    }

    if (sortKey === "ranking") {
      const leftRank = left.team.ranking?.rank ?? Number.POSITIVE_INFINITY;
      const rightRank = right.team.ranking?.rank ?? Number.POSITIVE_INFINITY;

      if (!Number.isFinite(leftRank) && !Number.isFinite(rightRank)) {
        return left.team.teamNumber - right.team.teamNumber;
      }

      if (!Number.isFinite(leftRank)) {
        return 1;
      }

      if (!Number.isFinite(rightRank)) {
        return -1;
      }

      const comparison = compareNumbers(leftRank, rightRank, direction);
      return comparison || left.team.teamNumber - right.team.teamNumber;
    }

    const comparison = compareNumbers(
      left.displayedScore,
      right.displayedScore,
      direction,
    );

    return comparison || left.team.teamNumber - right.team.teamNumber;
  });
}
