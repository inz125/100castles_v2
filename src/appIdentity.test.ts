import { describe, expect, it } from 'vitest'
import indexHtml from '../index.html?raw'
import iconSvg from '../public/icon.svg?raw'
import appleTouchIcon from '../public/icons/apple-touch-icon-180x180.png?inline'
import pwa64 from '../public/icons/pwa-64x64.png?inline'
import pwa192 from '../public/icons/pwa-192x192.png?inline'
import pwa512 from '../public/icons/pwa-512x512.png?inline'
import viteConfig from '../vite.config.ts?raw'

/** PNG の data URL から幅と高さ（IHDR）を読む */
function pngSize(dataUrl: string): { width: number; height: number } {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1, dataUrl.indexOf(',') + 1 + 40))
  const at = (i: number) => binary.charCodeAt(i)
  const u32 = (i: number) =>
    ((at(i) << 24) | (at(i + 1) << 16) | (at(i + 2) << 8) | at(i + 3)) >>> 0
  return { width: u32(16), height: u32(20) }
}

describe('アプリの名前（D-07）', () => {
  it('manifest の name と short_name は「100名城/道の駅」', () => {
    expect(viteConfig).toContain("name: '100名城/道の駅'")
    expect(viteConfig).toContain("short_name: '100名城/道の駅'")
    expect(viteConfig).not.toContain('100名城スタンプ帳')
  })

  it('ホーム画面の名前（apple-mobile-web-app-title）は「100名城/道の駅」', () => {
    expect(indexHtml).toContain(
      '<meta name="apple-mobile-web-app-title" content="100名城/道の駅" />',
    )
  })
})

describe('アプリのアイコン（D-94）', () => {
  it('マスカブルアイコンの指定はしない', () => {
    expect(viteConfig).not.toContain('maskable')
  })

  it('icon.svg は文字を使わず、左上の天守と右下の道の駅の標識を描く', () => {
    expect(iconSvg).not.toContain('<text')
    // 緑青の屋根の天守
    expect(iconSvg).toContain('#6aa7a0')
    // 右下の三角に道の駅の標識の青
    expect(iconSvg).toContain('<polygon points="512,0 512,512 0,512" fill="#2323c9"')
  })

  it('PNG は各サイズで書き出してある', () => {
    expect(pngSize(pwa64)).toEqual({ width: 64, height: 64 })
    expect(pngSize(pwa192)).toEqual({ width: 192, height: 192 })
    expect(pngSize(pwa512)).toEqual({ width: 512, height: 512 })
    expect(pngSize(appleTouchIcon)).toEqual({ width: 180, height: 180 })
  })
})
