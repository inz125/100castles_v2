import castlesJson from '../data/castles.json'

/** 日本城郭協会のスタンプ帳と同じ地方区分（並び順も同じ） */
export const REGIONS = [
  '北海道・東北',
  '関東・甲信越',
  '北陸・東海',
  '近畿',
  '中国・四国',
  '九州・沖縄',
] as const

export type Region = (typeof REGIONS)[number]

export type Castle = {
  /** 100名城の番号（1〜100） */
  number: number
  name: string
  prefecture: string
  region: Region
}

/** 日本100名城（番号順） */
export const castles: readonly Castle[] = castlesJson as Castle[]
