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
  if (locale === "zh-TW") {
    switch (event.fieldStrength.profile) {
      case "championshipFinals":
        return "這是 Einstein，頂端火力和中段硬度都不是一般賽區能拿來一起比的。";
      case "eliteDepth":
        return "高分段不只夠硬，中段也有實質抵抗力，這種賽區通常不會讓前排輕鬆散步。";
      case "topHeavy":
        return "前段很兇，但中後段掉得快，屬於頂端拉開、深度不足的賽區。";
      case "softField":
        return "高分段比例偏少，競爭力主要集中在少數隊伍，整體深度不算厚。";
      case "balancedDepth":
        return "高分段和中段都有一定比例，強度分布比一般賽區更均衡。";
      case "limitedData":
      default:
        return "目前資料量還不算厚，先看分布和進度，別急著下太重的總結。";
    }
  }

  switch (event.fieldStrength.profile) {
    case "championshipFinals":
      return "This is Einstein. The ceiling and the depth both sit well above what normal events can match.";
    case "eliteDepth":
      return "The top band is real and the middle still bites. This field does not get gentle after the headliners.";
    case "topHeavy":
      return "The front of the field is dangerous, but the drop into the middle and lower half is obvious.";
    case "softField":
      return "The high-end share is limited, so most of the real punch lives in a small group of teams.";
    case "balancedDepth":
      return "The stronger bands and the middle are both represented, giving the field a more balanced shape.";
    case "limitedData":
    default:
      return "The sample is still thin, so the field read stays cautious and distribution-first.";
  }
}

export function getFieldStrengthReview(
  locale: Locale,
  event: EventSummary,
): string[] {
  const topBandShare = getCombinedShare(event, ["grandpa", "father"]);
  const lowerBandShare = getCombinedShare(event, ["son", "grandson"]);
  const peerShare = event.fieldStrength.distribution.peer ?? 0;
  const topAverage = event.fieldStrength.topAverage ?? 0;
  const depthAverage = event.fieldStrength.depthAverage ?? 0;
  const median = event.fieldStrength.median ?? 0;

  if (locale === "zh-TW") {
    const line1 =
      event.fieldStrength.profile === "championshipFinals"
        ? "這場就是 Einstein，頂端不是只有幾支明星隊，連中段都帶著世界級硬度。"
        : `高分段約占 ${formatRatio(topBandShare)}，中段約占 ${formatRatio(peerShare)}，低分段約占 ${formatRatio(lowerBandShare)}。`;
    const line2 = `頂端平均分數約 ${topAverage.toFixed(1)}，中段平均約 ${depthAverage.toFixed(1)}，中位數約 ${median.toFixed(1)}。`;
    const line3 =
      event.fieldStrength.profile === "eliteDepth"
        ? "前面幾支當然硬，但真正麻煩的是中段沒有鬆，想一路碾過去不太現實。"
        : event.fieldStrength.profile === "topHeavy"
          ? "頂端很亮，後面卻接不太上，這種賽區容易出現前段很兇、後段補不滿的斷層。"
          : event.fieldStrength.profile === "softField"
            ? "少數強隊能把節奏拉高，但整體下半區偏軟，深度不足的問題很明顯。"
            : event.fieldStrength.profile === "balancedDepth"
              ? "不是只有前排有威脅，中段也會回嘴，整體競爭感比普通賽區完整。"
              : "資料量還不夠厚，這份總評偏保守，主要用來看輪廓而不是下死結論。";
    const line4 =
      topBandShare >= 0.42
        ? "要在這裡站上前段，不能只靠抽到好賽程，真的要有持續做分的底子。"
        : lowerBandShare >= 0.42
          ? "下半區偏軟，強隊如果自己不失誤，通常能把比賽節奏抓得很舒服。"
          : "中段比例不低，很多對戰不會有免費局，排名含金量通常比表面更吃內容。";

    return [line1, line2, line3, line4];
  }

  const line1 =
    event.fieldStrength.profile === "championshipFinals"
      ? "This is Einstein. Even the middle of the field hits at a level normal events rarely touch."
      : `The top band makes up ${formatRatio(topBandShare)}, the middle band ${formatRatio(peerShare)}, and the lower band ${formatRatio(lowerBandShare)}.`;
  const line2 = `Top-end average lands around ${topAverage.toFixed(1)}, depth average around ${depthAverage.toFixed(1)}, and the median around ${median.toFixed(1)}.`;
  const line3 =
    event.fieldStrength.profile === "eliteDepth"
      ? "The danger does not stop after the headline teams. The middle can still punish mistakes."
      : event.fieldStrength.profile === "topHeavy"
        ? "The top is real, but the shelf drops hard after it. Depth is the issue, not ceiling."
        : event.fieldStrength.profile === "softField"
          ? "A few strong teams can drive the story, but the lower half stays soft enough to expose the lack of depth."
          : event.fieldStrength.profile === "balancedDepth"
            ? "This field has enough competent middle weight to keep the bracket honest."
            : "The sample is still limited, so this read stays careful and outline-level.";
  const line4 =
    topBandShare >= 0.42
      ? "Strong teams still need to prove themselves here. A kind schedule alone should not carry the day."
      : lowerBandShare >= 0.42
        ? "The softer lower half gives real contenders room to control matches if they stay clean."
        : "The middle has enough resistance that most decent seeds still have to earn their way forward.";

  return [line1, line2, line3, line4];
}

export function getFieldDistributionEntries(
  categoryLabels: Record<ScoreCategory, string>,
  event: EventSummary,
): Array<{ category: ScoreCategory; label: string; ratio: number }> {
  const order: ScoreCategory[] = [
    "grandson",
    "son",
    "peer",
    "father",
    "grandpa",
  ];

  return order.map((category) => ({
    category,
    label: categoryLabels[category],
    ratio: event.fieldStrength.distribution[category] ?? 0,
  }));
}
