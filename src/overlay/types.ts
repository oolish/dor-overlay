export type GamePhase = 'lobby' | 'ingame' | 'match_end'

export type RecPhase =
  | 'idle'
  | 'rec_starting'
  | 'rec_absorbing_start'
  | 'rec_active'
  | 'rec_stopping'
  | 'rec_absorbing_end'

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export const CORNERS: Corner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

export const SPRING = { type: 'spring' as const, stiffness: 400, damping: 28 }

export function isLocked(phase: RecPhase) {
  return phase !== 'idle' && phase !== 'rec_active'
}

export function statusLabel(game: GamePhase, rec: RecPhase) {
  if (isLocked(rec)) return '전환 중'
  if (game === 'match_end') return '매치 종료'
  if (rec === 'rec_active') return '녹화 중 (F9)'
  if (game === 'ingame') return '인게임 스텔스'
  return '로비'
}
