import { APP_NAME, getEventTypeKey } from "@/lib/constants";
import type {
  AnalysisTab,
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
  playoffUnavailableMessage: string;
  qualificationNotApplicableMessage: string;
  sortByLabel: string;
  sortDirectionLabel: string;
  eventStrengthLabel: string;
  overallMethodNote: string;
  expandDetailsLabel: string;
  collapseDetailsLabel: string;
  scoutingNotesLabel: string;
  backupLabel: string;
  language: {
    traditionalChinese: string;
    english: string;
  };
  analysisTabs: Record<AnalysisTab, string>;
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
      "使用 The Blue Alliance 的即時賽事資料，把積分賽與淘汰賽分開看，快速找出誰是爺爺、爸爸、平輩、兒子、孫子。",
    controlsTitle: "事件分析",
    modelHint:
      "積分賽與淘汰賽分開評分。積分賽會校正賽程、搭檔與對手強度、近期狀態與穩定度；淘汰賽則只看 alliance context，不把 eliminations 當成 qualification 重算。",
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
    qualificationMatchesLabel: "積分賽場次",
    playoffMatchesLabel: "淘汰賽場次",
    emptyTitle: "先選一個賽事",
    emptyBody:
      "選擇年份與賽事後，按下開始分析，系統會在伺服器端向 TBA 取得資料並計算 event 分析結果。",
    noTeamsTitle: "這個賽事目前還沒有可分析的隊伍資料。",
    sampleMatchesLabel: "已打場次",
    recordLabel: "戰績",
    confidenceLabel: "資料信心",
    confidenceLevelLabel: "信心等級",
    rankLabel: "排名",
    unrankedLabel: "未排名",
    referenceModeLabel: "輩分基準",
    referenceModeHint:
      "預設用目前分頁的模型判定輩分，也可以切換成以特定隊伍為基準，直接看相對差距。",
    defaultReferenceOption: "預設模式（目前分頁基準）",
    referenceBadge: "基準隊伍",
    overallScoreLabel: "分數",
    relativeScoreLabel: "相對分數",
    qualificationStrengthLabel: "積分賽評分",
    playoffContextLabel: "淘汰賽評分",
    playoffAllianceNote:
      "淘汰賽成績以固定 alliance 為單位解讀，代表聯盟脈絡，不是單人單隊神化。",
    seedLabel: "聯盟種子",
    noPlayoffDataLabel: "尚無淘汰賽資料",
    noPlayoffMatchesYet: "已知 alliance context，但還沒有足夠的淘汰賽結果。",
    playoffUnavailableMessage: "尚未進入淘汰賽",
    qualificationNotApplicableMessage: "Einstein 不適用積分賽分析。",
    sortByLabel: "排序方式",
    sortDirectionLabel: "方向",
    eventStrengthLabel: "場次強度",
    overallMethodNote: "目前改成分頁顯示，不再把積分賽和淘汰賽硬混成單一分數。",
    expandDetailsLabel: "展開分析",
    collapseDetailsLabel: "收合分析",
    scoutingNotesLabel: "數據吐槽",
    backupLabel: "Backup",
    language: {
      traditionalChinese: "繁中",
      english: "EN",
    },
    analysisTabs: {
      qualification: "積分賽",
      playoff: "淘汰賽",
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
      noQualificationData: "積分賽樣本太少，現在硬吹或硬酸都不太公平。",
      highRankSoftSchedule: "排名不差，但賽程偏軟，多少有點被好搭檔抬上去。",
      underseededStrongMetrics: "種子比底層數據還低，屬於被排位低估的類型。",
      consistentQualification: "積分賽輸出穩，幾乎每場都在交功課。",
      stableContribution: "底層貢獻偏穩，不太像抽卡隊。",
      risingForm: "最近幾場越打越順，狀態往上走。",
      slippingForm: "最近幾場有點掉漆，熱度在退。",
      toughSchedule: "對手偏硬，表面排名沒有把難度完全算進去。",
      softSchedule: "賽程偏甜，表面戰績需要打折看。",
      volatilePerformance: "波動很大，高的時候很高，炸的時候也不客氣。",
      playoffAllianceBoost: "有進淘汰賽，但更像是 alliance 帶飛，不是單隊統治。",
      playoffAllianceValidated: "積分賽底子夠硬，淘汰賽 alliance 成績也跟得上。",
      playoffSeedOnly: "聯盟已經成形，但淘汰賽樣本還不夠你下狠話。",
      playoffNoMatches: "有 alliance 資訊，但還沒有淘汰賽結果可嘴。",
      lowConfidence: "資料還薄，先別急著封神或判死刑。",
      mediumConfidence: "資料差不多成形了，但還有一些灰區。",
      neutral: "目前看起來大致落在 event 中間帶。",
    },
    relativeComparisonSelf: "這支隊伍就是目前選擇的基準。",
    relativeComparisonVs: "相對於 #%TEAM%：%SCORE%",
  },
  en: {
    appTitle: APP_NAME,
    appSubtitle:
      "Use live The Blue Alliance event data to score qualification and playoffs separately, then quickly see who looks like a Grandpa, Father, Peer, Son, or Grandson.",
    controlsTitle: "Event Analysis",
    modelHint:
      "Qualification and playoffs are scored on separate tracks. Qualification corrects for schedule, partner and opponent strength, trend, and stability; playoffs stay alliance-based and never get blended in as fake qualification data.",
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
      "Choose a year and event, then press Analyze. The server will pull TBA data and compute the event view.",
    noTeamsTitle: "This event does not have team data available yet.",
    sampleMatchesLabel: "Matches Played",
    recordLabel: "Record",
    confidenceLabel: "Data Confidence",
    confidenceLevelLabel: "Confidence Band",
    rankLabel: "Rank",
    unrankedLabel: "Unranked",
    referenceModeLabel: "Kinship Basis",
    referenceModeHint:
      "Default mode uses the current tab's model, or switch to a specific team to compare everyone against that baseline.",
    defaultReferenceOption: "Default mode (current tab baseline)",
    referenceBadge: "Reference Team",
    overallScoreLabel: "Score",
    relativeScoreLabel: "Relative Score",
    qualificationStrengthLabel: "Qualification Score",
    playoffContextLabel: "Playoff Score",
    playoffAllianceNote:
      "Playoff performance is read at the fixed-alliance level. It is alliance context, not fake solo hero ball.",
    seedLabel: "Alliance Seed",
    noPlayoffDataLabel: "No playoff data yet",
    noPlayoffMatchesYet:
      "Alliance context exists, but there are not enough playoff matches yet to judge depth.",
    playoffUnavailableMessage: "Playoff data not available yet",
    qualificationNotApplicableMessage:
      "Qualification analysis does not apply to Einstein.",
    sortByLabel: "Sort By",
    sortDirectionLabel: "Direction",
    eventStrengthLabel: "Event Strength",
    overallMethodNote:
      "Tabs now keep qualification and playoff scoring separate instead of blending them into one score.",
    expandDetailsLabel: "Expand Analysis",
    collapseDetailsLabel: "Collapse Analysis",
    scoutingNotesLabel: "Scouting Notes",
    backupLabel: "Backup",
    language: {
      traditionalChinese: "繁中",
      english: "EN",
    },
    analysisTabs: {
      qualification: "Qualification",
      playoff: "Playoff",
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
      noQualificationData:
        "Qualification data is too thin right now, so any hot take would be fake confidence.",
      highRankSoftSchedule:
        "The rank looks good, but the schedule has been soft enough that the surface result feels a little borrowed.",
      underseededStrongMetrics:
        "The seed is lower than the underlying metrics suggest. Hidden strength alert.",
      consistentQualification:
        "Qualification output has been steady. This team keeps showing up to work.",
      stableContribution:
        "Underlying contribution looks stable rather than random.",
      risingForm: "Recent qualification form is trending up.",
      slippingForm: "Recent qualification form has cooled off.",
      toughSchedule:
        "The schedule has been tougher than the rank alone admits.",
      softSchedule:
        "The schedule has been friendly, so the record needs a little skepticism.",
      volatilePerformance:
        "Volatile team: high highs, ugly lows, and very little chill in between.",
      playoffAllianceBoost:
        "The playoff presence looks more alliance-powered than individually dominant.",
      playoffAllianceValidated:
        "Strong qualification data has actually held up once the alliance games started.",
      playoffSeedOnly:
        "Alliance selection is set, but there still is not enough playoff match data to talk big.",
      playoffNoMatches:
        "Alliance info exists, but there are still no playoff matches to roast properly.",
      lowConfidence: "Data is still limited, so confidence is low.",
      mediumConfidence: "The read is usable, but some uncertainty is still hanging around.",
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
