/** 新しい版の確認と反映（D-08）。本番は Service Worker、テストは Fake を使う */
export interface AppUpdater {
  /** 新しい版が見つかったときに呼ぶ関数を登録する。戻り値で登録を解除する */
  onNeedRefresh(listener: () => void): () => void
  /** 新しい版があるかを確認する */
  check(): Promise<void>
  /** 新しい版に切り替えて再読み込みする */
  apply(): void
}
