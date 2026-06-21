import { renderToString } from 'react-dom/server'
import type { PublicUser } from '@shared/types'
import { Providers } from './Providers'
import { App } from './App'

interface ServerState {
  user: PublicUser | null
  url: string
  data: unknown
}

export function render(url: string, state: ServerState): { html: string; head: string } {
  const html = renderToString(
    <Providers url={url} user={state.user} initialData={state.data}>
      <App />
    </Providers>,
  )
  return { html, head: '' }
}
