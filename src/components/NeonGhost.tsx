import { useEffect, useId, useRef } from 'react'

const SCALE_X = 0.9
const SCALE_Y = 0.9
const OFFSET_X = 14
const OFFSET_Y = 11

const MIN_SPEED = 5
const MAX_SPEED = 15
const DOTS = 50
const SIZE = 3.6
const GLOW = 3

const LEFT = { r: 112, g: 112, b: 184 }
const RIGHT = { r: 186, g: 75, b: 89 }

const GHOST_PATH =
  'M 130 63 A 58 58 0 0 1 189 122 L 189 181 C 177 190, 166 181, 154 181 C 142 181, 132 190, 120 190 C 108 190, 98 181, 86 181 C 80 181, 76 184, 71 187 L 71 122 A 58 58 0 0 1 130 63 Z'

const SVG_NS = 'http://www.w3.org/2000/svg'

function colorAt(x: number) {
  const t = Math.max(0, Math.min(1, (x - 71) / (189 - 71)))
  const r = Math.round(LEFT.r + (RIGHT.r - LEFT.r) * t)
  const g = Math.round(LEFT.g + (RIGHT.g - LEFT.g) * t)
  const b = Math.round(LEFT.b + (RIGHT.b - LEFT.b) * t)
  return `rgb(${r}, ${g}, ${b})`
}

function placeLine(line: SVGLineElement, a: { x: number; y: number }, b: { x: number; y: number }) {
  line.setAttribute('x1', String(a.x))
  line.setAttribute('y1', String(a.y))
  line.setAttribute('x2', String(b.x))
  line.setAttribute('y2', String(b.y))
}

export function NeonGhost() {
  const filterId = `glow-${useId().replace(/:/g, '')}`
  const pathRef = useRef<SVGPathElement>(null)
  const glowRef = useRef<SVGGElement>(null)
  const coreRef = useRef<SVGGElement>(null)

  useEffect(() => {
    const path = pathRef.current
    const glowStream = glowRef.current
    const coreStream = coreRef.current
    if (!path || !glowStream || !coreStream) return

    const length = path.getTotalLength()
    const glowLines: SVGLineElement[] = []
    const coreLines: SVGLineElement[] = []
    glowStream.replaceChildren()
    coreStream.replaceChildren()

    for (let i = 0; i < DOTS; i++) {
      const progress = i / DOTS
      const opacity = Math.pow(1 - progress, 1.4)

      const glow = document.createElementNS(SVG_NS, 'line')
      glow.setAttribute('stroke-width', String(Math.max(2, 10 * (1 - progress * 0.5)) * SIZE))
      glow.setAttribute('stroke-linecap', 'round')
      glow.setAttribute('opacity', String(opacity * GLOW))
      glowStream.appendChild(glow)
      glowLines.push(glow)

      const core = document.createElementNS(SVG_NS, 'line')
      core.setAttribute('stroke-width', String(Math.max(0.5, 3 * (1 - progress * 0.7)) * SIZE))
      core.setAttribute('stroke-linecap', 'round')
      core.setAttribute('opacity', String(opacity * 0.9))
      core.setAttribute('stroke', '#ffffff')
      coreStream.appendChild(core)
      coreLines.push(core)
    }

    let dist = 0
    const start = path.getPointAtLength(0)
    const history = Array.from({ length: DOTS + 1 }, () => ({ x: start.x, y: start.y }))
    let frame = 0

    const tick = () => {
      const current = path.getPointAtLength(dist)
      const gravity = Math.max(0, Math.min(1, (current.y - 63) / (190 - 63)))
      dist = (dist + MIN_SPEED + gravity * (MAX_SPEED - MIN_SPEED)) % length
      const next = path.getPointAtLength(dist)
      history.unshift({ x: next.x, y: next.y })
      history.length = DOTS + 1

      for (let i = 0; i < DOTS; i++) {
        const a = history[i]
        const b = history[i + 1]
        placeLine(glowLines[i], a, b)
        glowLines[i].setAttribute('stroke', i === 0 ? '#ffffff' : colorAt(a.x))
        placeLine(coreLines[i], a, b)
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <>
      <img
        src="/dor-ghost.webp"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute inset-0 z-[1] block h-full w-full select-none object-cover"
      />
      <svg
        viewBox="0 0 260 260"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-visible mix-blend-screen"
      >
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur3" />
            <feMerge>
              <feMergeNode in="blur3" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform={`translate(${OFFSET_X}, ${OFFSET_Y}) scale(${SCALE_X}, ${SCALE_Y})`}>
          <path ref={pathRef} d={GHOST_PATH} fill="none" stroke="none" />
          <g ref={glowRef} filter={`url(#${filterId})`} />
          <g ref={coreRef} />
        </g>
      </svg>
    </>
  )
}
