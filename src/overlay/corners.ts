import type { CSSProperties } from 'react'
import type { Corner } from './types.ts'

const MARGIN = 24

export function nearestCorner(px: number, py: number): Corner {
  const spots: Record<Corner, { x: number; y: number }> = {
    'top-left': { x: MARGIN, y: MARGIN },
    'top-right': { x: window.innerWidth - MARGIN, y: MARGIN },
    'bottom-left': { x: MARGIN, y: window.innerHeight - MARGIN },
    'bottom-right': { x: window.innerWidth - MARGIN, y: window.innerHeight - MARGIN },
  }
  let best: Corner = 'top-right'
  let score = Number.POSITIVE_INFINITY
  for (const corner of Object.keys(spots) as Corner[]) {
    const spot = spots[corner]
    const distance = (spot.x - px) ** 2 + (spot.y - py) ** 2
    if (distance < score) {
      score = distance
      best = corner
    }
  }
  return best
}

export function anchorPoint(corner: Corner, width: number, height: number) {
  const maxX = window.innerWidth - width - MARGIN
  const maxY = window.innerHeight - height - MARGIN
  switch (corner) {
    case 'top-left':
      return { left: MARGIN, top: MARGIN }
    case 'top-right':
      return { left: maxX, top: MARGIN }
    case 'bottom-left':
      return { left: MARGIN, top: maxY }
    case 'bottom-right':
      return { left: maxX, top: maxY }
  }
}

export function cornerStyle(corner: Corner): CSSProperties {
  const edge = `${MARGIN}px`
  return {
    top: corner.startsWith('top') ? edge : 'auto',
    bottom: corner.startsWith('bottom') ? edge : 'auto',
    left: corner.endsWith('left') ? edge : 'auto',
    right: corner.endsWith('right') ? edge : 'auto',
  }
}
