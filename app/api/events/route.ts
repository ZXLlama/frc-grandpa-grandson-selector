import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getEventsForYear, isTbaError } from "@/lib/server/tba";
import type { EventOption, EventsResponse } from "@/lib/types";

export const runtime = "nodejs";

const yearSchema = z.coerce.number().int().min(1992).max(2100);

function mapEvent(event: Awaited<ReturnType<typeof getEventsForYear>>[number]): EventOption {
  return {
    key: event.key,
    name: event.name,
    eventCode: event.event_code,
    eventType: event.event_type,
    districtKey: event.district?.key ?? null,
    districtDisplay:
      event.district?.display_name ?? event.district?.abbreviation ?? null,
    city: event.city ?? null,
    stateProv: event.state_prov ?? null,
    country: event.country ?? null,
    startDate: event.start_date ?? null,
    endDate: event.end_date ?? null,
    year: event.year,
  };
}

export async function GET(request: NextRequest) {
  const parsedYear = yearSchema.safeParse(request.nextUrl.searchParams.get("year"));

  if (!parsedYear.success) {
    return NextResponse.json(
      { error: "A valid year query is required." },
      { status: 400 },
    );
  }

  try {
    const events = await getEventsForYear(parsedYear.data);
    const payload: EventsResponse = {
      year: parsedYear.data,
      events: events
        .map(mapEvent)
        .sort((left, right) => {
          const leftDate = left.startDate ?? "";
          const rightDate = right.startDate ?? "";

          if (leftDate !== rightDate) {
            return rightDate.localeCompare(leftDate);
          }

          return left.name.localeCompare(right.name);
        }),
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
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
      { error: "Unexpected server error while loading events." },
      { status: 500 },
    );
  }
}
