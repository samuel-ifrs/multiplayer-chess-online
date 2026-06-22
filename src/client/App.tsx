import { useAuth } from './auth/AuthProvider';
import { useI18n } from './i18n/I18nProvider';
import { Link, matchRoute, useRouter } from './router';
import { AuthGate } from './auth/AuthGate';
import { Lobby } from './pages/Lobby';
import { Room } from './pages/Room';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';
import { LanguageToggle } from './components/LanguageToggle';
import styles from './components/styles/App.module.css';

function Header() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        ♟ {t('appName')}
      </Link>
      <nav className={styles.nav}>
        <Link to="/">{t('nav_lobby')}</Link>
        <Link to="/ranking">{t('nav_ranking')}</Link>
        {user && (
          <Link to={`/profile/${encodeURIComponent(user.username)}`}>
            {t('nav_profile')}
          </Link>
        )}
        <LanguageToggle />
        {user && (
          <button
            type="button"
            className={styles.logout}
            onClick={() => logout()}
          >
            {t('nav_logout')}
          </button>
        )}
      </nav>
    </header>
  );
}

function Routes() {
  const { path } = useRouter();

  const room = matchRoute(path, '/room/:id');
  if (room) return <Room roomId={room.id} />;

  const profile = matchRoute(path, '/profile/:name');
  if (profile) return <Profile name={profile.name} />;

  if (path === '/ranking') return <Leaderboard />;

  return <Lobby />;
}

export function App() {
  const { user } = useAuth();

  if (!user) return <AuthGate />;

  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <Routes />
      </main>
    </div>
  );
}
