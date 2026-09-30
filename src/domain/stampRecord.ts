/** YYYY-MM-DD 形式の日付 */
export type IsoDate = string

/**
 * 城ごとの記録。
 * 押印済みかどうかは押印日の有無で表す（押印済み ⇔ 押印日あり、を型の上で保証するため）。
 */
export type StampRecord = {
  stampedOn: IsoDate | null
  memo: string
}

export function createEmptyRecord(): StampRecord {
  return { stampedOn: null, memo: '' }
}

export function isStamped(record: StampRecord): boolean {
  return record.stampedOn !== null
}
