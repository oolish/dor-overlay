import { animate, motion, useMotionValue } from 'framer-motion'
import { Sparkles, Video } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DorGhost } from './DorGhost.tsx'
import { anchorPoint, cornerStyle, nearestCorner } from '../overlay/corners.ts'
import type { Corner, GamePhase, RecPhase } from '../overlay/types.ts'
import { CORNERS, SPRING } from '../overlay/types.ts'

type Props = {
  gamePhase: GamePhase
  recPhase: RecPhase
  corner: Corner
  badge: boolean
  autoFlipToken: number
  onCorner: (corner: Corner) => void
  onOpenClips: () => void
}

const SLOT: Record<Corner, string> = {
  'top-left': 'top-6 left-6',
  'top-right': 'top-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-right': 'bottom-6 right-6',
}

export function OverlayWidget({
  gamePhase,
  recPhase,
  corner,
  badge,
  autoFlipToken,
  onCorner,
  onOpenClips,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const snap = useRef<{ dx: number; dy: number } | null>(null)
  const suppressClick = useRef(false)
  const [dragging, setDragging] = useState(false)
  const [hint, setHint] = useState<Corner>(corner)
  const [hot, setHot] = useState(false)
  const [dismissedFlip, setDismissedFlip] = useState(0)

  const hidden = gamePhase === 'ingame' && recPhase === 'idle'
  const locked = recPhase !== 'idle' && recPhase !== 'rec_active'
  const canDrag = !hidden && !locked
  const showFlip = gamePhase === 'match_end' && recPhase === 'idle'
  const heldOpen = showFlip && autoFlipToken > 0 && dismissedFlip !== autoFlipToken
  const flipped = heldOpen || (showFlip && hot)
  const reverse = corner.endsWith('right')

  useEffect(() => {
    const request = snap.current
    if (!request) return
    snap.current = null
    void animate(x, 0, SPRING)
    void animate(y, 0, SPRING)
  }, [corner, x, y])

  return (
    <>
      {dragging &&
        CORNERS.map((slot) => (
          <div
            key={slot}
            className={`pointer-events-none fixed z-30 h-16 w-16 rounded-full border border-dashed transition-colors ${SLOT[slot]} ${hint === slot ? 'border-white bg-white/15' : 'border-white/40'}`}
          />
        ))}
      <motion.div
        ref={shellRef}
        drag={canDrag}
        dragMomentum={false}
        dragElastic={0.08}
        style={{ x, y, position: 'fixed', zIndex: 40, ...cornerStyle(corner) }}
        role="button"
        aria-label="도르 위젯"
        tabIndex={0}
        className={`touch-none ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${hidden ? 'pointer-events-none' : ''}`}
        onDragStart={() => {
          setDragging(true)
          setHint(corner)
        }}
        onDrag={() => {
          const rect = shellRef.current?.getBoundingClientRect()
          if (!rect) return
          setHint(nearestCorner(rect.left + rect.width / 2, rect.top + rect.height / 2))
        }}
        onDragEnd={(_, info) => {
          setDragging(false)
          if (Math.hypot(info.offset.x, info.offset.y) > 6) suppressClick.current = true
          const rect = shellRef.current?.getBoundingClientRect()
          if (!rect) return
          const next = nearestCorner(rect.left + rect.width / 2, rect.top + rect.height / 2)
          const target = anchorPoint(next, rect.width, rect.height)
          x.set(rect.left - target.left)
          y.set(rect.top - target.top)
          snap.current = { dx: rect.left - target.left, dy: rect.top - target.top }
          onCorner(next)
        }}
        onPointerEnter={() => setHot(true)}
        onPointerLeave={() => {
          setHot(false)
          setDismissedFlip(autoFlipToken)
        }}
      >
        <motion.div
          initial={false}
          animate={{
            x: hidden ? (reverse ? 180 : -180) : 0,
            opacity: hidden ? 0 : 1,
            scale: hidden ? 0.86 : 1,
          }}
          transition={SPRING}
        >
          {showFlip ? (
            <FlipFace
              flipped={flipped}
              badge={badge}
              reverse={reverse}
              onOpen={() => {
                if (suppressClick.current) {
                  suppressClick.current = false
                  return
                }
                onOpenClips()
              }}
            />
          ) : (
            <Island recPhase={recPhase} reverse={reverse} showCamera={hot && gamePhase === 'lobby' && recPhase === 'idle'} />
          )}
          {hot && gamePhase === 'lobby' && recPhase === 'idle' && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-medium text-black ${reverse ? 'right-[calc(100%+10px)]' : 'left-[calc(100%+10px)]'}`}
            >
              수동 녹화 · F9
            </div>
          )}
        </motion.div>
      </motion.div>
    </>
  )
}

function Island({
  recPhase,
  reverse,
  showCamera,
}: {
  recPhase: RecPhase
  reverse: boolean
  showCamera: boolean
}) {
  const expanded = recPhase === 'rec_starting' || recPhase === 'rec_stopping'
  const isDot = recPhase === 'rec_active'
  const stopping = recPhase === 'rec_stopping' || recPhase === 'rec_absorbing_end'
  const textW = expanded ? 104 : 0
  const box = isDot ? 28 : 56 + textW

  return (
    <motion.div
      initial={false}
      animate={{ width: box, height: isDot ? 28 : 56, rotate: isDot ? 180 : 0 }}
      transition={{ ...SPRING, rotate: { type: 'spring', stiffness: 400, damping: 28 } }}
      className={`relative box-border flex items-center overflow-hidden rounded-full backdrop-blur-md ${reverse ? 'flex-row-reverse' : 'flex-row'} ${isDot ? 'bg-red-500' : 'bg-[#1b1b1b]'}`}
    >
      <div className={`grid shrink-0 place-items-center ${isDot ? 'h-0 w-0' : 'h-[52px] w-[52px]'}`}>
        <DorGhost className={`h-full w-full rounded-full ${isDot ? 'opacity-0' : 'opacity-100'}`} />
      </div>
      <motion.div
        initial={false}
        animate={{ width: textW, opacity: expanded ? 1 : 0 }}
        transition={SPRING}
        className="overflow-hidden"
      >
        <span className={`block whitespace-nowrap text-[15px] font-semibold text-white ${reverse ? 'pr-1 pl-3' : 'pr-4 pl-1'}`}>
          {stopping ? '녹화종료' : '녹화시작'}
        </span>
      </motion.div>
      {isDot && (
        <span
          className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
          style={{ animation: 'rec-pulse 1.4s ease-in-out infinite' }}
        />
      )}
      {showCamera && (
        <span className={`absolute -top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-black ${reverse ? '-left-1' : '-right-1'}`}>
          <Video size={11} />
        </span>
      )}
    </motion.div>
  )
}

function FlipFace({
  flipped,
  badge,
  reverse,
  onOpen,
}: {
  flipped: boolean
  badge: boolean
  reverse: boolean
  onOpen: () => void
}) {
  return (
    <div className="h-14 w-14" style={{ perspective: 900 }}>
      <motion.div
        className="relative h-full w-full"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={SPRING}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className="absolute inset-0 grid place-items-center rounded-full bg-[#1b1b1b]"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <DorGhost className="h-full w-full rounded-full" />
          {badge && (
            <span className={`absolute -top-2 flex items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-black ${reverse ? '-left-2' : '-right-2'}`}>
              <Sparkles size={10} />1
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="absolute inset-0 grid place-items-center rounded-full bg-white text-[11px] leading-tight font-bold text-[#16141c]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          내 클립
        </button>
      </motion.div>
    </div>
  )
}
