import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './context/AuthProvider.tsx'
import { I18nProvider } from './context/I18nProvider.tsx'
import { ThemeProvider } from './context/ThemeProvider.tsx'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Nexora: #root element not found')

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)
