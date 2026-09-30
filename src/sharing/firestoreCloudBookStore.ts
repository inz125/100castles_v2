import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  type DocumentReference,
  type Firestore,
  type QuerySnapshot,
} from 'firebase/firestore'
import type { ShareCode } from '../domain/shareCode'
import type { StampBook } from '../domain/stampBook'
import { isStampRecord, type StampRecord } from '../domain/stampRecord'
import { UnsupportedVersionError } from '../repository/stampBookRepository'
import {
  BookAlreadyExistsError,
  type CloudBookRepository,
  type CloudBookStore,
} from './cloudBookStore'

/**
 * Firestore での置き場所：
 * - books/{共有コード}：記録帳の情報（version・作った日時）
 * - books/{共有コード}/records/{城番号}：城ごとの記録（stampedOn・memo）
 */
const BOOKS = 'books'
const RECORDS = 'records'
const CURRENT_VERSION = 1

/** Cloud Firestore に置く共有の記録帳 */
export class FirestoreCloudBookStore implements CloudBookStore {
  private readonly db: Firestore

  constructor(db: Firestore) {
    this.db = db
  }

  async create(code: ShareCode, book: StampBook): Promise<void> {
    const bookRef = doc(this.db, BOOKS, code)
    // 同じコードの記録帳を上書きしないよう、あるかどうかの確認と作成をまとめて行う
    await runTransaction(this.db, async (transaction) => {
      if ((await transaction.get(bookRef)).exists()) throw new BookAlreadyExistsError()
      transaction.set(bookRef, { version: CURRENT_VERSION, createdAt: serverTimestamp() })
      for (const [castleNumber, record] of Object.entries(book)) {
        if (record) transaction.set(doc(bookRef, RECORDS, castleNumber), toData(record))
      }
    })
  }

  async exists(code: ShareCode): Promise<boolean> {
    return (await getDoc(doc(this.db, BOOKS, code))).exists()
  }

  open(code: ShareCode): CloudBookRepository {
    const bookRef = doc(this.db, BOOKS, code)
    const recordsRef = collection(bookRef, RECORDS)
    return {
      load: async () => {
        const version = await readVersion(bookRef)
        if (version !== null && version > CURRENT_VERSION) {
          throw new UnsupportedVersionError(version)
        }
        return toBook(await getDocs(recordsRef))
      },
      saveRecord: async (castleNumber, record) => {
        // 送り終わるのは電波がつながってからなので待たない（端末内には書いた時点で反映される）
        setDoc(doc(recordsRef, String(castleNumber)), toData(record)).catch((error: unknown) =>
          console.error('記録をクラウドに保存できませんでした', error),
        )
      },
      subscribe: (listener) =>
        onSnapshot(
          recordsRef,
          (snapshot) => listener(toBook(snapshot)),
          (error) => console.error('共有の記録帳の変更を受け取れませんでした', error),
        ),
      subscribePendingWrites: (listener) =>
        onSnapshot(
          recordsRef,
          { includeMetadataChanges: true },
          (snapshot) => listener(snapshot.metadata.hasPendingWrites),
          (error) => console.error('送信待ちの状態を受け取れませんでした', error),
        ),
    }
  }
}

/**
 * 記録帳のバージョン。電波がなく端末内にもまだ無いときは確かめられないので null
 * （記録の読み書きは続けられるようにする）
 */
async function readVersion(bookRef: DocumentReference): Promise<number | null> {
  try {
    const version: unknown = (await getDoc(bookRef)).get('version')
    return typeof version === 'number' ? version : null
  } catch {
    return null
  }
}

function toData(record: StampRecord) {
  return { stampedOn: record.stampedOn, memo: record.memo }
}

/** 記録の形になっていないものは読み飛ばす */
function toBook(snapshot: QuerySnapshot): StampBook {
  const book: Record<number, StampRecord> = {}
  for (const record of snapshot.docs) {
    const data = record.data()
    if (/^[1-9]\d*$/.test(record.id) && isStampRecord(data)) {
      book[Number(record.id)] = toData(data)
    }
  }
  return book
}
