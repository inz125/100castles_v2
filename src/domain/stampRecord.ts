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

/**
 * 押印済みを切り替える。
 * ON にすると押印日に today が入る（すでに押印済みなら元の押印日を残す）。OFF にすると押印日を消す。
 */
export function setStamped(record: StampRecord, stamped: boolean, today: IsoDate): StampRecord {
  if (!stamped) return { ...record, stampedOn: null }
  return { ...record, stampedOn: record.stampedOn ?? today }
}
