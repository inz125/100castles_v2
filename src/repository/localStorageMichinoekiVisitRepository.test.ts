import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY } from './localStorageStampBookRepository'
import {
  LocalStorageMichinoekiVisitRepository,
  MICHINOEKI_VISITS_STORAGE_KEY as KEY,
} from './localStorageMichinoekiVisitRepository'
import { describeMichinoekiVisitRepositoryContract } from './michinoekiVisitRepository.contract'
import { UnsupportedVersionError } from './stampBookRepository'

const NOW = 1_790_000_000_000
const BACKUP_KEY = `${KEY}.backup-${NOW}`

function createRepository() {
  return new LocalStorageMichinoekiVisitRepository(localStorage, () => NOW)
}

beforeEach(() => {
  localStorage.clear()
})

describeMichinoekiVisitRepositoryContract('LocalStorageMichinoekiVisitRepository', () => {
  localStorage.clear()
  return createRepository()
})

describe('LocalStorageMichinoekiVisitRepository', () => {
  it('城の記録帳とは別のキーに、バージョン付きの形式で保存する', async () => {
    await createRepository().saveVisit(3, '2026-10-01')
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({
      version: 1,
      visits: { 3: '2026-10-01' },
    })
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('別のインスタンスからも読み込める（アプリを開き直しても残る）', async () => {
    await createRepository().saveVisit(3, '2026-10-01')
    expect(await createRepository().load()).toEqual({ 3: '2026-10-01' })
  })

  it('JSON として読めないデータは退避して、空の訪問帳で始める', async () => {
    localStorage.setItem(KEY, '{壊れた')
    expect(await createRepository().load()).toEqual({})
    expect(localStorage.getItem(BACKUP_KEY)).toBe('{壊れた')
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('読めない記録だけを捨て、元のデータは退避する', async () => {
    const raw = JSON.stringify({
      version: 1,
      visits: { 3: '2026-10-01', 4: '2026-13-40', x: '2026-10-01', 5: 1 },
    })
    localStorage.setItem(KEY, raw)
    expect(await createRepository().load()).toEqual({ 3: '2026-10-01' })
    expect(localStorage.getItem(BACKUP_KEY)).toBe(raw)
  })

  it('新しいバージョンのデータには触れず、UnsupportedVersionError を投げる', async () => {
    const raw = JSON.stringify({ version: 2, visits: {} })
    localStorage.setItem(KEY, raw)
    await expect(createRepository().load()).rejects.toBeInstanceOf(UnsupportedVersionError)
    expect(localStorage.getItem(KEY)).toBe(raw)
  })
})
