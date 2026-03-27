import { clamp } from "@/lib/constants";

export function mean(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function median(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

export function standardDeviation(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }

  const average = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    values.length;

  return Math.sqrt(variance);
}

export function safeDivide(
  numerator: number,
  denominator: number,
): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

export function normalizeDistribution(
  values: Map<string, number | null>,
  divisor = 1.6,
): Map<string, number | null> {
  const numericValues = [...values.values()].filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  const normalized = new Map<string, number | null>();

  if (!numericValues.length) {
    for (const key of values.keys()) {
      normalized.set(key, null);
    }

    return normalized;
  }

  const average = mean(numericValues);
  const deviation = standardDeviation(numericValues);

  for (const [key, value] of values.entries()) {
    if (value === null || !Number.isFinite(value)) {
      normalized.set(key, null);
      continue;
    }

    if (deviation < 0.0001) {
      normalized.set(key, 0);
      continue;
    }

    normalized.set(key, clamp((value - average) / (deviation * divisor), -1, 1));
  }

  return normalized;
}

export function normalizeValue(
  value: number,
  meanValue: number,
  deviation: number,
  divisor = 1,
): number {
  if (!Number.isFinite(value) || !Number.isFinite(meanValue) || deviation < 0.0001) {
    return 0;
  }

  return clamp((value - meanValue) / (deviation * divisor), -1, 1);
}
