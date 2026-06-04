import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/globals.css'
import './i18n'
import App from './App'
import { CdsToastProvider } from './components/cds'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            5 * 60 * 1000,
      retry:                1,
      refetchOnWindowFocus: false,
    },
  },
})

async function prepare() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    return worker.start({ onUnhandledRequest: 'bypass' })
  }
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

prepare().then(() => {
  createRoot(rootEl).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <CdsToastProvider>
          <App />
        </CdsToastProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
})
