export type SceneId = 'lantern' | 'canyon' | 'duel' | 'lounge' | 'victory' | 'alley'

export type ClipItem = {
  id: string
  timeLabel: string
  game: string
  meta: string
  favorite: boolean
  scene: SceneId
  fresh?: boolean
}

const BASE: ClipItem[] = [
  {
    id: 'clip-lantern',
    timeLabel: '1분 전',
    game: '나이트 런',
    meta: '전체 영상 1',
    favorite: false,
    scene: 'lantern',
  },
  {
    id: 'clip-canyon',
    timeLabel: '1시간 전',
    game: '스톰 컵',
    meta: '전체 영상 1 · 클립 1',
    favorite: true,
    scene: 'canyon',
  },
  {
    id: 'clip-duel',
    timeLabel: '1시간 전',
    game: '나이트 런',
    meta: '전체 영상 1',
    favorite: false,
    scene: 'duel',
  },
  {
    id: 'clip-lounge',
    timeLabel: '1시간 전',
    game: '스톰 컵',
    meta: '전체 영상 1',
    favorite: false,
    scene: 'lounge',
  },
  {
    id: 'clip-victory',
    timeLabel: '3시간 전',
    game: '나이트 런',
    meta: '전체 영상 1',
    favorite: false,
    scene: 'victory',
  },
  {
    id: 'clip-alley',
    timeLabel: '3시간 전',
    game: '스톰 컵',
    meta: '전체 영상 1',
    favorite: false,
    scene: 'alley',
  },
]

export function buildLibrary(matchSerial: number): ClipItem[] {
  const fresh: ClipItem[] = []
  for (let index = matchSerial; index >= 1; index -= 1) {
    fresh.push({
      id: `live-${index}`,
      timeLabel: index === matchSerial ? '방금 전' : `${matchSerial - index + 1}판 전`,
      game: '나이트 런',
      meta: '전체 영상 1 · 클립 1',
      favorite: false,
      scene: index % 2 === 0 ? 'victory' : 'duel',
      fresh: index === matchSerial,
    })
  }
  return [...fresh, ...BASE]
}

export function libraryCount(matchSerial: number) {
  return 21 + matchSerial
}
