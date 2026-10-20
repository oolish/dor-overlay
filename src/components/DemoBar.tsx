import type { GamePhase, RecPhase } from '../overlay/types.ts'
import { statusLabel } from '../overlay/types.ts'

type Props = {
  gamePhase: GamePhase
  recPhase: RecPhase
  locked: boolean
  onToggle: () => void
  onIngame: () => void
  onMatchEnd: () => void
  onLobby: () => void
}

export function DemoBar({
  gamePhase,
  recPhase,
  locked,
  onToggle,
  onIngame,
  onMatchEnd,
  onLobby,
}: Props) {
  const recording = recPhase === 'rec_active'
  return (
    <div className="pointer-events-none fixed top-3 left-1/2 z-[80] -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/15 bg-black/75 px-2 py-1.5 text-xs text-white shadow-2xl backdrop-blur-md">
        <span className="px-2 tracking-[0.14em] text-white/45">DEMO</span>
        <span className="rounded-full bg-white/10 px-3 py-1">{statusLabel(gamePhase, recPhase)}</span>
        <BarButton disabled={locked || gamePhase === 'match_end'} onClick={onToggle}>
          {recording ? 'F9 녹화 종료' : 'F9 녹화 시작'}
        </BarButton>
        <BarButton disabled={locked} onClick={onLobby}>
          로비
        </BarButton>
        <BarButton disabled={locked} onClick={onIngame}>
          인게임 진입
        </BarButton>
        <BarButton disabled={locked} onClick={onMatchEnd}>
          매치 종료
        </BarButton>
      </div>
    </div>
  )
}

function BarButton({
  children,
  onClick,
  disabled,
}: {
  children: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full px-3 py-1 text-white/90 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}
