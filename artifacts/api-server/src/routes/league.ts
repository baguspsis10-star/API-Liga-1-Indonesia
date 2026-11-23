import { Router, type IRouter, type Request } from "express";
import {
  getCompetitionSnapshot,
  getDefaultCompetitionId,
  getMatchDetail,
  refreshCompetition,
  type Match,
} from "../lib/ileague";

const router: IRouter = Router();

function competitionId(req: Request): string {
  return String(req.query.competitionId || getDefaultCompetitionId());
}

function findMatch(snapshot: Awaited<ReturnType<typeof getCompetitionSnapshot>>, matchId: string): Match | undefined {
  return snapshot.matches.find((match) => match.id === matchId || encodeURIComponent(match.id) === matchId || match.sourceUrl.includes(matchId));
}

router.get("/liga-1", async (req, res, next) => {
  try {
    res.json(await getCompetitionSnapshot(competitionId(req)));
  } catch (error) {
    next(error);
  }
});

router.post("/liga-1/refresh", async (req, res, next) => {
  try {
    res.json(await refreshCompetition(competitionId(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/liga-1/fixtures", async (req, res, next) => {
  try {
    const snapshot = await getCompetitionSnapshot(competitionId(req));
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const week = typeof req.query.week === "string" ? Number(req.query.week) : undefined;
    let matches = snapshot.matches;
    if (status === "upcoming") matches = snapshot.upcoming;
    if (status === "live") matches = snapshot.live;
    if (status === "finished") matches = snapshot.finished;
    if (Number.isFinite(week)) matches = matches.filter((match) => match.matchweek === week);
    res.json({
      competition: snapshot.competition,
      fetchedAt: snapshot.fetchedAt,
      upcomingMatchweek: snapshot.upcomingMatchweek,
      count: matches.length,
      matches,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/liga-1/standings", async (req, res, next) => {
  try {
    const snapshot = await getCompetitionSnapshot(competitionId(req));
    res.json({ competition: snapshot.competition, fetchedAt: snapshot.fetchedAt, standings: snapshot.standings });
  } catch (error) {
    next(error);
  }
});

router.get("/liga-1/top-scorers", async (req, res, next) => {
  try {
    const snapshot = await getCompetitionSnapshot(competitionId(req));
    res.json({ competition: snapshot.competition, fetchedAt: snapshot.fetchedAt, topScorers: snapshot.topScorers, topAssists: snapshot.topAssists });
  } catch (error) {
    next(error);
  }
});

router.get("/liga-1/clubs", async (req, res, next) => {
  try {
    const snapshot = await getCompetitionSnapshot(competitionId(req));
    res.json({ competition: snapshot.competition, fetchedAt: snapshot.fetchedAt, clubs: snapshot.clubs });
  } catch (error) {
    next(error);
  }
});

router.get("/liga-1/matches/:matchId", async (req, res, next) => {
  try {
    const snapshot = await getCompetitionSnapshot(competitionId(req));
    const match = findMatch(snapshot, req.params.matchId);
    const sourceUrl = match?.sourceUrl ?? (req.query.sourceUrl as string | undefined);
    if (!sourceUrl || !sourceUrl.startsWith("https://ileague.id/result/detail/")) {
      res.status(404).json({ error: "Match not found", matchId: req.params.matchId });
      return;
    }
    res.json(await getMatchDetail(sourceUrl, match));
  } catch (error) {
    next(error);
  }
});

router.get("/liga-1/live", async (req, res, next) => {
  try {
    const snapshot = await getCompetitionSnapshot(competitionId(req));
    res.json({
      competition: snapshot.competition,
      fetchedAt: snapshot.fetchedAt,
      refreshIntervalSeconds: snapshot.refreshIntervalSeconds,
      live: snapshot.live,
    });
  } catch (error) {
    next(error);
  }
});

export default router;