import { motion } from 'framer-motion'
import { useId, useLayoutEffect, useRef, useState } from 'react'

const POPUP_W = 320
const POPUP_R = 24
const GRAVITY_Y = 80
const DURATION = 0.7
const EASE = [0.7, 0, 0.2, 1] as const
const BLOB = '#3a3b41'
const PAD = 20
const HEADER_GAP = 14
const MIN_H = 120
const MAX_H_RATIO = 0.6

const THUMB_SRC = '/gameplay.mp4'
const THUMB_TIMES = [6, 18, 29, 41, 52]
const KILL_TAGS = ['더블킬', '트리플킬', '헤드샷', '클러치', '연속 처치']
const KDAS = ['6 / 5 / 4', '9 / 2 / 7', '3 / 4 / 11', '12 / 6 / 3', '5 / 1 / 8']

type Props = {
  open: boolean
  fab: number
  alignRight: boolean
  above: boolean
  count: number
  onOpenClip: (clip: MenuClip) => void
}

export type MenuClip = {
  id: number
  kda: string
  time: string
  tag: string
  thumbAt: number
}

export function GooeyClipsMenu({ open, fab, alignRight, above, count, onOpenClip }: Props) {
  const filterId = `gooey-${useId().replace(/:/g, '')}`
  const headerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [h, setH] = useState(MIN_H)

  const clips: MenuClip[] = Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    kda: KDAS[i % KDAS.length],
    time: i === count - 1 ? '방금 전' : `${(count - 1 - i) * 3 + 2}분 전`,
    tag: KILL_TAGS[i % KILL_TAGS.length],
    thumbAt: THUMB_TIMES[i % THUMB_TIMES.length],
  }))

  useLayoutEffect(() => {
    const measure = () => {
      const header = headerRef.current?.offsetHeight ?? 0
      const list = listRef.current?.offsetHeight ?? 0
      const natural = PAD * 2 + header + HEADER_GAP + list
      setH(Math.min(Math.max(natural, MIN_H), Math.round(window.innerHeight * MAX_H_RATIO)))
    }
    measure()
    void document.fonts?.ready.then(measure)
  }, [count])

  const shape = open
    ? {
        x: alignRight ? fab - POPUP_W : 0,
        y: above ? fab / 2 - GRAVITY_Y - h : fab / 2 + GRAVITY_Y,
        width: POPUP_W,
        height: h,
        r: POPUP_R,
      }
    : { x: 0, y: 0, width: fab, height: fab, r: fab / 2 }
  const morph = { duration: DURATION, ease: EASE }

  return (
    <>
      <svg className="pointer-events-none absolute top-0 left-0 z-0 overflow-visible" width={1} height={1} aria-hidden="true">
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`}>
          <circle cx={fab / 2} cy={fab / 2} r={fab / 2} fill={BLOB} />
          <motion.rect
            initial={false}
            animate={{ x: shape.x, y: shape.y, width: shape.width, height: shape.height, rx: shape.r, ry: shape.r }}
            transition={morph}
            fill={BLOB}
          />
        </g>
      </svg>

      {open && (
        <div
          className="absolute left-0 w-full"
          style={above ? { bottom: fab, height: GRAVITY_Y - fab / 2 } : { top: fab, height: GRAVITY_Y - fab / 2 }}
        />
      )}

      <motion.div
        initial={false}
        animate={{ left: shape.x, top: shape.y, width: shape.width, height: shape.height, borderRadius: shape.r }}
        transition={morph}
        className={`absolute z-20 overflow-hidden ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <motion.div
          initial={false}
          animate={{ opacity: open ? 1 : 0 }}
          transition={
            open
              ? { duration: DURATION * 0.4, ease: 'easeIn', delay: DURATION * 0.3 }
              : { duration: DURATION * 0.3, ease: 'easeOut' }
          }
          className="clips-menu box-border flex flex-col text-white"
          style={{ width: POPUP_W, height: h, padding: PAD }}
        >
          <div ref={headerRef} className="flex shrink-0 items-center justify-between" style={{ marginBottom: HEADER_GAP }}>
            <h2 className="clips-menu-title">내 클립</h2>
            <span className="clips-menu-meta">{count}개</span>
          </div>
          <div className="clip-scroll min-h-0 flex-1 overflow-y-auto pr-1">
            <div ref={listRef} className="space-y-3">
            {clips.length === 0 ? (
              <div className="clips-menu-meta py-2 text-center">아직 녹화된 클립이 없어요.</div>
            ) : (
              clips.map((clip) => (
                <button
                  key={clip.id}
                  type="button"
                  onClick={() => onOpenClip(clip)}
                  className="group relative block h-[88px] w-full cursor-pointer overflow-hidden rounded-xl bg-[#1a1a1e] text-left"
                >
                  <video
                    src={`${THUMB_SRC}#t=${clip.thumbAt}`}
                    muted
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                    className="absolute inset-y-0 right-0 h-full w-[72%] object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-linear-to-r from-[#1a1a1e] from-35% via-[#1a1a1e]/70 via-55% to-transparent" />
                  <span className="relative flex h-full flex-col justify-between p-3">
                    <span>
                      <span className="clips-menu-title block">{clip.kda}</span>
                      <span className="clips-menu-meta mt-1.5 block">{clip.time}</span>
                    </span>
                    <span className="flex gap-1.5">
                      <span className="clips-menu-tag">하이라이트</span>
                      <span className="clips-menu-tag">{clip.tag}</span>
                    </span>
                  </span>
                </button>
              ))
            )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}
