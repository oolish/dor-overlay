import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion'
import { House, LayoutPanelLeft, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NeonGhost } from './NeonGhost.tsx'
import { anchorPoint, cornerStyle, nearestCorner } from '../overlay/corners.ts'
import type { Corner, GamePhase, RecPhase } from '../overlay/types.ts'
import { CORNERS, SPRING } from '../overlay/types.ts'

type Props = {
  gamePhase: GamePhase
  recPhase: RecPhase
  corner: Corner
  badge: boolean
  recCount: number
  autoFlipToken: number
  onCorner: (corner: Corner) => void
  onOpenClips: () => void
  onStartRec: () => void
  onHome: () => void
}

const FAB = 64
const REC_ICON = 20
const AUTO_FLIP_HOLD_MS = 2400
const FAB_SURFACE = 'bg-[#1a1a1a] shadow-[0_8px_32px_rgba(0,0,0,0.8)]'
const MENU_SURFACE = 'bg-[#3a3b41]/90 shadow-[0_6px_20px_rgba(0,0,0,0.5)] backdrop-blur-md'
const FAB_PRESS = 'transition-transform duration-200 hover:scale-105 active:scale-95'

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
  recCount,
  autoFlipToken,
  onCorner,
  onOpenClips,
  onStartRec,
  onHome,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const snap = useRef<{ dx: number; dy: number } | null>(null)
  const suppressClick = useRef(false)
  const [dragging, setDragging] = useState(false)
  const [hint, setHint] = useState<Corner>(corner)
  const [hot, setHot] = useState(false)
  const [autoFlipped, setAutoFlipped] = useState(false)

  const hidden = gamePhase === 'ingame' && recPhase === 'idle'
  const locked = recPhase !== 'idle' && recPhase !== 'rec_active'
  const canDrag = !hidden && !locked
  const showFlip = gamePhase === 'match_end' && recPhase === 'idle'
  const flipped = showFlip && (autoFlipped || hot)
  const reverse = corner.endsWith('right')

  useEffect(() => {
    if (autoFlipToken === 0) return
    setAutoFlipped(true)
    const id = window.setTimeout(() => setAutoFlipped(false), AUTO_FLIP_HOLD_MS)
    return () => window.clearTimeout(id)
  }, [autoFlipToken])

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
        onPointerLeave={() => setHot(false)}
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
          <div className={FAB_PRESS}>
            {showFlip ? (
              <FlipFace
                flipped={flipped}
                count={badge ? recCount : 0}
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
              <Island recPhase={recPhase} reverse={reverse} />
            )}
          </div>
          <AnimatePresence>
            {hot && !dragging && gamePhase === 'lobby' && recPhase === 'idle' && (
              <LobbyMenu above={corner.startsWith('bottom')} labelLeft={reverse} onStartRec={onStartRec} onHome={onHome} />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </>
  )
}

function LobbyMenu({
  above,
  labelLeft,
  onStartRec,
  onHome,
}: {
  above: boolean
  labelLeft: boolean
  onStartRec: () => void
  onHome: () => void
}) {
  const items = [
    {
      label: '녹화시작',
      onClick: onStartRec,
      icon: (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
          <circle cx="10" cy="10" r="8.6" fill="none" stroke="#e8453c" strokeWidth="1.8" />
          <circle cx="10" cy="10" r="4.6" fill="#e8453c" />
        </svg>
      ),
    },
    { label: '홈', onClick: onHome, icon: <House size={20} strokeWidth={2.2} /> },
  ]
  const ordered = above ? [...items].reverse() : items

  return (
    <div
      className={`absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 ${above ? 'bottom-full pb-3' : 'top-full pt-3'}`}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {ordered.map((item) => {
        const step = items.indexOf(item)
        return (
          <motion.button
            key={item.label}
            type="button"
            onClick={item.onClick}
            initial={{ opacity: 0, y: above ? 10 : -10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: above ? 10 : -10, scale: 0.85, transition: { duration: 0.12 } }}
            transition={{ ...SPRING, delay: step * 0.07 }}
            aria-label={item.label}
            className="group relative cursor-pointer"
          >
            <span className={`grid h-12 w-12 place-items-center rounded-full text-white transition-transform duration-200 group-hover:scale-105 ${MENU_SURFACE}`}>
              {item.icon}
            </span>
            <span
              className={`pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full bg-black/75 px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 ${labelLeft ? 'right-[calc(100%+8px)]' : 'left-[calc(100%+8px)]'}`}
            >
              {item.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

const ISLAND_SPRING = { type: 'spring' as const, bounce: 0.22, duration: 0.55 }
const TEXT_W = 104

function Island({ recPhase, reverse }: { recPhase: RecPhase; reverse: boolean }) {
  const isDot = recPhase === 'rec_active' || recPhase === 'rec_absorbing_start'
  const showText = recPhase !== 'idle' && recPhase !== 'rec_active'
  const stopping = recPhase !== 'rec_starting' && recPhase !== 'rec_absorbing_start'
  const pillW = FAB + (showText ? TEXT_W : 0)
  const box = isDot ? REC_ICON : pillW

  return (
    <motion.div
      initial={false}
      animate={{
        width: box,
        height: isDot ? REC_ICON : FAB,
        backgroundColor: isDot ? 'rgba(26,26,26,0)' : 'rgba(26,26,26,1)',
        boxShadow: isDot ? '0 0 0 rgba(0,0,0,0)' : '0 8px 32px rgba(0,0,0,0.8)',
      }}
      transition={ISLAND_SPRING}
      className="relative overflow-hidden rounded-full"
    >
      <motion.div
        initial={false}
        animate={{
          width: pillW,
          scale: isDot ? REC_ICON / pillW : 1,
          opacity: isDot ? 0 : 1,
          filter: isDot ? 'blur(4px)' : 'blur(0px)',
        }}
        transition={{ ...ISLAND_SPRING, opacity: { duration: 0.25, delay: isDot ? 0.12 : 0 } }}
        className={`absolute top-1/2 left-1/2 flex h-16 items-center ${reverse ? 'flex-row-reverse' : 'flex-row'}`}
        style={{ x: '-50%', y: '-50%' }}
      >
        <div className="relative h-[62px] w-[62px] shrink-0 overflow-hidden rounded-full">
          <NeonGhost />
        </div>
        <motion.div
          initial={false}
          animate={{ width: showText ? TEXT_W : 0, opacity: showText ? 1 : 0 }}
          transition={ISLAND_SPRING}
          className="overflow-hidden"
        >
          <span className={`block whitespace-nowrap text-[15px] font-semibold text-white ${reverse ? 'pr-1 pl-3' : 'pr-4 pl-1'}`}>
            {stopping ? '녹화종료' : '녹화시작'}
          </span>
        </motion.div>
      </motion.div>
      <motion.svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 m-auto h-5 w-5"
        initial={false}
        animate={
          recPhase === 'rec_active'
            ? { opacity: [1, 0.15, 1, 0.5], scale: 1 }
            : { opacity: isDot ? 1 : 0, scale: isDot ? 1 : 2.4 }
        }
        transition={
          recPhase === 'rec_active'
            ? { duration: 0.9, times: [0, 0.3, 0.6, 1], ease: 'easeInOut' }
            : { ...ISLAND_SPRING, opacity: { duration: 0.2, delay: isDot ? 0.18 : 0 } }
        }
      >
        <circle cx="10" cy="10" r="9" fill="none" stroke="#e8453c" strokeWidth="1.8" />
        <circle cx="10" cy="10" r="5" fill="#e8453c" />
      </motion.svg>
    </motion.div>
  )
}

function FlipFace({
  flipped,
  count,
  reverse,
  onOpen,
}: {
  flipped: boolean
  count: number
  reverse: boolean
  onOpen: () => void
}) {
  return (
    <div className="relative h-16 w-16" style={{ perspective: 900 }}>
      <motion.div
        className="relative h-full w-full"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={SPRING}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className={`absolute inset-0 rounded-full ${FAB_SURFACE}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <NeonGhost />
          </div>
        </div>
        <button
          type="button"
          onClick={onOpen}
          aria-label="클립 보기"
          className={`absolute inset-0 grid place-items-center rounded-full text-white ${MENU_SURFACE}`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <LayoutPanelLeft size={22} strokeWidth={2.2} />
        </button>
      </motion.div>
      <span
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full bg-black/75 px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap text-white transition-opacity duration-150 ${flipped ? 'opacity-100' : 'opacity-0'} ${reverse ? 'right-[calc(100%+8px)]' : 'left-[calc(100%+8px)]'}`}
      >
        클립 보기
      </span>
      {count > 0 && (
        <span
          className={`absolute -top-2 z-10 flex items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-black ${reverse ? '-left-2' : '-right-2'}`}
        >
          <Sparkles size={10} />
          {count}
        </span>
      )}
    </div>
  )
}
