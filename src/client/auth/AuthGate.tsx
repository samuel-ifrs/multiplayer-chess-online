import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { LanguageToggle } from '../components/LanguageToggle';
import type { I18nKey } from '../i18n/en';
import styles from '../components/styles/AuthGate.module.css';

type Mode = 'login' | 'register';

export function AuthGate() {
  const { t } = useI18n();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<I18nKey | null>(null);
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Prefill the last-used username; focus the field.
    try {
      const last = localStorage.getItem('chess.lastUsername');
      if (last) setUsername(last);
    } catch {
      /* ignore */
    }
    nameRef.current?.focus();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fn = mode === 'login' ? login : register;
    const res = await fn(username.trim(), password);
    setBusy(false);
    if (!res.ok) setError((res.error as I18nKey) ?? 'auth_err_generic');
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.lang}>
        <LanguageToggle />
      </div>
      <form className={styles.card} onSubmit={submit}>
        <div className={styles.logo}>♟</div>
        <h1 className={styles.title}>{t('auth_welcome')}</h1>
        <p className={styles.subtitle}>{t('auth_subtitle')}</p>

        <div className={styles.tabs}>
          <button
            type="button"
            className={mode === 'login' ? styles.tabActive : styles.tab}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            {t('auth_login')}
          </button>
          <button
            type="button"
            className={mode === 'register' ? styles.tabActive : styles.tab}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            {t('auth_register')}
          </button>
        </div>

        <label className={styles.label}>
          {t('auth_username')}
          <input
            ref={nameRef}
            className={styles.input}
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            maxLength={32}
            required
          />
        </label>
        <label className={styles.label}>
          {t('auth_password')}
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
            minLength={6}
            required
          />
        </label>

        {error && <p className={styles.error}>{t(error)}</p>}

        <button type="submit" className={styles.submit} disabled={busy}>
          {busy
            ? t('common_loading')
            : t(
                mode === 'login' ? 'auth_submit_login' : 'auth_submit_register'
              )}
        </button>
      </form>
    </div>
  );
}
