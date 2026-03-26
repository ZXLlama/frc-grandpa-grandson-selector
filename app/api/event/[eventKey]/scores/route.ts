import { NextResponse } from "next/server";
import { z } from "zod";

import { computeEventScores } from "@/lib/scoring/engine";
import {
  getEventAwards,
  getEventByKey,
  getEventMatches,
  getEventRankings,
  getEventTeams,
  isTbaError,
} from "@/lib/server/tba";

export const runtime = "nodejs";

const paramsSchema = z.object({
  eventKey: z.string().trim().min(1).max(64).regex(/^[a-z0-9_]+$/i),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventKey: string }> },
) {
  const rawParams = await context.params;
  const parsedParams = paramsSchema.safeParse(rawParams);

  if (!parsedParams.success) {
    return NextResponse.json(
      { error: "Invalid event key." },
      { status: 400 },
    );
  }

  try {
    const eventKey = parsedParams.data.eventKey;
    const [eventResult, teamsResult, rankingsResult, matchesResult, awardsResult] =
      await Promise.allSettled([
        getEventByKey(eventKey),
        getEventTeams(eventKey),
        getEventRankings(eventKey),
        getEventMatches(eventKey),
        getEventAwards(eventKey),
      ]);

    if (eventResult.status === "rejected") {
      throw eventResult.reason;
    }

    if (teamsResult.status === "rejected") {
      throw teamsResult.reason;
    }

    const payload = computeEventScores({
      event: eventResult.value,
      teams: teamsResult.value,
      rankings: rankingsResult.status === "fulfilled" ? rankingsResult.value : null,
      matches: matchesResult.status === "fulfilled" ? matchesResult.value : [],
      awards: awardsResult.status === "fulfilled" ? awardsResult.value : [],
    });

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=45, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    if (isTbaError(error)) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Unexpected server error while analyzing the event." },
      { status: 500 },
    );
  }
}
