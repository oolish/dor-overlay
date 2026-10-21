import { motion, useMotionValue } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { GooeyClipsMenu, type MenuClip } from './GooeyClipsMenu.tsx'
import { NeonGhost } from './NeonGhost.tsx'
import { anchorPoint, cornerStyle, nearestCorner } from '../overlay/corners.ts'
import type { Corner, GamePhase, RecPhase } from '../overlay/types.ts'
import { SPRING } from '../overlay/types.ts'

type Props = {
  gamePhase: GamePhase
  recPhase: RecPhase
  corner: Corner
  badge: boolean
  recCount: number
  autoFlipToken: number
  onCorner: (corner: Corner) => void
  onOpenClips: () => void
  onOpenClipDetail: (clip: MenuClip) => void
  onStartRec: () => void
  onHome: () => void
}

const FAB = 64
const REC_ICON = 20
const AUTO_FLIP_HOLD_MS = 2400
const NOTICE_DELAY_MS = 400
const NOTICE_HOLD_MS = 2200
const REST_DIM_DELAY_MS = 1000
const MENU_CLOSE_DELAY_MS = 300
const LOBBY_CLOSE_DELAY_MS = 200
const SUB = 48
const GOO_GAP = 12
const GOO_PAD = 200
const GOO_DURATION_S = 0.6
const GOO_STAGGER_S = 0.05
const GOO_EASE = [0.7, 0, 0.2, 1] as const
const GOO_SUB_COLOR = 'rgb(58,59,65)'
const FAB_SURFACE = 'bg-[#1a1a1a] shadow-[0_8px_32px_rgba(0,0,0,0.8)]'
const MENU_SURFACE = 'bg-[#3a3b41]/90 shadow-[0_6px_20px_rgba(0,0,0,0.5)] backdrop-blur-md'
const FAB_PRESS = 'transition-transform duration-200 hover:scale-105 active:scale-95'

const OFFSET_KEY = 'dor_offset'

function HomeIcon({ size }: { size: number }) {
  return <img src="/icon-home.png" alt="" aria-hidden="true" draggable={false} style={{ height: size, width: 'auto' }} />
}

function ClipsIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" stroke="currentColor" strokeWidth="2.6" />
      <path d="M10.5 3.5v17M10.5 12h10" stroke="currentColor" strokeWidth="2.6" />
    </svg>
  )
}

function readOffset() {
  try {
    const saved = JSON.parse(localStorage.getItem(OFFSET_KEY) ?? 'null') as { x: number; y: number } | null
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) return saved
  } catch {
    /* ignore */
  }
  return { x: 0, y: Math.max(0, Math.round(window.innerHeight / 3 - 24 - FAB / 2)) }
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
  onOpenClipDetail,
  onStartRec,
  onHome,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null)
  const [initialOffset] = useState(readOffset)
  const x = useMotionValue(initialOffset.x)
  const y = useMotionValue(initialOffset.y)
  const suppressClick = useRef(false)
  const [dragging, setDragging] = useState(false)
  const [hot, setHot] = useState(false)
  const hotTimer = useRef<number | undefined>(undefined)
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

  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => {
    const show = window.setTimeout(() => setNotice('블랙박스 작동 중'), NOTICE_DELAY_MS)
    const hide = window.setTimeout(() => setNotice(null), NOTICE_DELAY_MS + NOTICE_HOLD_MS)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
  }, [])

  const atRest =
    recPhase === 'idle' &&
    notice === null &&
    !hot &&
    !dragging &&
    (gamePhase === 'lobby' || (gamePhase === 'match_end' && !autoFlipped))
  const [dimmed, setDimmed] = useState(false)
  useEffect(() => {
    if (!atRest) {
      setDimmed(false)
      return
    }
    const id = window.setTimeout(() => setDimmed(true), REST_DIM_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [atRest, gamePhase])

  return (
    <>
      <motion.div
        ref={shellRef}
        drag={canDrag}
        dragMomentum={false}
        dragElastic={0.08}
        style={{ x, y, position: 'fixed', zIndex: 40, ...cornerStyle(corner) }}
        role="button"
        aria-label="도르 위젯"
        tabIndex={0}
        className={`touch-none ${showFlip ? 'cursor-pointer' : canDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${hidden ? 'pointer-events-none' : ''}`}
        onDragStart={() => setDragging(true)}
        onDragEnd={(_, info) => {
          setDragging(false)
          if (Math.hypot(info.offset.x, info.offset.y) > 6) suppressClick.current = true
          const rect = shellRef.current?.getBoundingClientRect()
          if (!rect) return
          const next = nearestCorner(rect.left + rect.width / 2, rect.top + rect.height / 2)
          const target = anchorPoint(next, rect.width, rect.height)
          const offset = { x: rect.left - target.left, y: rect.top - target.top }
          x.set(offset.x)
          y.set(offset.y)
          try {
            localStorage.setItem(OFFSET_KEY, JSON.stringify(offset))
          } catch {
            /* ignore */
          }
          onCorner(next)
        }}
        onPointerEnter={() => {
          window.clearTimeout(hotTimer.current)
          setHot(true)
        }}
        onPointerLeave={() => {
          window.clearTimeout(hotTimer.current)
          const delay = showFlip ? MENU_CLOSE_DELAY_MS : gamePhase === 'lobby' && recPhase === 'idle' ? LOBBY_CLOSE_DELAY_MS : 0
          if (delay) hotTimer.current = window.setTimeout(() => setHot(false), delay)
          else setHot(false)
        }}
      >
        <motion.div
          className="relative"
          initial={false}
          animate={{
            x: hidden ? (reverse ? 180 : -180) : 0,
            opacity: hidden ? 0 : dimmed ? 0.5 : 1,
            scale: hidden ? 0.86 : 1,
          }}
          transition={{ ...SPRING, opacity: { duration: dimmed ? 0.6 : 0.2 } }}
        >
          {showFlip && (
            <GooeyClipsMenu
              open={hot && !dragging}
              fab={FAB}
              alignRight={reverse}
              above={corner.startsWith('bottom')}
              count={recCount}
              onOpenClip={onOpenClipDetail}
            />
          )}
          <div className={`relative z-10 ${FAB_PRESS}`}>
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
              <div
                role={recPhase === 'rec_active' ? 'button' : undefined}
                aria-label={recPhase === 'rec_active' ? '녹화 종료' : undefined}
                className={recPhase === 'rec_active' ? 'group/dot cursor-pointer' : undefined}
                onClick={() => {
                  if (suppressClick.current) {
                    suppressClick.current = false
                    return
                  }
                  if (recPhase === 'rec_active') onStartRec()
                }}
              >
                <Island recPhase={recPhase} reverse={reverse} notice={notice} />
              </div>
            )}
          </div>
          {gamePhase === 'lobby' && recPhase === 'idle' && (
            <LobbyMenu
              open={hot && !dragging && notice === null}
              above={corner.startsWith('bottom')}
              labelLeft={reverse}
              onStartRec={onStartRec}
              onHome={onHome}
            />
          )}
        </motion.div>
      </motion.div>
    </>
  )
}

function LobbyMenu({
  open,
  above,
  labelLeft,
  onStartRec,
  onHome,
}: {
  open: boolean
  above: boolean
  labelLeft: boolean
  onStartRec: () => void
  onHome: () => void
}) {
  const items = [
    {
      label: '녹화 시작',
      onClick: onStartRec,
      icon: (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
          <circle cx="10" cy="10" r="8.6" fill="none" stroke="#e8453c" strokeWidth="1.8" />
          <circle cx="10" cy="10" r="4.6" fill="#e8453c" />
        </svg>
      ),
    },
    { label: '홈', onClick: onHome, icon: <HomeIcon size={26} /> },
  ]
  const filterId = `lobby-goo-${useId().replace(/:/g, '')}`
  const dir = above ? -1 : 1
  const offsetOf = (step: number) => dir * (FAB / 2 + GOO_GAP + SUB / 2 + step * (SUB + GOO_GAP))
  const delayOf = (step: number) => (open ? (step === 0 ? GOO_STAGGER_S : 0) : step === 0 ? 0 : GOO_STAGGER_S)
  const slide = (step: number) => ({ duration: GOO_DURATION_S, ease: GOO_EASE, delay: delayOf(step) })
  const reach = FAB / 2 + GOO_GAP + items.length * (SUB + GOO_GAP)

  return (
    <div className="absolute top-0 left-0 h-16 w-16" onPointerDown={(event) => event.stopPropagation()}>
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div
        className="pointer-events-none absolute"
        style={{ left: -GOO_PAD, top: -GOO_PAD, width: FAB + GOO_PAD * 2, height: FAB + GOO_PAD * 2, filter: `url(#${filterId})` }}
      >
        <div className="absolute rounded-full" style={{ left: GOO_PAD, top: GOO_PAD, width: FAB, height: FAB, backgroundColor: `rgb(${PILL_BG})` }} />
        {items.map((item, step) => (
          <motion.div
            key={item.label}
            className="absolute rounded-full"
            style={{
              left: GOO_PAD + (FAB - SUB) / 2,
              top: GOO_PAD + (FAB - SUB) / 2,
              width: SUB,
              height: SUB,
              backgroundColor: GOO_SUB_COLOR,
            }}
            initial={false}
            animate={{ y: open ? offsetOf(step) : 0 }}
            transition={slide(step)}
          />
        ))}
      </div>
      {open && (
        <div
          className="absolute left-0 w-16"
          style={above ? { bottom: FAB / 2, height: reach } : { top: FAB / 2, height: reach }}
        />
      )}
      {items.map((item, step) => (
        <motion.button
          key={item.label}
          type="button"
          onClick={item.onClick}
          initial={false}
          animate={{ y: open ? offsetOf(step) : 0, opacity: open ? 1 : 0 }}
          transition={{ ...slide(step), opacity: { duration: GOO_DURATION_S * 0.5, delay: delayOf(step) } }}
          aria-label={item.label}
          tabIndex={open ? 0 : -1}
          className={`group absolute cursor-pointer ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={{ left: (FAB - SUB) / 2, top: (FAB - SUB) / 2 }}
        >
            <span className={`grid h-12 w-12 place-items-center rounded-full text-white transition-transform duration-200 group-hover:scale-105 ${MENU_SURFACE}`}>
              {item.icon}
            </span>
            <span
              className={`sub-button-label pointer-events-none absolute top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 ${labelLeft ? 'right-[calc(100%+8px)]' : 'left-[calc(100%+8px)]'}`}
            >
              {item.label}
            </span>
        </motion.button>
      ))}
    </div>
  )
}

const ISLAND_SPRING = { type: 'spring' as const, bounce: 0.22, duration: 0.5 }
const SWAP_DELAY_MS = 500
const GHOST_GROW_DELAY_MS = 600
const PILL_BLINK_S = 1.4
const PILL_BLINK_TIMES = [0, 0.143, 0.357, 0.571, 0.786, 1]
const PILL_BG = '26,26,30'
const TEXT_GAP = 8
const TEXT_EDGE = 16

function Island({ recPhase, reverse, notice }: { recPhase: RecPhase; reverse: boolean; notice: string | null }) {
  const noticeOn = notice !== null && recPhase === 'idle'
  const starting = recPhase === 'rec_starting' || recPhase === 'rec_absorbing_start'
  const [swapped, setSwapped] = useState(false)
  const [grown, setGrown] = useState(false)
  useEffect(() => {
    if (recPhase === 'rec_starting') {
      const id = window.setTimeout(() => setSwapped(true), SWAP_DELAY_MS)
      return () => window.clearTimeout(id)
    }
    if (recPhase !== 'rec_absorbing_start') setSwapped(false)
  }, [recPhase])
  const [unflipped, setUnflipped] = useState(false)
  useEffect(() => {
    if (recPhase === 'rec_absorbing_end') {
      const flipId = window.setTimeout(() => setUnflipped(true), 60)
      const growId = window.setTimeout(() => setGrown(true), GHOST_GROW_DELAY_MS)
      return () => {
        window.clearTimeout(flipId)
        window.clearTimeout(growId)
      }
    }
    if (recPhase !== 'rec_stopping') {
      setGrown(false)
      setUnflipped(false)
    }
  }, [recPhase])
  const stopEntry = recPhase === 'rec_absorbing_end'
  const recFace = swapped || (stopEntry && !unflipped)
  const contentHidden = recPhase === 'rec_active' || recPhase === 'rec_absorbing_start'
  const tinyGhost = recPhase === 'rec_absorbing_end' && !grown
  const isDot = contentHidden || tinyGhost
  const showText =
    noticeOn || recPhase === 'rec_starting' || recPhase === 'rec_absorbing_start' || recPhase === 'rec_stopping'
  const activeLabel = noticeOn ? notice : starting ? '녹화 시작' : recPhase === 'idle' ? null : '녹화 종료'
  const [label, setLabel] = useState(activeLabel ?? '녹화 시작')
  if (activeLabel && activeLabel !== label) setLabel(activeLabel)
  const labelRef = useRef<HTMLSpanElement>(null)
  const [labelW, setLabelW] = useState(56)
  useLayoutEffect(() => {
    const measure = () => labelRef.current && setLabelW(Math.ceil(labelRef.current.scrollWidth))
    measure()
    void document.fonts?.ready.then(measure)
  }, [label])
  const textW = TEXT_GAP + labelW + TEXT_EDGE
  const pillW = FAB + (showText ? textW : 0)
  const box = isDot ? REC_ICON : pillW

  return (
    <motion.div
      initial={false}
      animate={{
        width: box,
        height: isDot ? REC_ICON : FAB,
        backgroundColor: `rgba(${PILL_BG},${contentHidden ? 0 : 1})`,
        boxShadow: contentHidden ? '0 0 0 rgba(0,0,0,0)' : '0 8px 32px rgba(0,0,0,0.8)',
      }}
      transition={ISLAND_SPRING}
      className="relative overflow-hidden rounded-full"
    >
      <motion.div
        initial={false}
        animate={{
          width: pillW,
          scale: isDot ? REC_ICON / pillW : 1,
          opacity: contentHidden ? 0 : 1,
          filter: contentHidden ? 'blur(4px)' : 'blur(0px)',
        }}
        transition={
          stopEntry
            ? { ...ISLAND_SPRING, opacity: { duration: 0 }, filter: { duration: 0 } }
            : { ...ISLAND_SPRING, opacity: { duration: 0.25, delay: contentHidden ? 0.12 : 0 } }
        }
        className={`absolute top-1/2 left-1/2 flex h-16 items-center ${reverse ? 'flex-row-reverse' : 'flex-row'}`}
        style={{ x: '-50%', y: '-50%' }}
      >
        <div className="relative h-16 w-16 shrink-0" style={{ perspective: 400 }}>
          <motion.div
            className="relative h-full w-full"
            initial={false}
            animate={{ rotateY: recFace ? 180 : 0 }}
            transition={
              swapped || (stopEntry && unflipped) ? { type: 'spring', bounce: 0.25, duration: 0.6 } : { duration: 0 }
            }
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-full" style={{ backfaceVisibility: 'hidden' }}>
              <NeonGhost />
            </div>
            <div
              className="absolute inset-0 grid place-items-center"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <motion.svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className={stopEntry ? 'h-16 w-16' : 'h-7 w-7'}
                initial={false}
                animate={{ opacity: swapped ? [1, 1, 0.25, 1, 0.25, 1] : stopEntry ? 0.5 : 1 }}
                transition={swapped ? { duration: PILL_BLINK_S, times: PILL_BLINK_TIMES, ease: 'easeInOut' } : { duration: 0 }}
              >
                <circle cx="10" cy="10" r="9" fill="none" stroke="#e8453c" strokeWidth="1.8" />
                <circle cx="10" cy="10" r="5" fill="#e8453c" />
              </motion.svg>
            </div>
          </motion.div>
        </div>
        <motion.div
          initial={false}
          animate={{ width: showText ? textW : 0, opacity: showText ? 1 : 0 }}
          transition={ISLAND_SPRING}
          className={`flex shrink-0 overflow-hidden ${reverse ? 'justify-end' : 'justify-start'}`}
          style={reverse ? { paddingLeft: TEXT_EDGE, paddingRight: TEXT_GAP } : { paddingLeft: TEXT_GAP, paddingRight: TEXT_EDGE }}
        >
          <span ref={labelRef} className="record-status-text">
            {label}
          </span>
        </motion.div>
      </motion.div>
      <motion.svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 m-auto h-5 w-5 ${recPhase === 'rec_active' ? 'group-hover/dot:opacity-100!' : ''}`}
        initial={false}
        animate={
          recPhase === 'rec_active'
            ? { opacity: 0.5, scale: 1 }
            : { opacity: contentHidden ? 1 : 0, scale: contentHidden || tinyGhost ? 1 : 2.4 }
        }
        transition={
          recPhase === 'rec_active'
            ? { duration: 0.8, ease: 'easeOut' }
            : { ...ISLAND_SPRING, opacity: { duration: stopEntry ? 0 : 0.2, delay: contentHidden ? 0.18 : 0 } }
        }
      >
        <g className={recPhase === 'rec_active' ? 'transition-opacity duration-150 group-hover/dot:opacity-0' : ''}>
          <circle cx="10" cy="10" r="9" fill="none" stroke="#e8453c" strokeWidth="1.8" />
          <circle cx="10" cy="10" r="5" fill="#e8453c" />
        </g>
        {recPhase === 'rec_active' && (
          <rect
            x="3"
            y="3"
            width="14"
            height="14"
            rx="2.5"
            fill="#e8453c"
            className="opacity-0 transition-opacity duration-150 group-hover/dot:opacity-100"
          />
        )}
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
          className={`absolute inset-0 grid cursor-pointer place-items-center rounded-full text-white ${MENU_SURFACE}`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <ClipsIcon size={22} />
        </button>
      </motion.div>
      <span
        className={`sub-button-label pointer-events-none absolute top-1/2 -translate-y-1/2 transition-opacity duration-150 ${flipped ? 'opacity-100' : 'opacity-0'} ${reverse ? 'right-[calc(100%+8px)]' : 'left-[calc(100%+8px)]'}`}
      >
        클립 보기
      </span>
      {count > 0 && (
        <span
          className={`absolute -top-2 z-10 flex items-center gap-0.5 rounded-full bg-linear-to-r from-[#8b82d6] to-[#e46f86] px-1.5 py-0.5 text-[11px] leading-[14px] font-bold text-white ${reverse ? '-left-2.5' : '-right-2.5'}`}
        >
          <Sparkles size={11} />
          {count}
        </span>
      )}
    </div>
  )
}
