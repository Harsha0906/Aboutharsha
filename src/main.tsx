import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/caveat/600.css'
import '@fontsource/caveat/700.css'
import '@fontsource-variable/inter'
import '@fontsource/jetbrains-mono/400.css'
import './styles.css'
import App from './App'
import './motion'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
