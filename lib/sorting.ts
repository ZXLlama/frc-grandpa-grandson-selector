import type {
  AnalysisTab,
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
  analysisTab: AnalysisTab,
): DisplayedTeamEntry[] {
  return [...teams].sort((left, right) => {
    if (sortKey === "teamNumber") {
      return compareNumbers(
        Number(left.team.teamNumber),
        Number(right.team.teamNumber),
        direction,
      );
    }

    if (sortKey === "ranking") {
      const leftRank =
        analysisTab === "playoff"
          ? left.team.playoff?.seed ?? left.team.ranking?.rank ?? Number.POSITIVE_INFINITY
          : left.team.ranking?.rank ?? Number.POSITIVE_INFINITY;
      const rightRank =
        analysisTab === "playoff"
          ? right.team.playoff?.seed ?? right.team.ranking?.rank ?? Number.POSITIVE_INFINITY
          : right.team.ranking?.rank ?? Number.POSITIVE_INFINITY;

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
      return comparison || Number(left.team.teamNumber) - Number(right.team.teamNumber);
    }

    const comparison = compareNumbers(
      left.displayedScore,
      right.displayedScore,
      direction,
    );

    return comparison || Number(left.team.teamNumber) - Number(right.team.teamNumber);
  });
}
