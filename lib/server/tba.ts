import "server-only";

import { z } from "zod";

import { getCacheEntry, setCacheEntry } from "@/lib/server/simple-cache";

const TBA_BASE_URL = "https://www.thebluealliance.com/api/v3";
const REQUEST_TIMEOUT_MS = 8_000;

const districtSchema = z
  .object({
    key: z.string().optional(),
    abbreviation: z.string().nullable().optional(),
    display_name: z.string().nullable().optional(),
    year: z.number().int().optional(),
  })
  .passthrough()
  .nullable();

const eventSimpleSchema = z
  .object({
    key: z.string(),
    name: z.string(),
    event_code: z.string(),
    event_type: z.number().int(),
    district: districtSchema,
    city: z.string().nullable().optional(),
    state_prov: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    year: z.number().int(),
  })
  .passthrough();

const teamSimpleSchema = z
  .object({
    key: z.string(),
    team_number: z.number().int(),
    nickname: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state_prov: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
  })
  .passthrough();

const wltRecordSchema = z
  .object({
    wins: z.number().int().nullable().optional(),
    losses: z.number().int().nullable().optional(),
    ties: z.number().int().nullable().optional(),
  })
  .passthrough()
  .nullable();

const rankingEntrySchema = z
  .object({
    matches_played: z.number().int(),
    qual_average: z.number().nullable().optional(),
    extra_stats: z.array(z.number()).default([]),
    sort_orders: z.array(z.number()).default([]),
    record: wltRecordSchema,
    rank: z.number().int(),
    dq: z.number().int(),
    team_key: z.string(),
  })
  .passthrough();

const rankingsSchema = z
  .object({
    rankings: z.array(rankingEntrySchema).default([]),
    extra_stats_info: z
      .array(
        z
          .object({
            name: z.string(),
            precision: z.number(),
          })
          .passthrough(),
      )
      .default([]),
    sort_order_info: z
      .array(
        z
          .object({
            name: z.string(),
            precision: z.number(),
          })
          .passthrough(),
      )
      .nullable()
      .default(null),
  })
  .passthrough()
  .nullable();

const matchAllianceSchema = z
  .object({
    score: z.number().int(),
    team_keys: z.array(z.string()).default([]),
    surrogate_team_keys: z.array(z.string()).default([]),
    dq_team_keys: z.array(z.string()).default([]),
  })
  .passthrough();

const matchSimpleSchema = z
  .object({
    key: z.string(),
    comp_level: z.string(),
    set_number: z.number().int(),
    match_number: z.number().int(),
    alliances: z.object({
      red: matchAllianceSchema,
      blue: matchAllianceSchema,
    }),
    winning_alliance: z.enum(["red", "blue", ""]),
    event_key: z.string(),
    time: z.number().int().nullable().optional(),
    predicted_time: z.number().int().nullable().optional(),
    actual_time: z.number().int().nullable().optional(),
  })
  .passthrough();

const awardSchema = z
  .object({
    name: z.string(),
    award_type: z.number().int(),
    event_key: z.string(),
    recipient_list: z
      .array(
        z
          .object({
            team_key: z.string().nullable().optional(),
            awardee: z.string().nullable().optional(),
          })
          .passthrough(),
      )
      .default([]),
    year: z.number().int(),
  })
  .passthrough();

const allianceSchema = z
  .object({
    name: z.string().nullable().optional(),
    picks: z.array(z.string()).default([]),
    declines: z.array(z.string()).default([]),
    backup: z
      .object({
        in: z.string().nullable().optional(),
        out: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    status: z
      .object({
        status: z.string().nullable().optional(),
        level: z.string().nullable().optional(),
        playoff_average: z.number().nullable().optional(),
        record: wltRecordSchema.optional(),
        current_level_record: wltRecordSchema.optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

const oprsSchema = z
  .object({
    oprs: z.record(z.string(), z.number()).default({}),
    dprs: z.record(z.string(), z.number()).default({}),
    ccwms: z.record(z.string(), z.number()).default({}),
  })
  .passthrough()
  .nullable();

export type TbaEventSimple = z.infer<typeof eventSimpleSchema>;
export type TbaTeamSimple = z.infer<typeof teamSimpleSchema>;
export type TbaRankings = z.infer<typeof rankingsSchema>;
export type TbaRankingEntry = z.infer<typeof rankingEntrySchema>;
export type TbaMatchSimple = z.infer<typeof matchSimpleSchema>;
export type TbaAward = z.infer<typeof awardSchema>;
export type TbaAlliance = z.infer<typeof allianceSchema>;
export type TbaOprs = z.infer<typeof oprsSchema>;

export class TbaError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
  ) {
    super(message);
    this.name = "TbaError";
  }
}

export function isTbaError(error: unknown): error is TbaError {
  return error instanceof TbaError;
}

function parseCacheMaxAge(
  cacheControl: string | null,
  fallbackMs: number,
): number {
  if (!cacheControl) {
    return fallbackMs;
  }

  const match = cacheControl.match(/max-age=(\d+)/i);

  if (!match) {
    return fallbackMs;
  }

  const seconds = Number.parseInt(match[1], 10);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return fallbackMs;
  }

  return seconds * 1_000;
}

async function fetchTbaJson<T>(
  path: string,
  schema: z.ZodType<T>,
  fallbackTtlMs: number,
): Promise<T> {
  const apiKey = process.env.TBA_API_KEY;

  if (!apiKey) {
    throw new TbaError(
      "TBA_API_KEY is not configured. Add it to your Vercel or local environment variables.",
      500,
    );
  }

  const cacheKey = `tba:${path}`;
  const cached = getCacheEntry<T>(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const headers = new Headers({
    Accept: "application/json",
    "X-TBA-Auth-Key": apiKey,
  });

  if (cached?.etag) {
    headers.set("If-None-Match", cached.etag);
  }

  let response: Response;

  try {
    response = await fetch(`${TBA_BASE_URL}${path}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    if (cached?.value) {
      return cached.value;
    }

    throw new TbaError("Unable to reach The Blue Alliance right now.", 502);
  }

  if (response.status === 304 && cached) {
    setCacheEntry(cacheKey, {
      ...cached,
      expiresAt: Date.now() + fallbackTtlMs,
    });

    return cached.value;
  }

  if (!response.ok) {
    if (cached?.value && response.status >= 500) {
      return cached.value;
    }

    throw new TbaError(
      `The Blue Alliance request failed with status ${response.status}.`,
      response.status >= 500 ? 502 : response.status,
    );
  }

  let json: unknown;

  try {
    json = await response.json();
  } catch {
    if (cached?.value) {
      return cached.value;
    }

    throw new TbaError("The Blue Alliance returned invalid JSON.", 502);
  }

  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    if (cached?.value) {
      return cached.value;
    }

    throw new TbaError("The Blue Alliance response format was not valid.", 502);
  }

  const ttlMs = parseCacheMaxAge(
    response.headers.get("Cache-Control"),
    fallbackTtlMs,
  );

  setCacheEntry(cacheKey, {
    value: parsed.data,
    etag: response.headers.get("ETag") ?? undefined,
    expiresAt: Date.now() + ttlMs,
  });

  return parsed.data;
}

export async function getEventsForYear(year: number): Promise<TbaEventSimple[]> {
  return fetchTbaJson(
    `/events/${year}/simple`,
    z.array(eventSimpleSchema),
    300_000,
  );
}

export async function getEventByKey(
  eventKey: string,
): Promise<TbaEventSimple> {
  return fetchTbaJson(`/event/${eventKey}/simple`, eventSimpleSchema, 120_000);
}

export async function getEventTeams(
  eventKey: string,
): Promise<TbaTeamSimple[]> {
  return fetchTbaJson(
    `/event/${eventKey}/teams/simple`,
    z.array(teamSimpleSchema),
    90_000,
  );
}

export async function getEventRankings(
  eventKey: string,
): Promise<TbaRankings> {
  return fetchTbaJson(`/event/${eventKey}/rankings`, rankingsSchema, 45_000);
}

export async function getEventMatches(
  eventKey: string,
): Promise<TbaMatchSimple[]> {
  return fetchTbaJson(
    `/event/${eventKey}/matches/simple`,
    z.array(matchSimpleSchema),
    30_000,
  );
}

export async function getEventAwards(
  eventKey: string,
): Promise<TbaAward[]> {
  return fetchTbaJson(
    `/event/${eventKey}/awards`,
    z.array(awardSchema),
    120_000,
  );
}

export async function getEventAlliances(
  eventKey: string,
): Promise<TbaAlliance[]> {
  return fetchTbaJson(
    `/event/${eventKey}/alliances`,
    z.array(allianceSchema),
    45_000,
  );
}

export async function getEventOprs(
  eventKey: string,
): Promise<TbaOprs> {
  return fetchTbaJson(`/event/${eventKey}/oprs`, oprsSchema, 45_000);
}
