import { getDictionary, type Dictionary } from "@/lib/i18n";
import type { EventSummary, Locale, ScoreCategory } from "@/lib/types";

function formatRatio(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function getCombinedShare(
  event: EventSummary,
  categories: ScoreCategory[],
): number {
  return categories.reduce(
    (sum, category) => sum + (event.fieldStrength.distribution[category] ?? 0),
    0,
  );
}

export function getFieldStrengthSummary(
  locale: Locale,
  event: EventSummary,
): string {
  const dictionary = getDictionary(locale);
  return dictionary.eventStrengthProfiles[event.fieldStrength.profile];
}

export function getFieldStrengthReview(
  locale: Locale,
  event: EventSummary,
): string[] {
  const strongShare = getCombinedShare(event, ["grandpa", "father"]);
  const weakShare = getCombinedShare(event, ["son", "grandson"]);
  const peerShare = event.fieldStrength.distribution.peer ?? 0;
  const topAverage = event.fieldStrength.topAverage ?? 0;
  const depthAverage = event.fieldStrength.depthAverage ?? 0;
  const median = event.fieldStrength.median ?? 0;

  if (locale === "zh-TW") {
    const line1 =
      event.fieldStrength.profile === "championshipFinals"
        ? "這就是 Einstein，前段與深度都直接拉滿，普通賽區根本不是同一個量級。"
        : `爺爺加爸爸區合計 ${formatRatio(strongShare)}，兒子加孫子區合計 ${formatRatio(weakShare)}，平輩區佔 ${formatRatio(peerShare)}。`;
    const line2 = `頂端平均約 ${topAverage.toFixed(1)}，中段平均約 ${depthAverage.toFixed(1)}，中位數約 ${median.toFixed(1)}。`;
    const line3 =
      event.fieldStrength.profile === "eliteDepth"
        ? "這種場不是只有頭幾支會打，連中段都會咬人，整體密度夠高。"
        : event.fieldStrength.profile === "topHeavy"
          ? "前排很硬，但往後掉得快，強隊和中下段之間的斷層很明顯。"
          : event.fieldStrength.profile === "softField"
            ? "整體下緣偏軟，少數強隊能把場面撐起來，但深度不夠厚。"
            : event.fieldStrength.profile === "balancedDepth"
            ? "分布相對平均，沒有明顯空心化，中段隊伍的存在感很夠。"
            : "樣本還不算厚，現在只能先看輪廓，別急著把整區定型。";
    const line4 =
      strongShare >= 0.4
        ? "如果你想在這區穩穩打進後段，光靠表面排名不夠，硬實力得真的站得住。"
        : weakShare >= 0.4
          ? "這區下緣偏軟，前段隊伍只要不失常，通常就能把節奏抓在手上。"
          : "這區沒有明顯白送的位置，前中後段之間都還有互咬空間。";

    return [line1, line2, line3, line4];
  }

  const line1 =
    event.fieldStrength.profile === "championshipFinals"
      ? "This is Einstein. The top-end and the depth both live on a shelf normal events do not reach."
      : `Grandpa plus Father teams make up ${formatRatio(strongShare)}, Peer teams make up ${formatRatio(peerShare)}, and Son plus Grandson teams make up ${formatRatio(weakShare)}.`;
  const line2 = `Top-end average sits around ${topAverage.toFixed(1)}, the middle band around ${depthAverage.toFixed(1)}, and the median around ${median.toFixed(1)}.`;
  const line3 =
    event.fieldStrength.profile === "eliteDepth"
      ? "This field stays dangerous well past the headline teams. The middle of the bracket has real bite."
      : event.fieldStrength.profile === "topHeavy"
        ? "The ceiling is real, but the drop after the top group is obvious."
        : event.fieldStrength.profile === "softField"
          ? "A few notable teams can carry the story, but the floor is still soft."
          : event.fieldStrength.profile === "balancedDepth"
            ? "The spread is healthier than average, with useful resistance across the middle."
            : "The sample is still a little thin, so the field read stays conservative.";
  const line4 =
    strongShare >= 0.4
      ? "A team that wants to control this event has to be legitimately good, not just nicely seeded."
      : weakShare >= 0.4
        ? "The lower half is soft enough that strong teams should punish mistakes and stay comfortable."
        : "There is enough bite across the field that nobody gets a free walk through the middle.";

  return [line1, line2, line3, line4];
}

export function getFieldDistributionEntries(
  dictionary: Dictionary,
  event: EventSummary,
): Array<{ category: ScoreCategory; label: string; ratio: number }> {
  const order: ScoreCategory[] = [
    "grandpa",
    "father",
    "peer",
    "son",
    "grandson",
  ];

  return order.map((category) => ({
    category,
    label: dictionary.categories[category],
    ratio: event.fieldStrength.distribution[category] ?? 0,
  }));
}
