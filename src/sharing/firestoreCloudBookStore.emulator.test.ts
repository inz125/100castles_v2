import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, doc, getFirestore, setDoc } from 'firebase/firestore'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { generateShareCode } from '../domain/shareCode'
import type { StampBook } from '../domain/stampBook'
import { UnsupportedVersionError } from '../repository/stampBookRepository'
import { describeCloudBookStoreContract } from './cloudBookStore.contract'
import { FirestoreCloudBookStore } from './firestoreCloudBookStore'

/** 本物のプロジェクトに触れないよう、エミュレータ専用の demo- プロジェクトを使う */
const PROJECT_ID = 'demo-castles'
const EMULATOR = { host: '127.0.0.1', port: 8080 }

let testEnv: RulesTestEnvironment
let appCount = 0

/** 端末 1 台分：別々のアプリ（＝別々の端末内キャッシュ）でエミュレータにつなぐ */
function connectDevice() {
  const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo' }, `device-${appCount++}`)
  const db = getFirestore(app)
  connectFirestoreEmulator(db, EMULATOR.host, EMULATOR.port)
  return db
}

beforeAll(async () => {
  // セキュリティルールは 13-3 で確かめるので、ここではすべて許可して記録帳の振る舞いだけを見る
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      ...EMULATOR,
      rules: `rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /{document=**} { allow read, write: if true; }
          }
        }`,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

describeCloudBookStoreContract(
  'FirestoreCloudBookStore',
  () => new FirestoreCloudBookStore(connectDevice()),
)

describe('FirestoreCloudBookStore：2 台の端末', () => {
  it('別の端末（別のアプリ）の変更を受け取る', async () => {
    const code = generateShareCode()
    const mine = new FirestoreCloudBookStore(connectDevice())
    const theirs = new FirestoreCloudBookStore(connectDevice())
    await mine.create(code, {})
    const listener = vi.fn<(book: StampBook) => void>()
    mine.open(code).subscribe(listener)

    await theirs.open(code).saveRecord(59, { stampedOn: '2026-09-30', memo: '' })

    await vi.waitFor(() =>
      expect(listener).toHaveBeenLastCalledWith({ 59: { stampedOn: '2026-09-30', memo: '' } }),
    )
  })
})

describe('FirestoreCloudBookStore：保存されているデータ', () => {
  it('記録の形になっていないものは読み飛ばす', async () => {
    const code = generateShareCode()
    const db = connectDevice()
    const store = new FirestoreCloudBookStore(db)
    await store.create(code, { 59: { stampedOn: '2026-09-30', memo: '' } })
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const admin = context.firestore()
      await admin.doc(`books/${code}/records/1`).set({ stampedOn: 'yesterday', memo: '' })
      await admin.doc(`books/${code}/records/abc`).set({ stampedOn: null, memo: '' })
    })

    expect(await store.open(code).load()).toEqual({ 59: { stampedOn: '2026-09-30', memo: '' } })
  })

  it('新しいバージョンの記録帳なら UnsupportedVersionError', async () => {
    const code = generateShareCode()
    const db = connectDevice()
    await setDoc(doc(db, 'books', code), { version: 2 })

    await expect(new FirestoreCloudBookStore(db).open(code).load()).rejects.toThrow(
      UnsupportedVersionError,
    )
  })
})
