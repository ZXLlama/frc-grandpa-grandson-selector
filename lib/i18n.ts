import { APP_NAME, getEventTypeKey } from "@/lib/constants";
import type { Locale, ScoreCategory, ScoreMetricKey } from "@/lib/types";

export const DEFAULT_LOCALE: Locale = "zh-TW";

const dictionaries = {
  "zh-TW": {
    appTitle: APP_NAME,
    appSubtitle:
      "用 The Blue Alliance 的賽事資料，快速看出這場比賽誰像爺爺、爸爸、平輩、兒子或孫子。",
    controlsTitle: "賽事分析",
    modelHint:
      "分數會綜合排名、勝率、近期狀態、平均聯盟得分、賽程強度與獎項／季後賽加權。資料少時會自動保守。",
    poweredBy: "Powered by The Blue Alliance",
    yearLabel: "年份",
    districtLabel: "District 篩選",
    competitionLabel: "賽事類型",
    eventLabel: "賽事",
    allDistricts: "全部 District",
    allCompetitionTypes: "全部類型",
    chooseEvent: "選擇賽事",
    noEventsAvailable: "這個年份目前沒有可選的賽事。",
    loadingEvents: "正在載入賽事清單...",
    eventLoadFailed: "無法載入賽事清單。",
    scoreLoadFailed: "分析失敗，請稍後再試。",
    analyze: "開始分析",
    analyzing: "分析中...",
    resultsTitle: "隊伍分析",
    teamsLabel: "隊伍",
    matchesLabel: "已完成比賽",
    emptyTitle: "先選擇賽事",
    emptyBody:
      "選完年份與賽事後，按下開始分析，就會用伺服器端 TBA 資料計算全場隊伍分數。",
    noTeamsTitle: "這場賽事目前還沒有可顯示的隊伍資料。",
    noMatchesSummary: "目前還沒有已完成比賽，先維持平輩附近",
    neutralSummary: "目前資料接近全場平均",
    lowDataSummary: "資料仍少，所以分數偏保守",
    sampleMatchesLabel: "已打",
    recordLabel: "戰績",
    confidenceLabel: "資料信心",
    rankLabel: "排名",
    unrankedLabel: "未排名",
    referenceModeLabel: "輩分基準",
    referenceModeHint:
      "預設會依全場模型判定，也可以改用某支隊伍作為相對比較基準。",
    defaultReferenceOption: "預設模式（全場基準）",
    referenceBadge: "基準隊伍",
    overallScoreLabel: "原始分數",
    relativeScoreLabel: "相對分數",
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
    } satisfies Record<ScoreCategory, string>,
    categoryCaptions: {
      grandpa: "明顯壓制全場",
      father: "穩定高於平均",
      peer: "整體實力接近",
      son: "目前落在平均下方",
      grandson: "目前明顯偏弱",
    } satisfies Record<ScoreCategory, string>,
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
    metricSummary: {
      ranking: {
        positive: "排名很前面",
        negative: "目前排名偏後",
      },
      winRate: {
        positive: "勝率穩定偏高",
        negative: "勝率仍待拉升",
      },
      trend: {
        positive: "近期狀態升溫",
        negative: "近期狀態轉弱",
      },
      allianceScore: {
        positive: "平均聯盟得分偏高",
        negative: "平均聯盟得分偏低",
      },
      scheduleStrength: {
        positive: "碰到的對手偏強",
        negative: "賽程相對輕鬆",
      },
      bonus: {
        positive: "獎項或季後賽有加分",
        negative: "暫時還沒有獎項加成",
      },
    } satisfies Record<ScoreMetricKey, { positive: string; negative: string }>,
  },
  en: {
    appTitle: APP_NAME,
    appSubtitle:
      "Use current event data from The Blue Alliance to see who looks like a Grandpa, Father, Peer, Son, or Grandson.",
    controlsTitle: "Event Analysis",
    modelHint:
      "Scores blend ranking, win rate, recent form, average alliance scoring, schedule strength, and awards/playoff bonus. Sparse data is damped automatically.",
    poweredBy: "Powered by The Blue Alliance",
    yearLabel: "Year",
    districtLabel: "District Filter",
    competitionLabel: "Competition Type",
    eventLabel: "Event",
    allDistricts: "All Districts",
    allCompetitionTypes: "All Types",
    chooseEvent: "Choose an event",
    noEventsAvailable: "No selectable events are available for this year yet.",
    loadingEvents: "Loading event list...",
    eventLoadFailed: "Could not load the event list.",
    scoreLoadFailed: "Analysis failed. Please try again.",
    analyze: "Analyze",
    analyzing: "Analyzing...",
    resultsTitle: "Team Analysis",
    teamsLabel: "Teams",
    matchesLabel: "Completed Matches",
    emptyTitle: "Pick an event first",
    emptyBody:
      "Choose a year and event, then press Analyze to compute event-wide scores from server-side TBA data.",
    noTeamsTitle: "This event does not have team data available yet.",
    noMatchesSummary: "No completed matches yet, so this stays near Peer",
    neutralSummary: "Current data is close to event average",
    lowDataSummary: "Limited data, so the score is conservative",
    sampleMatchesLabel: "Played",
    recordLabel: "Record",
    confidenceLabel: "Data Confidence",
    rankLabel: "Rank",
    unrankedLabel: "Unranked",
    referenceModeLabel: "Kinship Basis",
    referenceModeHint:
      "Default mode uses the event-wide model, or switch to any team as the relative comparison baseline.",
    defaultReferenceOption: "Default mode (event baseline)",
    referenceBadge: "Reference Team",
    overallScoreLabel: "Overall Score",
    relativeScoreLabel: "Relative Score",
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
    } satisfies Record<ScoreCategory, string>,
    categoryCaptions: {
      grandpa: "Clearly controlling the field",
      father: "Consistently above average",
      peer: "Close to the pack",
      son: "Below event average",
      grandson: "Clearly behind right now",
    } satisfies Record<ScoreCategory, string>,
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
    metricSummary: {
      ranking: {
        positive: "Strong current ranking",
        negative: "Current rank is lagging",
      },
      winRate: {
        positive: "Win rate is holding up",
        negative: "Win rate is under pressure",
      },
      trend: {
        positive: "Recent form is rising",
        negative: "Recent form is slipping",
      },
      allianceScore: {
        positive: "Alliance scoring average is high",
        negative: "Alliance scoring average is low",
      },
      scheduleStrength: {
        positive: "Has faced a tough schedule",
        negative: "Schedule has been softer",
      },
      bonus: {
        positive: "Awards or playoffs add a bump",
        negative: "No awards or playoff bump yet",
      },
    } satisfies Record<ScoreMetricKey, { positive: string; negative: string }>,
  },
} as const;

export type Dictionary = (typeof dictionaries)[keyof typeof dictionaries];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export function getCategoryLabel(
  locale: Locale,
  category: ScoreCategory,
): string {
  return getDictionary(locale).categories[category];
}

export function getEventTypeLabel(
  locale: Locale,
  eventType: number | null | undefined,
): string {
  const dictionary = getDictionary(locale);
  const key = getEventTypeKey(eventType);
  return dictionary.eventTypes[key as keyof typeof dictionary.eventTypes];
}
