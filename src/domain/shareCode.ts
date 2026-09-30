/** 共有コードに使う文字（読み間違えやすい 0 O 1 I L を除いた英大文字・数字、31 種類） */
export const SHARE_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** 共有コードの長さ。31 種類 × 12 文字で約 59 ビットあり、推測では当てられない */
export const SHARE_CODE_LENGTH = 12

/** 共有コード（正規化済み：区切りなしの 12 文字） */
export type ShareCode = string & { readonly __brand: 'ShareCode' }

/** 乱数のバイトで配列を埋める関数（テストで差し替えるため） */
export type RandomBytes = (array: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer>

const cryptoRandomBytes: RandomBytes = (array) => crypto.getRandomValues(array)

/**
 * 偏りが出ないよう、文字数の倍数に収まらないバイト（256 % 31 = 8 個分）は捨てて引き直す
 */
const LARGEST_UNBIASED_BYTE =
  Math.floor(256 / SHARE_CODE_ALPHABET.length) * SHARE_CODE_ALPHABET.length

/** 新しい共有コードを作る */
export function generateShareCode(randomBytes: RandomBytes = cryptoRandomBytes): ShareCode {
  let code = ''
  while (code.length < SHARE_CODE_LENGTH) {
    for (const byte of randomBytes(new Uint8Array(SHARE_CODE_LENGTH - code.length))) {
      if (byte < LARGEST_UNBIASED_BYTE)
        code += SHARE_CODE_ALPHABET[byte % SHARE_CODE_ALPHABET.length]
    }
  }
  return code as ShareCode
}

/** 表示用：4 文字ずつハイフンで区切る（例：ABCD-2345-EFGH） */
export function formatShareCode(code: ShareCode): string {
  return code.match(/.{1,4}/g)!.join('-')
}

/** 区切りとして読み飛ばす文字：空白・ハイフン類・長音記号（日本語入力のまま打った場合） */
const SEPARATORS = /[\s\-‐−ー]/g
const VALID_CODE = new RegExp(`^[${SHARE_CODE_ALPHABET}]{${SHARE_CODE_LENGTH}}$`)

/**
 * 入力された共有コードを読む。大文字・小文字、全角・半角、区切りの有無は区別しない。
 * 形式に合わなければ null
 */
export function parseShareCode(input: string): ShareCode | null {
  const normalized = input.normalize('NFKC').toUpperCase().replace(SEPARATORS, '')
  return VALID_CODE.test(normalized) ? (normalized as ShareCode) : null
}
