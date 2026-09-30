import { describe, expect, it } from 'vitest'
import { formatDistance } from './formatDistance'

describe('formatDistance', () => {
  it.each([
    [0, '0m'],
    [4, '0m'],
    [5, '10m'],
    [846, '850m'],
    [994, '990m'],
  ])('1km 未満は 10m 単位：%d m → %s', (meters, expected) => {
    expect(formatDistance(meters)).toBe(expected)
  })

  it.each([
    [995, '1.0km'],
    [1000, '1.0km'],
    [1234, '1.2km'],
    [9800, '9.8km'],
    [9949, '9.9km'],
  ])('10km 未満は小数 1 桁：%d m → %s', (meters, expected) => {
    expect(formatDistance(meters)).toBe(expected)
  })

  it.each([
    [9950, '10km'],
    [12_345, '12km'],
    [123_456, '123km'],
    [2_345_678, '2346km'],
  ])('10km 以上は整数：%d m → %s', (meters, expected) => {
    expect(formatDistance(meters)).toBe(expected)
  })
})
