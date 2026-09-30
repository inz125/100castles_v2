/**
 * 距離（m）を表示用の文字列にする。
 * 1km 未満は 10m 単位（850m）、10km 未満は小数 1 桁（1.2km）、10km 以上は整数（12km）。
 * 四捨五入して上の区分に届いたら上の区分で表す（995m → 1.0km、9950m → 10km）。
 */
export function formatDistance(meters: number): string {
  const roundedMeters = Math.round(meters / 10) * 10
  if (roundedMeters < 1000) return `${roundedMeters}m`
  // 浮動小数の誤差を避けるため 0.1km 単位の整数で丸める
  const tenthsOfKm = Math.round(meters / 100)
  if (tenthsOfKm < 100) return `${(tenthsOfKm / 10).toFixed(1)}km`
  return `${Math.round(meters / 1000)}km`
}
