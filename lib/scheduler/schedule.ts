import { PersonaId } from "@/types";
import { isOddDay, isEvenDay, isUnoDay, isSunday, parseDateKey } from "@/lib/utils/date";

/**
 * Get which personas should post on a given date
 *
 * 愛（ai）: 奇数日
 * 幸地（kochi）: 偶数日
 * 宇野（uno）: 月・水・金・日
 */
export function getPostingPersonas(dateKey: string): PersonaId[] {
  const personas: PersonaId[] = [];

  // 愛: odd days (DD is odd)
  if (isOddDay(dateKey)) {
    personas.push("ai");
  }

  // 幸地: even days (DD is even)
  if (isEvenDay(dateKey)) {
    personas.push("kochi");
  }

  // 宇野: Monday, Wednesday, Friday, Sunday
  if (isUnoDay(dateKey)) {
    personas.push("uno");
  }

  return personas;
}

/**
 * Check if a persona should post on a given date
 */
export function shouldPersonaPost(personaId: PersonaId, dateKey: string): boolean {
  return getPostingPersonas(dateKey).includes(personaId);
}

/**
 * Check if it's a sweets day for uno (Sunday)
 */
export function isUnoSweetsDay(dateKey: string): boolean {
  return isSunday(dateKey);
}

/**
 * Check if dateKey falls on a weekend (Saturday or Sunday)
 */
export function isWeekend(dateKey: string): boolean {
  const date = parseDateKey(dateKey);
  const dow = date.getDay();
  return dow === 0 || dow === 6;
}

export interface SeasonalContext {
  season: string;
  seasonDescription: string;
  events: string[];
  weatherHint: string;
}

/**
 * 季節・行事カレンダー
 * dateKeyから季節情報と直近のイベントを返す
 */
export function getSeasonalContext(dateKey: string): SeasonalContext {
  const date = parseDateKey(dateKey);
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // 季節判定
  let season: string;
  let seasonDescription: string;
  let weatherHint: string;

  if (month >= 3 && month <= 5) {
    season = "春";
    seasonDescription = "桜や新緑の季節。暖かくなり外出が心地よい。";
    weatherHint = month === 3 ? "三寒四温、まだ肌寒い日も" : month === 4 ? "穏やかな陽気、桜が見頃" : "初夏の陽気、爽やかな風";
  } else if (month >= 6 && month <= 8) {
    season = "夏";
    seasonDescription = "暑さが本格化する季節。夏祭りや花火。";
    weatherHint = month === 6 ? "梅雨の時期、じめじめした日が続く" : month === 7 ? "梅雨明け、本格的な暑さ" : "猛暑日が続く、夕立も";
  } else if (month >= 9 && month <= 11) {
    season = "秋";
    seasonDescription = "紅葉と実りの季節。涼しくなり食欲も増す。";
    weatherHint = month === 9 ? "残暑が続くが朝晩は涼しく" : month === 10 ? "秋晴れの過ごしやすい日々" : "晩秋、朝の冷え込みが厳しく";
  } else {
    season = "冬";
    seasonDescription = "寒さが厳しい季節。温かい食べ物が恋しい。";
    weatherHint = month === 12 ? "師走の忙しさ、木枯らしが吹く" : month === 1 ? "厳寒期、雪の便りも" : "まだ寒いが日差しに春の兆し";
  }

  // 行事カレンダー
  const events: string[] = [];

  // 月 + 日付範囲でイベント判定
  if (month === 1) {
    if (day <= 3) events.push("お正月・三が日");
    if (day <= 7) events.push("松の内");
    if (day === 7) events.push("七草粥");
    if (day >= 8 && day <= 15) events.push("成人の日の頃");
  } else if (month === 2) {
    if (day >= 1 && day <= 4) events.push("節分");
    if (day === 3 || day === 4) events.push("立春");
    if (day === 14) events.push("バレンタインデー");
  } else if (month === 3) {
    if (day === 3) events.push("ひな祭り");
    if (day >= 14 && day <= 14) events.push("ホワイトデー");
    if (day >= 18 && day <= 23) events.push("春分の日の頃");
    if (day >= 20) events.push("桜の開花が近い");
  } else if (month === 4) {
    if (day <= 10) events.push("お花見シーズン");
    if (day <= 7) events.push("新年度・新学期");
    if (day >= 29) events.push("ゴールデンウィーク開始");
  } else if (month === 5) {
    if (day <= 5) events.push("ゴールデンウィーク");
    if (day === 5) events.push("こどもの日");
    if (day >= 10 && day <= 15) events.push("母の日の頃");
  } else if (month === 6) {
    if (day >= 1 && day <= 10) events.push("衣替え");
    if (day >= 10 && day <= 20) events.push("梅雨入りの頃");
    if (day >= 15 && day <= 20) events.push("父の日の頃");
    if (day === 30) events.push("夏越の祓");
  } else if (month === 7) {
    if (day === 7) events.push("七夕");
    if (day >= 15 && day <= 25) events.push("夏休みシーズン");
    if (day >= 20) events.push("土用の丑の日の頃");
  } else if (month === 8) {
    events.push("夏休みシーズン");
    if (day >= 13 && day <= 16) events.push("お盆");
    if (day >= 20) events.push("夏の終わりの気配");
  } else if (month === 9) {
    if (day >= 15 && day <= 23) events.push("お彼岸");
    if (day >= 15 && day <= 20) events.push("敬老の日の頃");
    if (day >= 20 && day <= 25) events.push("秋分の日の頃");
  } else if (month === 10) {
    if (day >= 1 && day <= 10) events.push("衣替え");
    if (day >= 25 && day <= 31) events.push("ハロウィン");
    if (day >= 15) events.push("紅葉シーズン");
  } else if (month === 11) {
    if (day === 3) events.push("文化の日");
    if (day >= 1 && day <= 15) events.push("紅葉の見頃");
    if (day === 15) events.push("七五三");
    if (day >= 20 && day <= 25) events.push("勤労感謝の日の頃");
  } else if (month === 12) {
    if (day >= 1 && day <= 10) events.push("師走の始まり");
    if (day >= 20 && day <= 25) events.push("クリスマスシーズン");
    if (day === 22 || day === 23) events.push("冬至の頃");
    if (day >= 28) events.push("年末・大掃除");
    if (day === 31) events.push("大晦日");
  }

  return { season, seasonDescription, events, weatherHint };
}
