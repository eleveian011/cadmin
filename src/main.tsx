import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App'
import { CdsToastProvider } from './components/cds'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <CdsToastProvider>
      <App />
    </CdsToastProvider>
  </StrictMode>,
)
