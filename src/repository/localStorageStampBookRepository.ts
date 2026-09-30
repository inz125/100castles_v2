import type { StampBook } from '../domain/stampBook'
import { isIsoDate, type StampRecord } from '../domain/stampRecord'
import type { StampBookRepository } from './stampBookRepository'

export const STORAGE_KEY = 'castles100.stampBook'

type Records = Record<number, StampRecord>

type StoredData = {
  version: 1
  records: Records
}

/**
 * localStorage に保存する実装。
 * 壊れたデータを読み込んだときは、元のデータを退避したうえで読める記録だけを使う。
 */
export class LocalStorageStampBookRepository implements StampBookRepository {
  private readonly storage: Storage
  private readonly now: () => number

  constructor(storage: Storage = localStorage, now: () => number = Date.now) {
    this.storage = storage
    this.now = now
  }

  async load(): Promise<StampBook> {
    return this.read()
  }

  async saveRecord(castleNumber: number, record: StampRecord): Promise<void> {
    this.write({ ...this.read(), [castleNumber]: { ...record } })
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
    const data: StoredData = { version: 1, records }
    this.storage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  private backup(raw: string): void {
    this.storage.setItem(`${STORAGE_KEY}.backup-${this.now()}`, raw)
  }
}

/** 保存データを解釈する。全体が読めなければ null */
function parse(raw: string): { records: Records; hasInvalidRecords: boolean } | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isObject(data) || !isObject(data.records)) return null

  const records: Records = {}
  let hasInvalidRecords = false
  for (const [key, value] of Object.entries(data.records)) {
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
