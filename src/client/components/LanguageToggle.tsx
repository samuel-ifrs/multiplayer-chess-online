import { useI18n } from '../i18n/I18nProvider';
import styles from './styles/LanguageToggle.module.css';

export function LanguageToggle() {
  const { t, toggle } = useI18n();
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label="Switch language"
    >
      🌐 {t('lang_toggle')}
    </button>
  );
}
