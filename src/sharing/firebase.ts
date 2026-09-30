import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import type { CloudBookStore } from './cloudBookStore'
import { firebaseConfig } from './firebaseConfig'
import { FirestoreCloudBookStore } from './firestoreCloudBookStore'

/**
 * 本番の Firestore につなぐ。
 * 端末内（IndexedDB）にも保存しておき、電波がないときも読み書きでき、つながったときに送る
 */
export function createFirestoreCloudBookStore(): CloudBookStore {
  const app = initializeApp(firebaseConfig)
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
  return new FirestoreCloudBookStore(db)
}
