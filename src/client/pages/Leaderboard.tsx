import { useEffect, useState } from 'react'
import type { LeaderboardEntry } from '@shared/types'
import { useI18n } from '../i18n/I18nProvider'
import { Link, useRouter } from '../router'
import { api } from '../api'
import styles from '../components/styles/Table.module.css'

interface RankingData {
  leaderboard: LeaderboardEntry[]
}

export function Leaderboard() {
  const { t } = useI18n()
  const { initialData } = useRouter()
  const seeded = (initialData as RankingData | null)?.leaderboard
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(seeded ?? null)

  useEffect(() => {
    if (entries) return
    api
      .leaderboard()
      .then((res) => setEntries(res.leaderboard))
      .catch(() => setEntries([]))
  }, [entries])

  return (
    <div className={styles.page}>
      <h1>{t('ranking_title')}</h1>
      {!entries ? (
        <p>{t('common_loading')}</p>
      ) : entries.length === 0 ? (
        <p className={styles.empty}>{t('ranking_empty')}</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('ranking_rank')}</th>
              <th>{t('ranking_player')}</th>
              <th>{t('ranking_wins')}</th>
              <th>{t('ranking_losses')}</th>
              <th>{t('ranking_draws')}</th>
              <th>{t('ranking_winrate')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.username}>
                <td className={styles.rank}>{e.rank}</td>
                <td>
                  <Link to={`/profile/${encodeURIComponent(e.username)}`}>{e.username}</Link>
                </td>
                <td>{e.wins}</td>
                <td>{e.losses}</td>
                <td>{e.draws}</td>
                <td>{Math.round(e.winRate * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
