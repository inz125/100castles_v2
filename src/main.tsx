import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LocalStorageStampBookRepository } from './repository/localStorageStampBookRepository'

const repository = new LocalStorageStampBookRepository(localStorage)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App repository={repository} preferenceStorage={localStorage} />
  </StrictMode>,
)
