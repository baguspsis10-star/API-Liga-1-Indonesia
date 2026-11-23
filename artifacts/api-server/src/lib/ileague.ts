import { logger } from "./logger";

const SOURCE_ORIGIN = "https://ileague.id";
const DEFAULT_COMPETITION = "BRI_SUPER_LEAGUE_2026-27";
const REFRESH_INTERVAL_SECONDS = 30;
const MONTHS: Record<string, string> = {
  januari: "01",
  februari: "02",
  maret: "03",
  april: "04",
  mei: "05",
  juni: "06",
  juli: "07",
  agustus: "08",
  september: "09",
  oktober: "10",
  november: "11",
  desember: "12",
};

export type MatchStatus = "upcoming" | "live" | "finished" | "postponed" | "unknown";

export interface Team {
  name: string;
  code?: string;
  slug?: string;
  logoUrl?: string;
}

export interface Match {
  id: string;
  competitionId: string;
  matchweek?: number;
  status: MatchStatus;
  date?: string;
  kickoff?: string;
  kickoffIso?: string;
  timezone: "Asia/Jakarta";
  venue?: string;
  broadcaster?: string;
  home: Team;
  away: Team;
  score?: { home: number; away: number; halftime?: { home: number; away: number } };
  sourceUrl: string;
  updatedAt: string;
}

export interface Standing {
  position: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  recentForm?: string[];
}

export interface RankedPlayer {
  rank: number;
  name: string;
  team?: Team;
  photoUrl?: string;
  value?: number;
  metric: string;
  sourceUrl?: string;
}

export interface MatchDetail extends Match {
  attendance?: number;
  officials?: string[];
  timeline: Array<{
    minute?: string;
    type: string;
    team?: "home" | "away";
    player?: string;
    assist?: string;
    detail?: string;
  }>;
  statistics: Array<{
    metric: string;
    home?: string;
    away?: string;
  }>;
  lineups: Array<{
    team: "home" | "away";
    position: string;
    player: string;
    number?: string;
    starter: boolean;
    photoUrl?: string;
    stats?: Record<string, string>;
  }>;
  rawSource: string;
}

export interface LeagueSnapshot {
  competition: {
    id: string;
    name: string;
    sourceUrl: string;
  };
  fetchedAt: string;
  nextRefreshAt: string;
  refreshIntervalSeconds: number;
  source: "ileague.id";
  selectedMatchweek?: number;
  upcomingMatchweek?: number;
  matches: Match[];
  upcoming: Match[];
  live: Match[];
  finished: Match[];
  standings: Standing[];
  topScorers: RankedPlayer[];
  topAssists: RankedPlayer[];
  clubs: Team[];
  stale?: boolean;
  warning?: string;
}

interface CacheEntry {
  snapshot?: LeagueSnapshot;
  detail: Map<string, { expiresAt: number; data: MatchDetail }>;
  refreshing?: Promise<LeagueSnapshot>;
}

const caches = new Map<string, CacheEntry>();

function getCache(competitionId: string): CacheEntry {
  const existing = caches.get(competitionId);
  if (existing) return existing;
  const created: CacheEntry = { detail: new Map() };
  caches.set(competitionId, created);
  return created;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function clean(value: string | undefined): string {
  if (!value) return "";
  return decodeEntities(value.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function attr(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)`, "i"));
  return match?.[1];
}

function absoluteUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.startsWith("http") ? value : `${SOURCE_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
}

function monthNumber(month: string): string | undefined {
  return MONTHS[month.toLowerCase()];
}

function parseIndonesianDate(value: string): { display: string; isoDate: string } | undefined {
  const match = value.match(/(?:Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)\s*,?\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
  if (!match) return undefined;
  const month = monthNumber(match[2]);
  if (!month) return undefined;
  return {
    display: `${match[1].padStart(2, "0")} ${match[2]} ${match[3]}`,
    isoDate: `${match[3]}-${month}-${match[1].padStart(2, "0")}`,
  };
}

function parseMatchweek(html: string): number | undefined {
  const selected = html.match(/<option[^>]+value=["'](\d+)["'][^>]*selected/i);
  return selected ? Number(selected[1]) : undefined;
}

function parseWeeks(html: string): number[] {
  return [...html.matchAll(/<option[^>]+value=["'](\d+)["']/gi)]
    .map((match) => Number(match[1]))
    .filter((week) => Number.isFinite(week));
}

function createMatchId(date: string | undefined, home: string, away: string): string {
  return [date ?? "unknown", home, away].join(":").toLowerCase().replace(/[^a-z0-9:]+/g, "-");
}

function determineStatus(kickoffIso: string | undefined, score: Match["score"]): MatchStatus {
  if (score) return "finished";
  if (!kickoffIso) return "unknown";
  const kickoff = new Date(kickoffIso).getTime();
  const now = Date.now();
  if (Number.isNaN(kickoff)) return "unknown";
  if (now < kickoff) return "upcoming";
  if (now <= kickoff + 135 * 60 * 1000) return "live";
  return "finished";
}

function findDateBefore(html: string, start: number): { display: string; isoDate: string } | undefined {
  const section = html.slice(Math.max(0, start - 5000), start);
  const matches = [...section.matchAll(/(?:Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)\s*,?\s*\d{1,2}\s+[A-Za-z]+\s+\d{4}/gi)];
  return matches.length ? parseIndonesianDate(matches[matches.length - 1][0]) : undefined;
}

function parseFixturePage(html: string, competitionId: string, matchweek?: number): Match[] {
  const matches: Match[] = [];
  const seen = new Set<string>();
  const now = new Date().toISOString();
  for (const linkMatch of html.matchAll(/<a[^>]+href=["']([^"']*\/result\/detail\/[^"']+)["'][^>]*>[\s\S]*?<\/a>/gi)) {
    const sourceUrl = absoluteUrl(linkMatch[1]);
    if (!sourceUrl || seen.has(sourceUrl)) continue;
    const linkIndex = linkMatch.index ?? 0;
    const segment = linkMatch[0];
    const homeImages = [...segment.matchAll(/<img\b[^>]*>/gi)]
      .map((entry) => ({ tag: entry[0], title: attr(entry[0], "title"), src: absoluteUrl(attr(entry[0], "src")) }))
      .filter((entry) => entry.title || entry.src);
    const titledTeams = homeImages.filter((entry) => entry.title).slice(0, 2);
    const teams = titledTeams.length === 2 ? titledTeams : homeImages.slice(0, 2);
    const resultParts = sourceUrl.match(/\/result\/detail\/[^/]+\/(\d{4}-\d{2}-\d{2})\/([^/]+)\/([^/?#]+)/i);
    const date = findDateBefore(html, linkIndex);
    const dateIso = resultParts?.[1] ?? date?.isoDate;
    const boldNames = [...segment.matchAll(/<b[^>]*>([\s\S]*?)<\/b>/gi)].map((entry) => clean(entry[1])).filter(Boolean);
    const homeName = decodeEntities(teams[0]?.title ?? boldNames[0] ?? resultParts?.[2]?.replace(/_/g, " ") ?? "");
    const awayName = decodeEntities(teams[1]?.title ?? boldNames[1] ?? resultParts?.[3]?.replace(/_/g, " ") ?? "");
    if (!homeName || !awayName) continue;
    const badgeText = clean(segment.match(/<span[^>]+class=["'][^"']*(?:score-span|badge-secondary)[^"']*["'][^>]*>([\s\S]*)<\/span>/i)?.[1]).replace(/\s*WIB/i, "");
    const kickoff = /^\d{1,2}:\d{2}$/.test(badgeText) ? badgeText : "";
    const venueMatches = [...segment.matchAll(/<td[^>]+width=["']30%["'][^>]*align=["']left["'][^>]*>([\s\S]*?)<\/td>/gi)];
    const venueMatch = venueMatches[venueMatches.length - 1];
    const broadcaster = clean(segment.match(/fa-tv[\s\S]{0,200}?<\/i>\s*<b>([\s\S]*?)<\/b>/i)?.[1]);
    const scoreValue = badgeText.match(/(?:FT|LIVE|HT)\s*(\d+)\s*:\s*(\d+)/i);
    const score = scoreValue ? { home: Number(scoreValue[1]), away: Number(scoreValue[2]) } : undefined;
    const kickoffIso = dateIso && /^\d{1,2}:\d{2}$/.test(kickoff) ? `${dateIso}T${kickoff}:00+07:00` : undefined;
    const status = /\bFT\b/i.test(badgeText)
      ? "finished"
      : /\bLIVE\b/i.test(badgeText)
        ? "live"
        : determineStatus(kickoffIso, score);
    const match: Match = {
      id: createMatchId(dateIso, homeName, awayName),
      competitionId,
      matchweek,
      status,
      date: date?.display ?? dateIso,
      kickoff: kickoff || undefined,
      kickoffIso,
      timezone: "Asia/Jakarta",
      venue: clean(venueMatch?.[1]),
      broadcaster: broadcaster || undefined,
      home: { name: homeName, code: clean(segment.match(/<div[^>]*>\s*([A-Z][A-Z0-9]{1,5})\s*<\/div>/i)?.[1]), logoUrl: teams[0]?.src },
      away: { name: awayName, code: clean(segment.match(/<div[^>]*>\s*([A-Z][A-Z0-9]{1,5})\s*<\/div>[\s\S]*?<img[\s\S]*?<div[^>]*>\s*([A-Z][A-Z0-9]{1,5})\s*<\/div>/i)?.[2]), logoUrl: teams[1]?.src },
      score,
      sourceUrl,
      updatedAt: now,
    };
    seen.add(sourceUrl);
    matches.push(match);
  }
  return matches;
}

function parseStandings(html: string): Standing[] {
  const table = html.match(/<table[\s\S]*?<\/table>/gi)?.find((item) => /Klasemen|Pos|Poin|Main/i.test(item)) ?? "";
  const rows: Standing[] = [];
  for (const row of table.matchAll(/<tr[\s\S]*?<\/tr>/gi)) {
    const cells = [...row[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => clean(cell[1]));
    const link = row[0].match(/href=["'][^"']*\/clubs\/single\/[^/]+\/([^"']+)["']/i);
    const logo = row[0].match(/<img\b[^>]+src=["']([^"']+)["']/i);
    if (!link || cells.length < 10 || !/^\d+$/.test(cells[0])) continue;
    const numbers = cells.slice(2, 10).map((cell) => Number(cell.replace(/[^\d-]/g, "")));
    if (numbers.length < 8 || numbers.some((value) => !Number.isFinite(value))) continue;
    rows.push({
      position: Number(cells[0]),
      team: { name: cells[1], slug: link[1], logoUrl: absoluteUrl(logo?.[1]) },
      played: numbers[0] ?? 0,
      won: numbers[1] ?? 0,
      drawn: numbers[2] ?? 0,
      lost: numbers[3] ?? 0,
      goalsFor: numbers[4] ?? 0,
      goalsAgainst: numbers[5] ?? 0,
      goalDifference: numbers[6] ?? 0,
      points: numbers[7] ?? 0,
    });
  }
  return rows;
}

function parseRanking(html: string, metric: string, clubs: Team[]): RankedPlayer[] {
  const section = html.match(new RegExp(`<div[^>]+id=["']${metric}["'][\\s\\S]*?(?=<div[^>]+class=["'][^"']*player-ranking|$)`, "i"))?.[0] ?? "";
  const players: RankedPlayer[] = [];
  for (const item of section.matchAll(/<li[\s\S]*?<\/li>/gi)) {
    const chunk = item[0];
    const playerLink = chunk.match(/<a[^>]+href=["']([^"']*singleplayer[^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    const href = playerLink?.[1];
    const name = clean(playerLink?.[2]);
    const imageUrls = [...chunk.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((entry) => absoluteUrl(entry[1])).filter(Boolean) as string[];
    const photoUrl = imageUrls.find((url) => url.includes("/player/"));
    const clubLogoUrl = imageUrls.find((url) => url.includes("/logo/"));
    const team = clubs.find((club) => club.logoUrl === clubLogoUrl);
    const rank = Number(clean(chunk.match(/class=["']position["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]));
    const value = Number(clean(chunk.match(/class=["']points["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]));
    if (name) players.push({ rank: Number.isFinite(rank) && rank > 0 ? rank : players.length + 1, name, team, photoUrl, value, metric, sourceUrl: absoluteUrl(href) });
  }
  return players.slice(0, 10);
}

function parseClubs(homeHtml: string): Team[] {
  const clubs: Team[] = [];
  const seen = new Set<string>();
  for (const match of homeHtml.matchAll(/<img\b[^>]+src=["']([^"']*\/logo\/[^"']+)["'][^>]*title=["']([^"']+)["']/gi)) {
    const name = decodeEntities(match[2]).trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    clubs.push({ name, logoUrl: absoluteUrl(match[1]) });
  }
  return clubs;
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "Liga1IndonesiaAPI/1.0 (+https://ileague.id)" },
    });
    if (!response.ok) throw new Error(`iLeague returned HTTP ${response.status} for ${url}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function detailIdFromUrl(sourceUrl: string): string {
  return sourceUrl.replace(`${SOURCE_ORIGIN}/result/detail/`, "").replace(/[^a-zA-Z0-9/_-]/g, "");
}

function parseDetail(html: string, sourceUrl: string, baseMatch?: Match): MatchDetail {
  const hero = html.match(/<div[^>]+class=["'][^"']*single-result[^"']*["'][\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/i)?.[0] ?? html;
  const names = [...hero.matchAll(/class=["'][^"']*match-hero-name[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)].map((match) => clean(match[1]));
  const logos = [...hero.matchAll(/class=["'][^"']*match-hero-logo[^"']*["'][^>]+src=["']([^"']+)["']/gi)].map((match) => absoluteUrl(match[1]));
  const location = clean(html.match(/class=["'][^"']*result-location[^"']*["'][\s\S]*?<\/ul>/i)?.[0]);
  const date = parseIndonesianDate(location)?.display;
  const venue = clean(location?.replace(/.*?(?:Minggu|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu)\s*,?\s*\d{1,2}\s+[A-Za-z]+\s+\d{4}/i, ""));
  const kickoff = clean(html.match(/Kick Off\s*<b>([\s\S]*?)<\/b>/i)?.[1]).replace(/\s*WIB/i, "");
  const scoreText = html.match(/<span[^>]+class=["'][^"']*badge[^"']*["'][^>]*>\s*(\d+)\s*:\s*(\d+)\s*<\/span>/i);
  const score = scoreText ? { home: Number(scoreText[1]), away: Number(scoreText[2]) } : baseMatch?.score;
  const dateIso = sourceUrl.match(/\/(\d{4}-\d{2}-\d{2})\//)?.[1];
  const kickoffIso = dateIso && kickoff ? `${dateIso}T${kickoff}:00+07:00` : baseMatch?.kickoffIso;
  const homeName = names[0] ?? baseMatch?.home.name ?? "";
  const awayName = names[1] ?? baseMatch?.away.name ?? "";
  const home: Team = { ...(baseMatch?.home ?? { name: homeName }), name: homeName, logoUrl: logos[0] ?? baseMatch?.home.logoUrl };
  const away: Team = { ...(baseMatch?.away ?? { name: awayName }), name: awayName, logoUrl: logos[1] ?? baseMatch?.away.logoUrl };
  return {
    ...(baseMatch ?? {
      id: detailIdFromUrl(sourceUrl),
      competitionId: DEFAULT_COMPETITION,
      timezone: "Asia/Jakarta",
      sourceUrl,
      updatedAt: new Date().toISOString(),
      status: determineStatus(kickoffIso, score),
      home,
      away,
    }),
    date: date ?? baseMatch?.date ?? dateIso,
    kickoff: kickoff || baseMatch?.kickoff,
    kickoffIso,
    venue: venue || baseMatch?.venue,
    home,
    away,
    score,
    status: determineStatus(kickoffIso, score),
    timeline: parseTimeline(html),
    statistics: parseStatistics(html),
    lineups: parseLineups(html),
    rawSource: sourceUrl,
  };
}

function parseTimeline(html: string): MatchDetail["timeline"] {
  const section = html.match(/id=["']matchtimeline["'][\s\S]*?(?=<div[^>]+class=["']tab-pane["'][^>]+id=["']lineup["'])/i)?.[0] ?? "";
  const events: MatchDetail["timeline"] = [];
  for (const item of section.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)) {
    const text = clean(item[1]);
    if (!text) continue;
    const minute = text.match(/\b(\d{1,3})(?:\+(\d{1,2}))?['’]?\b/)?.[0];
    events.push({ minute, type: text.replace(minute ?? "", "").trim(), detail: text });
  }
  return events;
}

function parseStatistics(html: string): MatchDetail["statistics"] {
  const section = html.match(/id=["']matchstats["'][\s\S]*?(?=<div[^>]+class=["']tab-pane["'][^>]+id=["']head["'])/i)?.[0] ?? "";
  const stats: MatchDetail["statistics"] = [];
  for (const match of section.matchAll(/<li>[\s\S]*?<span[^>]+class=["']left["'][^>]*>([\s\S]*?)<\/span>[\s\S]*?<span[^>]+class=["']center["'][^>]*>([\s\S]*?)<\/span>[\s\S]*?<span[^>]+class=["']right["'][^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/li>/gi)) {
    stats.push({ metric: clean(match[2]), home: clean(match[1]) || undefined, away: clean(match[3]) || undefined });
  }
  return stats;
}

function parseLineups(html: string): MatchDetail["lineups"] {
  const section = html.match(/id=["']lineup["'][\s\S]*?(?=<div[^>]+class=["']tab-pane["'][^>]+id=["']larang["'])/i)?.[0] ?? "";
  const lineups: MatchDetail["lineups"] = [];
  for (const row of section.matchAll(/<tr[\s\S]*?<\/tr>/gi)) {
    const text = clean(row[0]);
    const player = clean(row[0].match(/<a[^>]+>([^<]+)<\/a>/i)?.[1]);
    if (!player || player.length < 2) continue;
    const position = text.match(/\b(GK|DF|MF|FW|Kiper|Bek|Gelandang|Penyerang|Starting XI|Cadangan)\b/i)?.[1] ?? "unknown";
    const team: "home" | "away" = /home|kandang/i.test(row[0]) ? "home" : "away";
    const number = text.match(/(?:^|\s)#?(\d{1,2})(?:\s|$)/)?.[1];
    lineups.push({ team, position, player, number, starter: !/cadangan|bench|substitute/i.test(text), photoUrl: absoluteUrl(row[0].match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]) });
  }
  return lineups;
}

async function scrapeCompetition(competitionId: string): Promise<LeagueSnapshot> {
  const baseUrl = `${SOURCE_ORIGIN}/home/index/${competitionId}`;
  const homeHtml = await fetchText(baseUrl);
  const selectedWeek = parseMatchweek(await fetchText(`${SOURCE_ORIGIN}/fixtures/index/${competitionId}`));
  const availableWeeks = parseWeeks(homeHtml).concat(parseWeeks(await fetchText(`${SOURCE_ORIGIN}/fixtures/index/${competitionId}`)));
  const currentWeek = selectedWeek ?? Math.max(...availableWeeks, 1);
  const pages = new Map<number, string>();
  const weeksToFetch = [...new Set([currentWeek - 1, currentWeek, currentWeek + 1, currentWeek + 2])].filter((week) => week > 0 && (availableWeeks.length === 0 || availableWeeks.includes(week)));
  for (const week of weeksToFetch) {
    pages.set(week, await fetchText(`${SOURCE_ORIGIN}/fixtures/index/${competitionId}/${week}`));
  }
  if (!pages.size) pages.set(currentWeek, await fetchText(`${SOURCE_ORIGIN}/fixtures/index/${competitionId}`));
  const matches = [...pages.entries()].flatMap(([week, html]) => parseFixturePage(html, competitionId, week));
  const uniqueMatches = [...new Map(matches.map((match) => [match.sourceUrl, match])).values()];
  const now = Date.now();
  const upcoming = uniqueMatches.filter((match) => match.status === "upcoming").sort((a, b) => (a.kickoffIso ?? "").localeCompare(b.kickoffIso ?? ""));
  const live = uniqueMatches.filter((match) => match.status === "live");
  const finished = uniqueMatches.filter((match) => match.status === "finished").sort((a, b) => (b.kickoffIso ?? "").localeCompare(a.kickoffIso ?? ""));
  const upcomingMatchweek = upcoming[0]?.matchweek;
  const standingsHtml = await fetchText(`${SOURCE_ORIGIN}/table/index/${competitionId}`);
  const clubs = parseClubs(homeHtml);
  const snapshot: LeagueSnapshot = {
    competition: { id: competitionId, name: competitionId.replace(/_/g, " "), sourceUrl: baseUrl },
    fetchedAt: new Date(now).toISOString(),
    nextRefreshAt: new Date(now + REFRESH_INTERVAL_SECONDS * 1000).toISOString(),
    refreshIntervalSeconds: REFRESH_INTERVAL_SECONDS,
    source: "ileague.id",
    selectedMatchweek: currentWeek,
    upcomingMatchweek,
    matches: uniqueMatches,
    upcoming,
    live,
    finished,
    standings: parseStandings(standingsHtml),
    topScorers: parseRanking(homeHtml, "goals", clubs),
    topAssists: parseRanking(homeHtml, "assists", clubs),
    clubs,
  };
  return snapshot;
}

export async function refreshCompetition(competitionId = DEFAULT_COMPETITION): Promise<LeagueSnapshot> {
  const cache = getCache(competitionId);
  if (cache.refreshing) return cache.refreshing;
  cache.refreshing = scrapeCompetition(competitionId)
    .then((snapshot) => {
      cache.snapshot = snapshot;
      return snapshot;
    })
    .catch((error: unknown) => {
      logger.error({ err: error, competitionId }, "Failed to refresh iLeague data");
      if (cache.snapshot) return { ...cache.snapshot, stale: true, warning: error instanceof Error ? error.message : "Source refresh failed" };
      throw error;
    })
    .finally(() => {
      cache.refreshing = undefined;
    });
  return cache.refreshing;
}

export async function getCompetitionSnapshot(competitionId = DEFAULT_COMPETITION): Promise<LeagueSnapshot> {
  const cache = getCache(competitionId);
  if (!cache.snapshot) return refreshCompetition(competitionId);
  if (Date.now() >= new Date(cache.snapshot.nextRefreshAt).getTime()) void refreshCompetition(competitionId);
  return cache.snapshot;
}

export async function getMatchDetail(sourceUrl: string, baseMatch?: Match): Promise<MatchDetail> {
  const cache = getCache(baseMatch?.competitionId ?? DEFAULT_COMPETITION);
  const existing = cache.detail.get(sourceUrl);
  if (existing && existing.expiresAt > Date.now()) return existing.data;
  const data = parseDetail(await fetchText(sourceUrl), sourceUrl, baseMatch);
  cache.detail.set(sourceUrl, { expiresAt: Date.now() + 25_000, data });
  return data;
}

export function getDefaultCompetitionId(): string {
  return DEFAULT_COMPETITION;
}
