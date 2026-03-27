import { APP_NAME, getEventTypeKey } from "@/lib/constants";
import type {
  ChampionshipQualifierReason,
  ConfidenceLevel,
  DashboardTab,
  EventProgressStage,
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
  recordLabel: string;
  confidenceLabel: string;
  rankLabel: string;
  unrankedLabel: string;
  referenceModeLabel: string;
  referenceModeHint: string;
  defaultReferenceOption: string;
  pinnedModeLabel: string;
  pinnedModeHint: string;
  defaultPinnedOption: string;
  pinnedBadge: string;
  overallScoreLabel: string;
  relativeScoreLabel: string;
  qualificationStrengthLabel: string;
  playoffContextLabel: string;
  playoffAllianceNote: string;
  seedLabel: string;
  slotLabel: string;
  noPlayoffDataLabel: string;
  playoffUnavailableMessage: string;
  qualificationNotApplicableMessage: string;
  awardsUnavailableMessage: string;
  sortByLabel: string;
  sortDirectionLabel: string;
  eventStrengthLabel: string;
  fieldDistributionLabel: string;
  finishedReviewLabel: string;
  overallMethodNote: string;
  expandDetailsLabel: string;
  collapseDetailsLabel: string;
  scoutingNotesLabel: string;
  backupLabel: string;
  progressLabel: string;
  awardsTitle: string;
  championshipQualifiersTitle: string;
  allAwardsTitle: string;
  qualifiedByLabel: string;
  noAwardRecipients: string;
  rankingShortLabel: string;
  recordShortLabel: string;
  confidenceShortLabel: string;
  language: {
    traditionalChinese: string;
    english: string;
  };
  analysisTabs: Record<DashboardTab, string>;
  categories: Record<ScoreCategory, string>;
  categoryCaptions: Record<ScoreCategory, string>;
  eventTierLabels: Record<ScoreCategory, string>;
  confidenceBands: Record<ConfidenceLevel, string>;
  sortOptions: Record<TeamSortKey, string>;
  sortDirections: Record<SortDirection, string>;
  eventStrengthProfiles: Record<EventStrengthProfile, string>;
  playoffAdvancement: Record<PlayoffFinish, string>;
  progressStages: Record<EventProgressStage, string>;
  qualifierReasons: Record<ChampionshipQualifierReason, string>;
  eventTypes: Record<string, string>;
  relativeComparisonSelf: string;
  relativeComparisonVs: string;
}

const dictionaries: Record<Locale, Dictionary> = {
  "zh-TW": {
    appTitle: APP_NAME,
    appSubtitle:
      "用 The Blue Alliance 即時資料，把積分賽、淘汰賽與 awards 分開看，快速抓出這場到底誰硬、誰被吹太大。",
    controlsTitle: "事件分析",
    modelHint:
      "積分賽只看積分賽，淘汰賽只看聯盟脈絡。名次、賽程、穩定度、聯盟位置與 awards 會分開處理，不再亂混成一坨。",
    poweredBy: "Powered by The Blue Alliance",
    yearLabel: "年份",
    districtLabel: "分區篩選",
    competitionLabel: "賽事類型",
    eventLabel: "賽事",
    allDistricts: "全部分區",
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
      "選好年份與賽事後按下開始分析，系統會在伺服器端向 TBA 抓資料並整理成 scouting 視角。",
    noTeamsTitle: "這個賽事目前還沒有可分析的隊伍資料。",
    recordLabel: "戰績",
    confidenceLabel: "資料信心",
    rankLabel: "排名",
    unrankedLabel: "未排名",
    referenceModeLabel: "輩分基準",
    referenceModeHint: "用指定隊伍當基準，直接看相對差距。",
    defaultReferenceOption: "預設模式（用目前分頁）",
    pinnedModeLabel: "主隊標記",
    pinnedModeHint: "選一支主隊並存在本機，下次回來也能直接找到。",
    defaultPinnedOption: "不設定主隊",
    pinnedBadge: "主隊",
    overallScoreLabel: "分數",
    relativeScoreLabel: "相對分數",
    qualificationStrengthLabel: "積分賽分數",
    playoffContextLabel: "淘汰賽分數",
    playoffAllianceNote:
      "淘汰賽分數代表聯盟脈絡，不是把三場淘汰賽硬吹成單隊神話。",
    seedLabel: "聯盟種子",
    slotLabel: "聯盟位置",
    noPlayoffDataLabel: "尚無淘汰賽資料",
    playoffUnavailableMessage: "尚未進入淘汰賽",
    qualificationNotApplicableMessage: "Einstein 不適用積分賽分析。",
    awardsUnavailableMessage: "目前還沒有可顯示的 awards 資料。",
    sortByLabel: "排序方式",
    sortDirectionLabel: "方向",
    eventStrengthLabel: "賽區強度",
    fieldDistributionLabel: "區段比例",
    finishedReviewLabel: "完賽總評",
    overallMethodNote: "場次強度現在會更嚴格地看頂端、深度與分布，不再只看平均。",
    expandDetailsLabel: "點擊看更多",
    collapseDetailsLabel: "收起分析",
    scoutingNotesLabel: "數據分析",
    backupLabel: "備援",
    progressLabel: "賽事進度",
    awardsTitle: "獎項",
    championshipQualifiersTitle: "晉級冠軍賽隊伍",
    allAwardsTitle: "全部 Awards",
    qualifiedByLabel: "晉級原因",
    noAwardRecipients: "目前沒有得獎名單。",
    rankingShortLabel: "排名",
    recordShortLabel: "戰績",
    confidenceShortLabel: "信心",
    language: {
      traditionalChinese: "繁中",
      english: "EN",
    },
    analysisTabs: {
      qualification: "積分賽",
      playoff: "淘汰賽",
      awards: "獎項",
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
      championshipFinals: "這是 Einstein，直接站在最高層級，普通場次沒有資格跟它同桌。",
      balancedDepth: "整體深度不錯，前中段都有競爭力。",
      eliteDepth: "前段夠硬，中段也撐得住，屬於真的難打。",
      topHeavy: "頭很硬，但中後段掉得快，明顯前強後弱。",
      softField: "整體偏軟，少數亮點撐不起整個場。",
      limitedData: "樣本還薄，先保守看待這場的強度。",
    },
    playoffAdvancement: {
      none: "尚未推進",
      octofinalist: "16 強",
      quarterfinalist: "8 強",
      semifinalist: "4 強",
      finalist: "決賽",
      champion: "冠軍",
    },
    progressStages: {
      qualificationEarly: "積分賽前段",
      qualificationMidLate: "積分賽中後段",
      playoffs: "淘汰賽",
      finished: "已完賽",
    },
    qualifierReasons: {
      winnerCaptain: "冠軍聯盟隊長",
      winnerFirstPick: "冠軍聯盟第一順位",
      impactAward: "Impact Award 得主",
      engineeringInspirationAward: "工程啟發獎",
      rookieAllStarAward: "新秀全明星獎",
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
    relativeComparisonSelf: "這支隊伍就是目前的比較基準。",
    relativeComparisonVs: "相對於 #%TEAM%：%SCORE%",
  },
  en: {
    appTitle: APP_NAME,
    appSubtitle:
      "Use live The Blue Alliance event data to separate qualification, playoffs, and awards cleanly, then scout who is actually strong and who is getting a little too much hype.",
    controlsTitle: "Event Analysis",
    modelHint:
      "Qualification, playoffs, and awards stay on separate tracks. Rankings, schedule strength, consistency, alliance slot, and awards all keep their own context.",
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
      "Choose a year and event, then press Analyze. The server will pull TBA data and build a scouting-first event view.",
    noTeamsTitle: "This event does not have team data available yet.",
    recordLabel: "Record",
    confidenceLabel: "Confidence",
    rankLabel: "Rank",
    unrankedLabel: "Unranked",
    referenceModeLabel: "Kinship Basis",
    referenceModeHint: "Compare everyone against a selected team on the current tab.",
    defaultReferenceOption: "Default mode (current tab)",
    pinnedModeLabel: "Pinned Team",
    pinnedModeHint: "Save one team locally so it stays easy to find later.",
    defaultPinnedOption: "No pinned team",
    pinnedBadge: "Pinned",
    overallScoreLabel: "Score",
    relativeScoreLabel: "Relative Score",
    qualificationStrengthLabel: "Qualification Score",
    playoffContextLabel: "Playoff Score",
    playoffAllianceNote:
      "Playoff strength here is alliance context. Do not read it like a solo carry rating.",
    seedLabel: "Alliance Seed",
    slotLabel: "Alliance Slot",
    noPlayoffDataLabel: "No playoff data yet",
    playoffUnavailableMessage: "Playoff data not available yet",
    qualificationNotApplicableMessage:
      "Qualification analysis does not apply to Einstein.",
    awardsUnavailableMessage: "No awards data is available yet.",
    sortByLabel: "Sort By",
    sortDirectionLabel: "Direction",
    eventStrengthLabel: "Field Strength",
    fieldDistributionLabel: "Tier Distribution",
    finishedReviewLabel: "Finished Review",
    overallMethodNote:
      "Event strength is now stricter about top-end talent, depth, and distribution instead of leaning on averages.",
    expandDetailsLabel: "Tap for details",
    collapseDetailsLabel: "Hide details",
    scoutingNotesLabel: "Data Analysis",
    backupLabel: "Backup",
    progressLabel: "Event Progress",
    awardsTitle: "Awards",
    championshipQualifiersTitle: "Championship Qualifiers",
    allAwardsTitle: "All Awards",
    qualifiedByLabel: "Qualified By",
    noAwardRecipients: "No award recipients posted yet.",
    rankingShortLabel: "Rank",
    recordShortLabel: "Record",
    confidenceShortLabel: "Confidence",
    language: {
      traditionalChinese: "繁中",
      english: "EN",
    },
    analysisTabs: {
      qualification: "Qualification",
      playoff: "Playoff",
      awards: "Awards",
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
      championshipFinals:
        "This is Einstein. It sits in its own top shelf, and normal events do not belong in the same conversation.",
      balancedDepth:
        "The field is balanced, with useful strength across the middle of the pack.",
      eliteDepth:
        "The top is strong and the middle stays dangerous. This is a legitimately hard field.",
      topHeavy:
        "The ceiling is strong, but the field drops off quickly after the top group.",
      softField:
        "The field is shallow overall, with only a few teams carrying real punch.",
      limitedData:
        "The sample is still thin, so the field classification stays conservative.",
    },
    playoffAdvancement: {
      none: "Not advanced yet",
      octofinalist: "Round of 16",
      quarterfinalist: "Quarterfinal",
      semifinalist: "Semifinal",
      finalist: "Finalist",
      champion: "Champion",
    },
    progressStages: {
      qualificationEarly: "Qualification Early",
      qualificationMidLate: "Qualification Mid/Late",
      playoffs: "Playoffs",
      finished: "Finished",
    },
    qualifierReasons: {
      winnerCaptain: "Winning alliance captain",
      winnerFirstPick: "Winning alliance first pick",
      impactAward: "Impact Award",
      engineeringInspirationAward: "Engineering Inspiration Award",
      rookieAllStarAward: "Rookie All-Star Award",
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
    relativeComparisonSelf: "This team is the current comparison baseline.",
    relativeComparisonVs: "vs #%TEAM%: %SCORE%",
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
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

export function getAlliancePositionLabel(input: {
  locale: Locale;
  seed: number | null;
  slot: number | null;
  isBackup: boolean;
}): string | null {
  if (input.seed === null) {
    return null;
  }

  if (input.isBackup) {
    return input.locale === "zh-TW"
      ? `第 ${input.seed} 聯盟備援`
      : `Alliance ${input.seed} backup`;
  }

  if (input.slot === 0) {
    return input.locale === "zh-TW"
      ? `第 ${input.seed} 聯盟隊長`
      : `Alliance ${input.seed} captain`;
  }

  if (input.slot === 2) {
    return input.locale === "zh-TW"
      ? `第 ${input.seed} 聯盟第一順位`
      : `Alliance ${input.seed} first pick`;
  }

  if (input.slot === 3) {
    return input.locale === "zh-TW"
      ? `第 ${input.seed} 聯盟第二順位`
      : `Alliance ${input.seed} second pick`;
  }

  return input.locale === "zh-TW"
    ? `第 ${input.seed} 聯盟成員`
    : `Alliance ${input.seed} member`;
}

export function getQualifierReasonLabel(
  locale: Locale,
  reason: ChampionshipQualifierReason,
): string {
  return getDictionary(locale).qualifierReasons[reason];
}
