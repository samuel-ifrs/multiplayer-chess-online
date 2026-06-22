import { Router } from 'express';
import { getLeaderboard, getStats } from '../db/playersRepo';
import { getPlayerGames } from '../db/gamesRepo';

export const dataRoutes = Router();

dataRoutes.get('/leaderboard', async (_req, res) => {
  try {
    res.json({ leaderboard: await getLeaderboard(50) });
  } catch (err) {
    console.error('[chess] leaderboard error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

dataRoutes.get('/players/:name/stats', async (req, res) => {
  try {
    const stats = await getStats(req.params.name);
    if (!stats) return res.status(404).json({ error: 'not_found' });
    res.json({ stats });
  } catch (err) {
    console.error('[chess] stats error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

dataRoutes.get('/players/:name/games', async (req, res) => {
  try {
    res.json({ games: await getPlayerGames(req.params.name, 30) });
  } catch (err) {
    console.error('[chess] games error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});
