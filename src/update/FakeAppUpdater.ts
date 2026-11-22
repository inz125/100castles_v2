import { vi } from 'vitest'
import type { AppUpdater } from './AppUpdater'

/** テスト用の AppUpdater。新しい版が見つかったことを好きなときに知らせられる */
export class FakeAppUpdater implements AppUpdater {
  private readonly listeners = new Set<() => void>()
  readonly check = vi.fn<() => Promise<void>>(async () => {})
  readonly apply = vi.fn<() => void>()

  onNeedRefresh(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** 新しい版が見つかったことにする */
  findNewVersion(): void {
    for (const listener of this.listeners) listener()
  }
}
