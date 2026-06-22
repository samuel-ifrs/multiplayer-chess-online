import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode
} from 'react';

interface RouterContextValue {
  path: string;
  navigate: (to: string) => void;
  /** SSR-prefetched data for the initial route (consumed once, on first paint). */
  initialData: unknown;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export function RouterProvider({
  url,
  initialData,
  children
}: {
  url: string;
  initialData: unknown;
  children: ReactNode;
}) {
  const [path, setPath] = useState(() => url.split('?')[0] || '/');

  const navigate = useCallback((to: string) => {
    const clean = to.split('?')[0] || '/';
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', to);
      window.scrollTo(0, 0);
    }
    setPath(clean);
  }, []);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const value = useMemo(
    () => ({ path, navigate, initialData }),
    [path, navigate, initialData]
  );
  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
}

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

/** Client-side navigation link. */
export function Link({
  to,
  children,
  ...rest
}: { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      onClick={e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

/** Match `/room/:id` style routes; returns the first path param or null. */
export function matchRoute(
  path: string,
  pattern: string
): Record<string, string> | null {
  const pParts = pattern.split('/').filter(Boolean);
  const aParts = path.split('/').filter(Boolean);
  if (pParts.length !== aParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pParts.length; i++) {
    if (pParts[i].startsWith(':')) {
      params[pParts[i].slice(1)] = decodeURIComponent(aParts[i]);
    } else if (pParts[i] !== aParts[i]) {
      return null;
    }
  }
  return params;
}
