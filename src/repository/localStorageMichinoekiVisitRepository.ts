import type { VisitBook } from '../domain/michinoekiVisits'
import { isIsoDate, type IsoDate } from '../domain/stampRecord'
import { BookListeners } from './bookListeners'
import type { MichinoekiVisitRepository } from './michinoekiVisitRepository'
import { UnsupportedVersionError } from './stampBookRepository'

export const MICHINOEKI_VISITS_STORAGE_KEY = 'castles100.michinoekiVisits'

const CURRENT_VERSION = 1

type Visits = Record<number, IsoDate>

type StoredData = {
  version: typeof CURRENT_VERSION
  visits: Visits
}

/**
 * localStorage に保存する実装（城の記録帳とは別のキー）。
 * 壊れたデータを読み込んだときは、元のデータを退避したうえで読める記録だけを使う。
 */
export class LocalStorageMichinoekiVisitRepository implements MichinoekiVisitRepository {
  private readonly storage: Storage
  private readonly now: () => number
  private readonly listeners = new BookListeners<VisitBook>()

  constructor(storage: Storage = localStorage, now: () => number = Date.now) {
    this.storage = storage
    this.now = now
  }

  async load(): Promise<VisitBook> {
    return this.read()
  }

  async saveVisit(stationId: number, visitedOn: IsoDate | null): Promise<void> {
    const visits = { ...this.read() }
    if (visitedOn === null) delete visits[stationId]
    else visits[stationId] = visitedOn
    this.write(visits)
    this.listeners.notify(visits)
  }

  subscribe(listener: (visits: VisitBook) => void): () => void {
    return this.listeners.add(listener)
  }

  private read(): Visits {
    const raw = this.storage.getItem(MICHINOEKI_VISITS_STORAGE_KEY)
    if (raw === null) return {}

    const parsed = parse(raw)
    if (parsed === null) {
      this.backup(raw)
      this.storage.removeItem(MICHINOEKI_VISITS_STORAGE_KEY)
      return {}
    }
    if (parsed.hasInvalidEntries) {
      this.backup(raw)
      this.write(parsed.visits)
    }
    return parsed.visits
  }

  private write(visits: Visits): void {
    const data: StoredData = { version: CURRENT_VERSION, visits }
    this.storage.setItem(MICHINOEKI_VISITS_STORAGE_KEY, JSON.stringify(data))
  }

  private backup(raw: string): void {
    this.storage.setItem(`${MICHINOEKI_VISITS_STORAGE_KEY}.backup-${this.now()}`, raw)
  }
}

/**
 * 保存データを解釈する。全体が読めなければ null。
 * 新しいバージョンのデータなら UnsupportedVersionError を投げる。
 */
function parse(raw: string): { visits: Visits; hasInvalidEntries: boolean } | null {
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
  if (!isObject(data.visits)) return null

  const visits: Visits = {}
  let hasInvalidEntries = false
  for (const [key, value] of Object.entries(data.visits)) {
    if (/^[1-9]\d*$/.test(key) && typeof value === 'string' && isIsoDate(value)) {
      visits[Number(key)] = value
    } else {
      hasInvalidEntries = true
    }
  }
  return { visits, hasInvalidEntries }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
