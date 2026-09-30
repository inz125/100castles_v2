/**
 * 現在地を取得できなかったときの表示（近くタブ・地図タブで共通）。
 * retryLabel は取り直すボタンの名前（近くタブは「更新」、地図タブは「現在地へ移動」）
 */
export function locationErrorMessage(status: 'denied' | 'failed', retryLabel: string): string {
  return status === 'denied'
    ? '位置情報の利用が許可されていません。' +
        'iPhone の『設定』→『プライバシーとセキュリティ』→『位置情報サービス』→『Safari Webサイト』を' +
        `『使用中のみ』にしてから、『${retryLabel}』を押してください。`
    : `現在地を取得できませんでした。電波の届く場所で『${retryLabel}』を押してください。`
}
