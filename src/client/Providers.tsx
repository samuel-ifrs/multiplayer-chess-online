import type { ReactNode } from 'react'
import type { PublicUser } from '@shared/types'
import { I18nProvider } from './i18n/I18nProvider'
import { AuthProvider } from './auth/AuthProvider'
import { RouterProvider } from './router'

export function Providers({
  url,
  user,
  initialData,
  children,
}: {
  url: string
  user: PublicUser | null
  initialData: unknown
  children: ReactNode
}) {
  return (
    <I18nProvider>
      <AuthProvider initialUser={user}>
        <RouterProvider url={url} initialData={initialData}>
          {children}
        </RouterProvider>
      </AuthProvider>
    </I18nProvider>
  )
}
