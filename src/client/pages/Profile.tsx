import { useEffect, useState } from 'react';
import type { GameHistoryEntry, PlayerStats } from '@shared/types';
import { TIME_CONTROLS } from '@shared/timeControls';
import { useI18n } from '../i18n/I18nProvider';
import { useRouter } from '../router';
import { api } from '../api';
import styles from '../components/styles/Profile.module.css';

interface ProfileData {
  profile: {
    name: string;
    stats: PlayerStats | null;
    games: GameHistoryEntry[];
  };
}

export function Profile({ name }: { name: string }) {
  const { t } = useI18n();
  const { initialData } = useRouter();
  const seeded = (initialData as ProfileData | null)?.profile;
  const matchesSeed = seeded?.name === name;

  const [stats, setStats] = useState<PlayerStats | null>(
    matchesSeed ? seeded!.stats : null
  );
  const [games, setGames] = useState<GameHistoryEntry[] | null>(
    matchesSeed ? seeded!.games : null
  );
  const [loading, setLoading] = useState(!matchesSeed);

  useEffect(() => {
    if (matchesSeed) return;
    setLoading(true);
    Promise.all([
      api
        .playerStats(name)
        .then(r => r.stats)
        .catch(() => null),
      api
        .playerGames(name)
        .then(r => r.games)
        .catch(() => [])
    ]).then(([s, g]) => {
      setStats(s);
      setGames(g);
      setLoading(false);
    });
  }, [name, matchesSeed]);

  if (loading) return <div className={styles.page}>{t('common_loading')}</div>;
  if (!stats)
    return <div className={styles.page}>{t('profile_not_found')}</div>;

  const resultFor = (g: GameHistoryEntry): 'win' | 'loss' | 'draw' => {
    if (g.result === 'draw') return 'draw';
    const myColorWhite = g.whiteName === name;
    const iWon =
      (g.result === 'w' && myColorWhite) || (g.result === 'b' && !myColorWhite);
    return iWon ? 'win' : 'loss';
  };

  return (
    <div className={styles.page}>
      <h1>{t('profile_title', { name })}</h1>

      <section className={styles.statsGrid}>
        <Stat value={stats.wins} label={t('ranking_wins')} />
        <Stat value={stats.losses} label={t('ranking_losses')} />
        <Stat value={stats.draws} label={t('ranking_draws')} />
        <Stat
          value={`${Math.round(stats.winRate * 100)}%`}
          label={t('ranking_winrate')}
        />
        <Stat value={stats.gamesPlayed} label={t('ranking_games')} />
      </section>

      <h2>{t('profile_history')}</h2>
      {!games || games.length === 0 ? (
        <p className={styles.empty}>{t('profile_no_games')}</p>
      ) : (
        <ul className={styles.history}>
          {games.map(g => {
            const r = resultFor(g);
            const opponent = g.whiteName === name ? g.blackName : g.whiteName;
            return (
              <li key={g.id} className={styles.gameRow}>
                <span className={`${styles.badge} ${styles[r]}`}>
                  {t(
                    r === 'win'
                      ? 'profile_result_win'
                      : r === 'loss'
                        ? 'profile_result_loss'
                        : 'profile_result_draw'
                  )}
                </span>
                <span className={styles.vs}>
                  {t('profile_vs')} <strong>{opponent}</strong>
                </span>
                <span className={styles.tc}>
                  {TIME_CONTROLS[g.timeControl].label}
                </span>
                <span className={styles.moves}>{g.movesCount} ♟</span>
                <span className={styles.date}>
                  {new Date(g.endedAt).toLocaleDateString()}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
