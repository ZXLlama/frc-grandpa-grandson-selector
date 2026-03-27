import { APP_NAME, getEventTypeKey } from "@/lib/constants";
import type {
  ConfidenceLevel,
  EventStrengthProfile,
  Locale,
  PlayoffFinish,
  ScoreCategory,
  SortDirection,
  TeamSortKey,
} from "@/lib/types";

export const DEFAULT_LOCALE: Locale = "zh-TW";

export interface Dictionary {
  appTitle: string;
  appSubtitle: string;
  controlsTitle: string;
  modelHint: string;
  poweredBy: string;
  yearLabel: string;
  districtLabel: string;
  competitionLabel: string;
  eventLabel: string;
  allDistricts: string;
  allCompetitionTypes: string;
  chooseEvent: string;
  noEventsAvailable: string;
  loadingEvents: string;
  eventLoadFailed: string;
  scoreLoadFailed: string;
  analyze: string;
  analyzing: string;
  resultsTitle: string;
  teamsLabel: string;
  qualificationMatchesLabel: string;
  playoffMatchesLabel: string;
  emptyTitle: string;
  emptyBody: string;
  noTeamsTitle: string;
  sampleMatchesLabel: string;
  recordLabel: string;
  confidenceLabel: string;
  confidenceLevelLabel: string;
  rankLabel: string;
  unrankedLabel: string;
  referenceModeLabel: string;
  referenceModeHint: string;
  defaultReferenceOption: string;
  referenceBadge: string;
  overallScoreLabel: string;
  relativeScoreLabel: string;
  qualificationStrengthLabel: string;
  playoffContextLabel: string;
  playoffAllianceNote: string;
  seedLabel: string;
  noPlayoffDataLabel: string;
  noPlayoffMatchesYet: string;
  sortByLabel: string;
  sortDirectionLabel: string;
  eventStrengthLabel: string;
  overallMethodNote: string;
  language: {
    traditionalChinese: string;
    english: string;
  };
  categories: Record<ScoreCategory, string>;
  categoryCaptions: Record<ScoreCategory, string>;
  eventTierLabels: Record<ScoreCategory, string>;
  confidenceBands: Record<ConfidenceLevel, string>;
  sortOptions: Record<TeamSortKey, string>;
  sortDirections: Record<SortDirection, string>;
  eventStrengthProfiles: Record<EventStrengthProfile, string>;
  playoffAdvancement: Record<PlayoffFinish, string>;
  eventTypes: Record<string, string>;
  insights: {
    noQualificationData: string;
    highRankSoftSchedule: string;
    underseededStrongMetrics: string;
    consistentQualification: string;
    stableContribution: string;
    risingForm: string;
    slippingForm: string;
    toughSchedule: string;
    softSchedule: string;
    volatilePerformance: string;
    playoffAllianceBoost: string;
    playoffAllianceValidated: string;
    playoffSeedOnly: string;
    playoffNoMatches: string;
    lowConfidence: string;
    mediumConfidence: string;
    neutral: string;
  };
  relativeComparisonSelf: string;
  relativeComparisonVs: string;
}

const dictionaries: Record<Locale, Dictionary> = {
  "zh-TW": {
    appTitle: APP_NAME,
    appSubtitle:
      "使用 The Blue Alliance 的即時賽事資料，分開分析 qualification 與 playoff alliance context，快速看出誰是爺爺、爸爸、平輩、兒子、孫子。",
    controlsTitle: "事件分析",
    modelHint:
      "整體分數以 qualification 表現為主，並用賽程校正、搭檔與對手強度、近期趨勢、穩定度做校準；若已有 playoffs，會另外加入聯盟層級的 alliance context，不會直接把 eliminations 當成 qualification 重算。",
    poweredBy: "Powered by The Blue Alliance",
    yearLabel: "年份",
    districtLabel: "District 篩選",
    competitionLabel: "賽事類型",
    eventLabel: "賽事",
    allDistricts: "全部 District",
    allCompetitionTypes: "全部類型",
    chooseEvent: "選擇賽事",
    noEventsAvailable: "這個年份目前沒有可選擇的賽事。",
    loadingEvents: "載入賽事中...",
    eventLoadFailed: "無法載入賽事列表。",
    scoreLoadFailed: "分析失敗，請稍後再試。",
    analyze: "開始分析",
    analyzing: "分析中...",
    resultsTitle: "隊伍分析",
    teamsLabel: "隊伍數",
    qualificationMatchesLabel: "Qualification 場次",
    playoffMatchesLabel: "Playoff 場次",
    emptyTitle: "先選一個賽事",
    emptyBody:
      "選擇年份與賽事後，按下開始分析，系統會在伺服器端向 TBA 取得資料並計算整個 event 的分數。",
    noTeamsTitle: "這個賽事目前還沒有可分析的隊伍資料。",
    sampleMatchesLabel: "Qualification 已打",
    recordLabel: "Qualification 戰績",
    confidenceLabel: "資料信心",
    confidenceLevelLabel: "信心等級",
    rankLabel: "排名",
    unrankedLabel: "未排名",
    referenceModeLabel: "輩分基準",
    referenceModeHint:
      "預設用整個 event 的模型判定輩分，也可以切換成以特定隊伍為基準，直接看相對差距。",
    defaultReferenceOption: "預設模式（event 基準）",
    referenceBadge: "基準隊伍",
    overallScoreLabel: "整體分數",
    relativeScoreLabel: "相對分數",
    qualificationStrengthLabel: "Qualification 強度",
    playoffContextLabel: "Playoff 聯盟脈絡",
    playoffAllianceNote:
      "Playoff 表現以固定 alliance 為單位評估，代表聯盟脈絡，不會被當成純個人實力。",
    seedLabel: "聯盟種子",
    noPlayoffDataLabel: "尚無 playoff 資料",
    noPlayoffMatchesYet: "已知 alliance context，但尚未出現 playoff 比賽結果。",
    sortByLabel: "排序方式",
    sortDirectionLabel: "方向",
    eventStrengthLabel: "場次強度",
    overallMethodNote:
      "整體分數以 qualification 為主；若已有 elimination 資料，只會用較低權重加入 alliance-based playoff context。",
    language: {
      traditionalChinese: "繁中",
      english: "EN",
    },
    categories: {
      grandpa: "爺爺",
      father: "爸爸",
      peer: "平輩",
      son: "兒子",
      grandson: "孫子",
    },
    categoryCaptions: {
      grandpa: "明顯壓住全場",
      father: "穩定高於平均",
      peer: "接近場上中位",
      son: "略低於場上平均",
      grandson: "目前明顯落後",
    },
    eventTierLabels: {
      grandpa: "爺爺局",
      father: "爸爸局",
      peer: "平輩局",
      son: "兒子局",
      grandson: "孫子局",
    },
    confidenceBands: {
      high: "高",
      medium: "中",
      low: "低",
    },
    sortOptions: {
      score: "分數",
      teamNumber: "隊號",
      ranking: "排名",
    },
    sortDirections: {
      asc: "由小到大",
      desc: "由大到小",
    },
    eventStrengthProfiles: {
      balancedDepth: "整體深度不錯，場上競爭度均衡。",
      eliteDepth: "前段強度高，而且中段深度也夠，屬於偏硬的 field。",
      topHeavy: "上位有強隊，但中後段深度不足，屬於明顯 top-heavy。",
      softField: "整體深度偏弱，只有零星亮點，field 強度較軟。",
      limitedData: "目前樣本還少，場次強度判定偏保守。",
    },
    playoffAdvancement: {
      none: "尚未推進",
      octofinalist: "16 強",
      quarterfinalist: "8 強",
      semifinalist: "4 強",
      finalist: "決賽",
      champion: "冠軍",
    },
    eventTypes: {
      regional: "Regional",
      district: "District Event",
      districtChampionship: "District Championship",
      championshipDivision: "Championship Division",
      championshipFinals: "Championship Finals",
      districtChampionshipDivision: "District Championship Division",
      festival: "Festival of Champions",
      offseason: "Offseason",
      preseason: "Preseason",
      scrimmage: "Scrimmage",
      other: "其他",
    },
    insights: {
      noQualificationData: "Qualification 資料仍然很少，目前先維持保守判斷。",
      highRankSoftSchedule: "排名看起來不錯，但 qualification 賽程偏順，可能有被好搭檔或較軟對手放大的成分。",
      underseededStrongMetrics: "名次比底層指標還低，屬於可能被低估或 underseeded 的隊伍。",
      consistentQualification: "Qualification 表現穩定，場場貢獻落差不大。",
      stableContribution: "整體輸出穩定，沒有明顯大起大落。",
      risingForm: "最近幾場 qualification 狀態正在往上走。",
      slippingForm: "最近幾場 qualification 狀態有些降溫。",
      toughSchedule: "面對的對手偏硬，賽程難度比排名表面看起來更高。",
      softSchedule: "目前賽程偏軟，表面戰績需要再校正解讀。",
      volatilePerformance: "表現波動偏大，單場上下限差距明顯。",
      playoffAllianceBoost: "Playoff 結果主要來自 alliance context，不能直接當成純個人 domination。",
      playoffAllianceValidated: "Qualification 底層表現夠強，playoff alliance 成績也有跟上。",
      playoffSeedOnly: "Alliance 已經成形，但 playoff 比賽樣本還不夠多。",
      playoffNoMatches: "已有 alliance 資訊，但還沒有 playoff 比賽可以判斷深度。",
      lowConfidence: "目前樣本有限，分數信心仍偏低。",
      mediumConfidence: "資料已開始成形，但仍保留一些不確定性。",
      neutral: "目前底層指標大致落在 event 中間帶。",
    },
    relativeComparisonSelf: "這支隊伍就是目前選擇的基準。",
    relativeComparisonVs: "相對於 #%TEAM%：%SCORE%",
  },
  en: {
    appTitle: APP_NAME,
    appSubtitle:
      "Use live The Blue Alliance event data to separate qualification strength from playoff alliance context and quickly see who looks like a Grandpa, Father, Peer, Son, or Grandson.",
    controlsTitle: "Event Analysis",
    modelHint:
      "Overall score is qualification-led and calibrated with schedule context, partner and opponent strength, trend, and stability. If playoffs exist, alliance-based elimination context is added separately instead of being merged into qualification as if it were the same thing.",
    poweredBy: "Powered by The Blue Alliance",
    yearLabel: "Year",
    districtLabel: "District Filter",
    competitionLabel: "Competition Type",
    eventLabel: "Event",
    allDistricts: "All Districts",
    allCompetitionTypes: "All Types",
    chooseEvent: "Choose an event",
    noEventsAvailable: "No selectable events are available for this year yet.",
    loadingEvents: "Loading events...",
    eventLoadFailed: "Could not load the event list.",
    scoreLoadFailed: "Analysis failed. Please try again.",
    analyze: "Analyze",
    analyzing: "Analyzing...",
    resultsTitle: "Team Analysis",
    teamsLabel: "Teams",
    qualificationMatchesLabel: "Qualification Matches",
    playoffMatchesLabel: "Playoff Matches",
    emptyTitle: "Pick an event first",
    emptyBody:
      "Choose a year and event, then press Analyze. The server will pull TBA data and compute the full event view.",
    noTeamsTitle: "This event does not have team data available yet.",
    sampleMatchesLabel: "Qualification Played",
    recordLabel: "Qualification Record",
    confidenceLabel: "Data Confidence",
    confidenceLevelLabel: "Confidence Band",
    rankLabel: "Rank",
    unrankedLabel: "Unranked",
    referenceModeLabel: "Kinship Basis",
    referenceModeHint:
      "Default mode uses the event-wide model, or switch to a specific team to compare everyone against that baseline.",
    defaultReferenceOption: "Default mode (event baseline)",
    referenceBadge: "Reference Team",
    overallScoreLabel: "Overall Score",
    relativeScoreLabel: "Relative Score",
    qualificationStrengthLabel: "Qualification Strength",
    playoffContextLabel: "Playoff Alliance Context",
    playoffAllianceNote:
      "Playoff performance is evaluated at the fixed-alliance level. It adds context, not a naive solo-strength claim.",
    seedLabel: "Alliance Seed",
    noPlayoffDataLabel: "No playoff data yet",
    noPlayoffMatchesYet:
      "Alliance context exists, but there are not enough playoff matches yet to judge depth.",
    sortByLabel: "Sort By",
    sortDirectionLabel: "Direction",
    eventStrengthLabel: "Event Strength",
    overallMethodNote:
      "Overall score leans on qualification. Elimination data only adds lower-weight alliance-based playoff context when available.",
    language: {
      traditionalChinese: "繁中",
      english: "EN",
    },
    categories: {
      grandpa: "Grandpa",
      father: "Father",
      peer: "Peer",
      son: "Son",
      grandson: "Grandson",
    },
    categoryCaptions: {
      grandpa: "Clearly controlling the field",
      father: "Reliably above the pack",
      peer: "Close to the event middle",
      son: "A bit below event average",
      grandson: "Clearly behind the field",
    },
    eventTierLabels: {
      grandpa: "Grandpa-tier event",
      father: "Father-tier event",
      peer: "Peer-tier event",
      son: "Son-tier event",
      grandson: "Grandson-tier event",
    },
    confidenceBands: {
      high: "High",
      medium: "Medium",
      low: "Low",
    },
    sortOptions: {
      score: "Score",
      teamNumber: "Team Number",
      ranking: "Ranking",
    },
    sortDirections: {
      asc: "Ascending",
      desc: "Descending",
    },
    eventStrengthProfiles: {
      balancedDepth: "Balanced and competitive field with useful midfield depth.",
      eliteDepth: "Strong top-end contenders and enough depth behind them to make this a hard field.",
      topHeavy: "Strong top-end contenders, but limited midfield depth and a clear top-heavy shape.",
      softField: "Limited depth across most of the field, with only a few notable contenders.",
      limitedData: "The sample is still thin, so the field classification stays conservative.",
    },
    playoffAdvancement: {
      none: "Not advanced yet",
      octofinalist: "Round of 16",
      quarterfinalist: "Quarterfinal",
      semifinalist: "Semifinal",
      finalist: "Finalist",
      champion: "Champion",
    },
    eventTypes: {
      regional: "Regional",
      district: "District Event",
      districtChampionship: "District Championship",
      championshipDivision: "Championship Division",
      championshipFinals: "Championship Finals",
      districtChampionshipDivision: "District Championship Division",
      festival: "Festival of Champions",
      offseason: "Offseason",
      preseason: "Preseason",
      scrimmage: "Scrimmage",
      other: "Other",
    },
    insights: {
      noQualificationData: "Qualification data is still sparse, so the read stays conservative.",
      highRankSoftSchedule:
        "The rank looks strong, but the qualification schedule has been favorable enough to inflate the surface result.",
      underseededStrongMetrics:
        "The seed is lower than the underlying qualification profile suggests, so this team may be underseeded.",
      consistentQualification:
        "Qualification performance has been steady, with dependable match-to-match contribution.",
      stableContribution:
        "Underlying contribution looks stable rather than swingy.",
      risingForm: "Recent qualification form is trending upward.",
      slippingForm: "Recent qualification form has cooled off.",
      toughSchedule:
        "The schedule has been tougher than the rank alone suggests.",
      softSchedule:
        "The schedule has been softer than average, so the raw record needs extra calibration.",
      volatilePerformance:
        "Performance has been volatile, with large match-to-match swings.",
      playoffAllianceBoost:
        "Playoff results were helped more by alliance context than by dominant solo qualification data.",
      playoffAllianceValidated:
        "Strong qualification data has been reinforced by the alliance's playoff run.",
      playoffSeedOnly:
        "Alliance selection is set, but there is not enough playoff match data yet.",
      playoffNoMatches:
        "Alliance information exists, but there are still no playoff matches to evaluate.",
      lowConfidence: "Data remains limited, so confidence is low.",
      mediumConfidence: "The read is usable, but some uncertainty remains.",
      neutral: "The current profile sits near the event middle.",
    },
    relativeComparisonSelf: "This team is the selected comparison baseline.",
    relativeComparisonVs: "vs #%TEAM%: %SCORE%",
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export function getCategoryLabel(
  locale: Locale,
  category: ScoreCategory,
): string {
  return getDictionary(locale).categories[category];
}

export function getEventTierLabel(
  locale: Locale,
  category: ScoreCategory,
): string {
  return getDictionary(locale).eventTierLabels[category];
}

export function getConfidenceLevelLabel(
  locale: Locale,
  confidenceLevel: ConfidenceLevel,
): string {
  return getDictionary(locale).confidenceBands[confidenceLevel];
}

export function getPlayoffAdvancementLabel(
  locale: Locale,
  advancement: PlayoffFinish,
): string {
  return getDictionary(locale).playoffAdvancement[advancement];
}

export function getEventTypeLabel(
  locale: Locale,
  eventType: number | null | undefined,
): string {
  const dictionary = getDictionary(locale);
  const key = getEventTypeKey(eventType);
  return dictionary.eventTypes[key] ?? dictionary.eventTypes.other;
}
