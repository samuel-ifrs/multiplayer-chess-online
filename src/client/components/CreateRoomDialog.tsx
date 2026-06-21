import { useState } from 'react'
import type { ColorPref } from '@shared/types'
import { TIME_CONTROL_IDS, TIME_CONTROLS, type TimeControlId } from '@shared/timeControls'
import { useI18n } from '../i18n/I18nProvider'
import { getSocket } from '../socket'
import styles from './styles/Modal.module.css'

export function CreateRoomDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (roomId: string) => void
}) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')
  const [timeControl, setTimeControl] = useState<TimeControlId>('10+0')
  const [colorPref, setColorPref] = useState<ColorPref>('random')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(false)
    setBusy(true)
    getSocket().emit(
      'lobby:create',
      {
        name: name.trim() || t('appName'),
        isPrivate,
        password: isPrivate ? password : undefined,
        timeControl,
        colorPref,
      },
      (res) => {
        setBusy(false)
        if (res.ok) onCreated(res.data.roomId)
        else setError(true)
      },
    )
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2 className={styles.title}>{t('create_title')}</h2>

        <label className={styles.label}>
          {t('create_name')}
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder={t('create_name')}
          />
        </label>

        <fieldset className={styles.group}>
          <legend>{t('create_visibility')}</legend>
          <label className={styles.radio}>
            <input type="radio" checked={!isPrivate} onChange={() => setIsPrivate(false)} />
            {t('create_public')}
          </label>
          <label className={styles.radio}>
            <input type="radio" checked={isPrivate} onChange={() => setIsPrivate(true)} />
            {t('create_private')}
          </label>
        </fieldset>

        {isPrivate && (
          <label className={styles.label}>
            {t('create_password')}
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              maxLength={64}
            />
          </label>
        )}

        <label className={styles.label}>
          {t('create_time')}
          <select
            className={styles.input}
            value={timeControl}
            onChange={(e) => setTimeControl(e.target.value as TimeControlId)}
          >
            {TIME_CONTROL_IDS.map((id) => (
              <option key={id} value={id}>
                {TIME_CONTROLS[id].label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className={styles.group}>
          <legend>{t('create_color')}</legend>
          {(['w', 'b', 'random'] as ColorPref[]).map((c) => (
            <label key={c} className={styles.radio}>
              <input type="radio" checked={colorPref === c} onChange={() => setColorPref(c)} />
              {t(c === 'w' ? 'create_white' : c === 'b' ? 'create_black' : 'create_random')}
            </label>
          ))}
        </fieldset>

        {error && <p className={styles.error}>{t('create_err')}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            {t('create_cancel')}
          </button>
          <button type="submit" className={styles.primary} disabled={busy}>
            {busy ? t('common_loading') : t('create_submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
