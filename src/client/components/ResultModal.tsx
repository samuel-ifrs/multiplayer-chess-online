import type { Color, GameOver } from '@shared/types'
import { useI18n } from '../i18n/I18nProvider'
import type { I18nKey } from '../i18n/en'
import { Link } from '../router'
import styles from './styles/Modal.module.css'

const REASON_KEY: Record<GameOver['reason'], I18nKey> = {
  checkmate: 'reason_checkmate',
  resign: 'reason_resign',
  timeout: 'reason_timeout',
  abandon: 'reason_abandon',
  stalemate: 'reason_stalemate',
  draw_agreed: 'reason_draw_agreed',
  draw_repetition: 'reason_draw_repetition',
  draw_insufficient: 'reason_draw_insufficient',
  draw_fifty_move: 'reason_draw_fifty_move',
}

export function ResultModal({ result, myColor }: { result: GameOver; myColor: Color | null }) {
  const { t } = useI18n()

  let headline: I18nKey = 'result_draw'
  if (result.result !== 'draw' && myColor) {
    headline = result.winner === myColor ? 'result_you_win' : 'result_you_lose'
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.resultTitle}>{t(headline)}</h2>
        <p className={styles.resultReason}>{t(REASON_KEY[result.reason])}</p>
        <div className={styles.actions}>
          <Link to="/" className={styles.primary}>
            {t('room_back_lobby')}
          </Link>
        </div>
      </div>
    </div>
  )
}
