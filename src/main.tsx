import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { LocalStorageStampBookRepository } from './repository/localStorageStampBookRepository'

const repository = new LocalStorageStampBookRepository(localStorage)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* GitHub Pages ではサーバー側のルーティングができないため、# 付きの URL を使う */}
    <HashRouter>
      <App repository={repository} preferenceStorage={localStorage} />
    </HashRouter>
  </StrictMode>,
)
