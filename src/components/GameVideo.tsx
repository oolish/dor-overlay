import { useEffect, useRef } from 'react'
import type { GamePhase } from '../overlay/machine'

const SOURCES: Record<GamePhase, string> = {
  lobby: '/lobby.mp4',
  ingame: '/gameplay.mp4',
  match_end: '/match-end.mp4',
}

const PHASES = Object.keys(SOURCES) as GamePhase[]

export function GameVideo({ phase }: { phase: GamePhase }) {
  const refs = useRef<Partial<Record<GamePhase, HTMLVideoElement | null>>>({})

  useEffect(() => {
    for (const p of PHASES) {
      const v = refs.current[p]
      if (!v) continue
      if (p === phase) {
        if (p === 'match_end') v.currentTime = 0
        void v.play().catch(() => {})
      } else {
        v.pause()
      }
    }
  }, [phase])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#07080d]">
      {PHASES.map((p) => (
        <video
          key={p}
          ref={(el) => {
            refs.current[p] = el
          }}
          data-phase={p}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${p === phase ? 'opacity-100' : 'opacity-0'}`}
          src={SOURCES[p]}
          muted
          loop
          playsInline
          preload="auto"
          autoPlay={p === phase}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.38)_100%)]" />
    </div>
  )
}
