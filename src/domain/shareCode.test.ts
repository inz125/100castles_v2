import { describe, expect, it } from 'vitest'
import {
  generateShareCode,
  SHARE_CODE_ALPHABET,
  SHARE_CODE_LENGTH,
  type RandomBytes,
} from './shareCode'

/** 決まったバイト列を順に返す乱数（足りなくなったら例外） */
function fixedRandom(bytes: number[]): RandomBytes {
  let i = 0
  return (array) => {
    for (let j = 0; j < array.length; j++) {
      if (i >= bytes.length) throw new Error('bytes exhausted')
      array[j] = bytes[i++]
    }
    return array
  }
}

describe('共有コードの文字', () => {
  it('読み間違えやすい 0 O 1 I L を含まない英大文字・数字', () => {
    expect(SHARE_CODE_ALPHABET).toMatch(/^[A-Z2-9]+$/)
    for (const c of '0O1IL') expect(SHARE_CODE_ALPHABET).not.toContain(c)
    expect(new Set(SHARE_CODE_ALPHABET).size).toBe(SHARE_CODE_ALPHABET.length)
    expect(SHARE_CODE_ALPHABET).toHaveLength(31)
  })
})

describe('generateShareCode', () => {
  it('12 文字で、使える文字だけからなる', () => {
    const code = generateShareCode()
    expect(code).toHaveLength(SHARE_CODE_LENGTH)
    expect(SHARE_CODE_LENGTH).toBe(12)
    for (const c of code) expect(SHARE_CODE_ALPHABET).toContain(c)
  })

  it('乱数のバイトを文字に対応させる', () => {
    const bytes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 30]
    expect(generateShareCode(fixedRandom(bytes))).toBe(
      bytes.map((b) => SHARE_CODE_ALPHABET[b]).join(''),
    )
  })

  it('偏りが出ないよう、文字数の倍数に収まらないバイトは捨てて引き直す', () => {
    // 256 を 31 で割った余り 8 個分（248〜255）は捨てる。247 は 247 % 31 = 30
    const bytes = [248, 255, 247, ...Array(11).fill(0)]
    const code = generateShareCode(fixedRandom(bytes))
    expect(code).toBe(SHARE_CODE_ALPHABET[30] + SHARE_CODE_ALPHABET[0].repeat(11))
  })

  it('毎回ちがうコードになる', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateShareCode()))
    expect(codes.size).toBe(100)
  })
})
