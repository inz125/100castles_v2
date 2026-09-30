import { beforeEach, describe, expect, it } from 'vitest'
import { LocalStorageStampBookRepository, STORAGE_KEY } from './localStorageStampBookRepository'
import { UnsupportedVersionError } from './stampBookRepository'
import { describeStampBookRepositoryContract } from './stampBookRepository.contract'

const NOW = 1_790_000_000_000
const BACKUP_KEY = `${STORAGE_KEY}.backup-${NOW}`

function createRepository() {
  return new LocalStorageStampBookRepository(localStorage, () => NOW)
}

beforeEach(() => {
  localStorage.clear()
})

describeStampBookRepositoryContract('LocalStorageStampBookRepository', () => {
  localStorage.clear()
  return createRepository()
})

describe('LocalStorageStampBookRepository', () => {
  it('バージョン付きの形式で保存する', async () => {
    await createRepository().saveRecord(59, { stampedOn: '2026-09-30', memo: '' })
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
      version: 1,
      records: { 59: { stampedOn: '2026-09-30', memo: '' } },
    })
  })

  it('別のインスタンスからも読み込める（アプリを開き直しても残る）', async () => {
    await createRepository().saveRecord(59, { stampedOn: '2026-09-30', memo: '' })
    expect(await createRepository().load()).toEqual({ 59: { stampedOn: '2026-09-30', memo: '' } })
  })

  describe('壊れたデータ', () => {
    it.each([
      ['JSON として読めない', '{broken'],
      ['オブジェクトでない', '"text"'],
      ['records がない', '{"version":1}'],
    ])('%s：元のデータを退避して空の記録帳で始める', async (_, raw) => {
      localStorage.setItem(STORAGE_KEY, raw)
      expect(await createRepository().load()).toEqual({})
      expect(localStorage.getItem(BACKUP_KEY)).toBe(raw)
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('一部の記録だけ壊れている：読める記録は使い、元のデータを退避して保存し直す', async () => {
      const raw = JSON.stringify({
        version: 1,
        records: {
          1: { stampedOn: '2026-01-01', memo: 'OK' },
          2: { stampedOn: '2026-02-30', memo: '' }, // 存在しない日付
          3: { stampedOn: null }, // memo がない
          4: 'text', // オブジェクトでない
          abc: { stampedOn: null, memo: '' }, // 城の番号でない
          5: { stampedOn: null, memo: 'OK' },
        },
      })
      localStorage.setItem(STORAGE_KEY, raw)

      const expected = {
        1: { stampedOn: '2026-01-01', memo: 'OK' },
        5: { stampedOn: null, memo: 'OK' },
      }
      expect(await createRepository().load()).toEqual(expected)
      expect(localStorage.getItem(BACKUP_KEY)).toBe(raw)
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
        version: 1,
        records: expected,
      })
    })

    it('壊れていなければ退避しない', async () => {
      await createRepository().saveRecord(59, { stampedOn: '2026-09-30', memo: '' })
      await createRepository().load()
      expect(localStorage.length).toBe(1)
    })
  })

  describe('バージョン', () => {
    it.each([
      ['version がない', '{"records":{}}'],
      ['version が整数でない', '{"version":"1","records":{}}'],
      ['version が 0', '{"version":0,"records":{}}'],
    ])('%s：壊れたデータとして退避する', async (_, raw) => {
      localStorage.setItem(STORAGE_KEY, raw)
      expect(await createRepository().load()).toEqual({})
      expect(localStorage.getItem(BACKUP_KEY)).toBe(raw)
    })

    describe('アプリが知らない新しいバージョン', () => {
      const raw = JSON.stringify({ version: 2, records: { 59: { stampedOn: '2026-09-30' } } })

      beforeEach(() => {
        localStorage.setItem(STORAGE_KEY, raw)
      })

      it('読み込むと UnsupportedVersionError になり、データには触れない', async () => {
        await expect(createRepository().load()).rejects.toBeInstanceOf(UnsupportedVersionError)
        expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
        expect(localStorage.length).toBe(1)
      })

      it('保存しようとしても UnsupportedVersionError になり、データには触れない', async () => {
        await expect(
          createRepository().saveRecord(1, { stampedOn: null, memo: '' }),
        ).rejects.toBeInstanceOf(UnsupportedVersionError)
        expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
        expect(localStorage.length).toBe(1)
      })

      it('エラーにデータのバージョンを持つ', async () => {
        await expect(createRepository().load()).rejects.toMatchObject({ version: 2 })
      })
    })
  })
})
