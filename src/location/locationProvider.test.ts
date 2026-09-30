import { describe, expect, it, vi } from 'vitest'
import { createGeolocationProvider, LOCATION_OPTIONS } from './locationProvider'

// GeolocationPositionError のコード
const PERMISSION_DENIED = 1
const POSITION_UNAVAILABLE = 2
const TIMEOUT = 3

type Success = (position: GeolocationPosition) => void
type Failure = (error: GeolocationPositionError) => void

/** getCurrentPosition が呼ばれたら、渡された関数で成功・失敗を返す偽の Geolocation */
function fakeGeolocation(respond: (success: Success, failure: Failure) => void) {
  const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>((success, failure) =>
    respond(success, failure!),
  )
  return { getCurrentPosition } as unknown as Geolocation & {
    getCurrentPosition: typeof getCurrentPosition
  }
}

const positionAt = (latitude: number, longitude: number) =>
  ({ coords: { latitude, longitude } }) as GeolocationPosition

const errorWithCode = (code: number) => ({ code }) as GeolocationPositionError

describe('createGeolocationProvider', () => {
  it('取得できたら緯度経度を返す', async () => {
    const geolocation = fakeGeolocation((success) => success(positionAt(36.2386, 137.9689)))
    const result = await createGeolocationProvider(geolocation).getCurrentPosition()
    expect(result).toEqual({ status: 'ok', position: { latitude: 36.2386, longitude: 137.9689 } })
  })

  it('取得のたびに決まった設定で問い合わせる', async () => {
    const geolocation = fakeGeolocation((success) => success(positionAt(35, 135)))
    await createGeolocationProvider(geolocation).getCurrentPosition()
    expect(geolocation.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      LOCATION_OPTIONS,
    )
  })

  it('許可されていなければ denied', async () => {
    const geolocation = fakeGeolocation((_, failure) => failure(errorWithCode(PERMISSION_DENIED)))
    expect(await createGeolocationProvider(geolocation).getCurrentPosition()).toEqual({
      status: 'denied',
    })
  })

  it.each([POSITION_UNAVAILABLE, TIMEOUT])(
    'それ以外のエラー（コード %d）は failed',
    async (code) => {
      const geolocation = fakeGeolocation((_, failure) => failure(errorWithCode(code)))
      expect(await createGeolocationProvider(geolocation).getCurrentPosition()).toEqual({
        status: 'failed',
      })
    },
  )

  it('Geolocation が使えない環境では failed', async () => {
    expect(await createGeolocationProvider(undefined).getCurrentPosition()).toEqual({
      status: 'failed',
    })
  })

  it('問い合わせ自体が例外を投げても failed', async () => {
    const geolocation = fakeGeolocation(() => {
      throw new Error('boom')
    })
    expect(await createGeolocationProvider(geolocation).getCurrentPosition()).toEqual({
      status: 'failed',
    })
  })
})
