import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { initializeApp } from 'firebase/app'
import {
  collection,
  collectionGroup,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { generateShareCode } from '../domain/shareCode'
import firestoreRules from '../../firestore.rules?raw'
import { FirestoreCloudBookStore } from './firestoreCloudBookStore'

/** 本物のプロジェクトに触れないよう、エミュレータ専用の demo- プロジェクトを使う */
const PROJECT_ID = 'demo-castles'
const EMULATOR = { host: '127.0.0.1', port: 8080 }

let testEnv: RulesTestEnvironment
let db: Firestore

beforeAll(async () => {
  // 本番に置くルール（firestore.rules）そのものを確かめる
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { ...EMULATOR, rules: firestoreRules },
  })
  const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo' }, 'rules-test')
  db = getFirestore(app)
  connectFirestoreEmulator(db, EMULATOR.host, EMULATOR.port)
})

afterAll(async () => {
  await testEnv.cleanup()
})

/** 共有を始めて記録帳を作り、そのコードを返す */
async function createBook() {
  const code = generateShareCode()
  await new FirestoreCloudBookStore(db).create(code, {
    59: { stampedOn: '2026-09-30', memo: '白鷺城' },
  })
  return code
}

const recordRef = (code: string, castle: string) => doc(db, 'books', code, 'records', castle)

describe('セキュリティルール：アプリの使い方はできる', () => {
  it('共有を始め、参加し、読み書きし、変更を受け取れる', async () => {
    const store = new FirestoreCloudBookStore(db)
    const code = generateShareCode()
    await assertSucceeds(store.create(code, { 59: { stampedOn: '2026-09-30', memo: '' } }))
    expect(await store.exists(code)).toBe(true)

    const book = store.open(code)
    await assertSucceeds(setDoc(recordRef(code, '1'), { stampedOn: null, memo: 'いつか行く' }))
    await book.saveRecord(100, { stampedOn: '2026-10-01', memo: '' })
    expect(await book.load()).toEqual({
      1: { stampedOn: null, memo: 'いつか行く' },
      59: { stampedOn: '2026-09-30', memo: '' },
      100: { stampedOn: '2026-10-01', memo: '' },
    })
  })

  it('ない記録帳を確かめると「ない」と分かる（参加するときの確認）', async () => {
    expect(await new FirestoreCloudBookStore(db).exists(generateShareCode())).toBe(false)
  })
})

describe('セキュリティルール：記録帳', () => {
  it('記録帳の一覧は取れない', async () => {
    await createBook()
    await assertFails(getDocs(collection(db, 'books')))
  })

  it('すべての記録帳の記録をまとめて検索できない', async () => {
    await createBook()
    await assertFails(getDocs(collectionGroup(db, 'records')))
  })

  it('共有コードの形でない名前の記録帳は作れない', async () => {
    for (const code of ['abcd2345efgh', 'ABCD2345EFG', 'ABCD2345EFGO', 'ABCD-2345-EFGH']) {
      await assertFails(
        setDoc(doc(db, 'books', code), { version: 1, createdAt: serverTimestamp() }),
      )
    }
  })

  it('決まった形でない記録帳は作れない', async () => {
    const ref = () => doc(db, 'books', generateShareCode())
    await assertFails(setDoc(ref(), { version: 2, createdAt: serverTimestamp() }))
    await assertFails(setDoc(ref(), { version: 1 }))
    await assertFails(setDoc(ref(), { version: 1, createdAt: serverTimestamp(), extra: true }))
  })

  it('作った記録帳は書き換えも削除もできない', async () => {
    const code = await createBook()
    await assertFails(setDoc(doc(db, 'books', code), { version: 1, createdAt: serverTimestamp() }))
    await assertFails(deleteDoc(doc(db, 'books', code)))
    await assertSucceeds(getDoc(doc(db, 'books', code)))
  })
})

describe('セキュリティルール：城ごとの記録', () => {
  it('記録帳がないコードには書けない', async () => {
    await assertFails(setDoc(recordRef(generateShareCode(), '59'), { stampedOn: null, memo: '' }))
  })

  it.each(['0', '101', '01', 'abc'])('城番号が 1〜100 でなければ書けない（%s）', async (castle) => {
    const code = await createBook()
    await assertFails(setDoc(recordRef(code, castle), { stampedOn: null, memo: '' }))
  })

  it.each([
    ['1 と 100', ['1', '100']],
    ['途中の番号', ['42']],
  ])('城番号 %s には書ける', async (_, castles) => {
    const code = await createBook()
    for (const castle of castles) {
      await assertSucceeds(setDoc(recordRef(code, castle), { stampedOn: null, memo: '' }))
    }
  })

  it.each([
    ['項目が足りない', { memo: '' }],
    ['余分な項目がある', { stampedOn: null, memo: '', extra: 1 }],
    ['押印日が日付の形でない', { stampedOn: '2026/09/30', memo: '' }],
    ['押印日が文字列でない', { stampedOn: 20260930, memo: '' }],
    ['メモが文字列でない', { stampedOn: null, memo: 1 }],
    ['メモが長すぎる', { stampedOn: null, memo: 'あ'.repeat(10_001) }],
  ])('%s 記録は書けない', async (_, data) => {
    const code = await createBook()
    await assertFails(setDoc(recordRef(code, '59'), data))
  })

  it('記録は上書きできるが削除はできない', async () => {
    const code = await createBook()
    await assertSucceeds(setDoc(recordRef(code, '59'), { stampedOn: null, memo: '' }))
    await assertFails(deleteDoc(recordRef(code, '59')))
  })
})
