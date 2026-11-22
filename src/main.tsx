import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { createGeolocationProvider } from './location/locationProvider'
import { LocalStorageMichinoekiVisitRepository } from './repository/localStorageMichinoekiVisitRepository'
import { LocalStorageStampBookRepository } from './repository/localStorageStampBookRepository'
import { createFirestoreCloudBookStore } from './sharing/firebase'
import { createPwaUpdater } from './update/pwaUpdater'

const repository = new LocalStorageStampBookRepository(localStorage)
// 新しい版の確認と反映（D-08）
const updater = createPwaUpdater()
const michinoekiRepository = new LocalStorageMichinoekiVisitRepository(localStorage)
const cloud = createFirestoreCloudBookStore()
// Geolocation に対応していないブラウザでは undefined になる
const locationProvider = createGeolocationProvider(navigator.geolocation as Geolocation | undefined)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* GitHub Pages ではサーバー側のルーティングができないため、# 付きの URL を使う */}
    <HashRouter>
      <App
        localRepository={repository}
        michinoekiRepository={michinoekiRepository}
        cloud={cloud}
        preferenceStorage={localStorage}
        locationProvider={locationProvider}
        updater={updater}
      />
    </HashRouter>
  </StrictMode>,
)
