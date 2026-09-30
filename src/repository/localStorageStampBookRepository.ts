import type { StampBook } from '../domain/stampBook'
import { isIsoDate, type StampRecord } from '../domain/stampRecord'
import { BookListeners } from './bookListeners'
import { UnsupportedVersionError, type StampBookRepository } from './stampBookRepository'

export const STORAGE_KEY = 'castles100.stampBook'

const CURRENT_VERSION = 1

type Records = Record<number, StampRecord>

type StoredData = {
  version: typeof CURRENT_VERSION
  records: Records
}

/**
 * localStorage に保存する実装。
 * 壊れたデータを読み込んだときは、元のデータを退避したうえで読める記録だけを使う。
 */
export class LocalStorageStampBookRepository implements StampBookRepository {
  private readonly storage: Storage
  private readonly now: () => number
  private readonly listeners = new BookListeners()

  constructor(storage: Storage = localStorage, now: () => number = Date.now) {
    this.storage = storage
    this.now = now
  }

  async load(): Promise<StampBook> {
    return this.read()
  }

  async saveRecord(castleNumber: number, record: StampRecord): Promise<void> {
    const records = { ...this.read(), [castleNumber]: { ...record } }
    this.write(records)
    this.listeners.notify(records)
  }

  subscribe(listener: (book: StampBook) => void): () => void {
    return this.listeners.add(listener)
  }

  private read(): Records {
    const raw = this.storage.getItem(STORAGE_KEY)
    if (raw === null) return {}

    const parsed = parse(raw)
    if (parsed === null) {
      this.backup(raw)
      this.storage.removeItem(STORAGE_KEY)
      return {}
    }
    if (parsed.hasInvalidRecords) {
      this.backup(raw)
      this.write(parsed.records)
    }
    return parsed.records
  }

  private write(records: Records): void {
    const data: StoredData = { version: CURRENT_VERSION, records }
    this.storage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  private backup(raw: string): void {
    this.storage.setItem(`${STORAGE_KEY}.backup-${this.now()}`, raw)
  }
}

type RawData = Record<string, unknown>

/** MIGRATIONS[n]：バージョン n のデータをバージョン n + 1 の形に変換する */
const MIGRATIONS: Record<number, (data: RawData) => RawData> = {}

function migrate(data: RawData, from: number): RawData {
  let migrated = data
  for (let v = from; v < CURRENT_VERSION; v++) migrated = MIGRATIONS[v](migrated)
  return migrated
}

/**
 * 保存データを解釈する。全体が読めなければ null。
 * 新しいバージョンのデータなら UnsupportedVersionError を投げる。
 */
function parse(raw: string): { records: Records; hasInvalidRecords: boolean } | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isObject(data)) return null

  const { version } = data
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return null
  if (version > CURRENT_VERSION) throw new UnsupportedVersionError(version)

  const migrated = migrate(data, version)
  if (!isObject(migrated.records)) return null

  const records: Records = {}
  let hasInvalidRecords = false
  for (const [key, value] of Object.entries(migrated.records)) {
    if (/^[1-9]\d*$/.test(key) && isStampRecord(value)) {
      records[Number(key)] = { stampedOn: value.stampedOn, memo: value.memo }
    } else {
      hasInvalidRecords = true
    }
  }
  return { records, hasInvalidRecords }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStampRecord(value: unknown): value is StampRecord {
  if (!isObject(value) || typeof value.memo !== 'string') return false
  const { stampedOn } = value
  return stampedOn === null || (typeof stampedOn === 'string' && isIsoDate(stampedOn))
}
