import { useCallback, useEffect, useRef, useState } from 'react'

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

const STORAGE_KEY = 'dor_corner'

export function isMorphing(phase: RecPhase) {
  return phase !== 'idle' && phase !== 'rec_active'
}

function readCorner(): Corner {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && CORNERS.includes(saved as Corner)) return saved as Corner
  } catch {
    /* private mode */
  }
  return 'top-right'
}

export function nearestCorner(px: number, py: number): Corner {
  const spots: { id: Corner; x: number; y: number }[] = [
    { id: 'top-left', x: 0, y: 0 },
    { id: 'top-right', x: window.innerWidth, y: 0 },
    { id: 'bottom-left', x: 0, y: window.innerHeight },
    { id: 'bottom-right', x: window.innerWidth, y: window.innerHeight },
  ]
  let best: Corner = 'top-right'
  let bestDist = Number.POSITIVE_INFINITY
  for (const spot of spots) {
    const dist = (px - spot.x) ** 2 + (py - spot.y) ** 2
    if (dist < bestDist) {
      bestDist = dist
      best = spot.id
    }
  }
  return best
}

export function anchorPoint(corner: Corner, width: number, height: number) {
  const inset = 24
  const vw = window.innerWidth
  const vh = window.innerHeight
  switch (corner) {
    case 'top-left':
      return { x: inset, y: inset }
    case 'top-right':
      return { x: vw - inset - width, y: inset }
    case 'bottom-left':
      return { x: inset, y: vh - inset - height }
    case 'bottom-right':
      return { x: vw - inset - width, y: vh - inset - height }
  }
}

export function anchorStyle(corner: Corner): { top?: number; right?: number; bottom?: number; left?: number } {
  const inset = 24
  switch (corner) {
    case 'top-left':
      return { top: inset, left: inset }
    case 'top-right':
      return { top: inset, right: inset }
    case 'bottom-left':
      return { bottom: inset, left: inset }
    case 'bottom-right':
      return { bottom: inset, right: inset }
  }
}

export function useOverlayMachine() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby')
  const [recPhase, setRecPhase] = useState<RecPhase>('idle')
  const [corner, setCorner] = useState<Corner>(readCorner)
  const [badge, setBadge] = useState(false)
  const [clipsOpen, setClipsOpen] = useState(false)
  const [autoFlipToken, setAutoFlipToken] = useState(0)
  const [matchSerial, setMatchSerial] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const timers = useRef<number[]>([])
  const toastTimer = useRef<number | null>(null)
  const flipTimer = useRef<number | null>(null)
  const pendingLand = useRef<GamePhase | null>(null)
  const recRef = useRef(recPhase)
  const gameRef = useRef(gamePhase)

  useEffect(() => {
    recRef.current = recPhase
    gameRef.current = gamePhase
  }, [gamePhase, recPhase])

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }, [])

  const queueFlip = useCallback(() => {
    if (flipTimer.current) window.clearTimeout(flipTimer.current)
    flipTimer.current = window.setTimeout(() => {
      setAutoFlipToken((n) => n + 1)
    }, 460)
  }, [])

  const finishStop = useCallback(() => {
    const land = pendingLand.current
    pendingLand.current = null
    setRecPhase('idle')
    if (land === 'match_end') {
      setGamePhase('match_end')
      setBadge(true)
      setMatchSerial((n) => n + 1)
      queueFlip()
    } else if (land) {
      setGamePhase(land)
    }
  }, [queueFlip])

  const startRec = useCallback(() => {
    if (isMorphing(recRef.current) || recRef.current === 'rec_active') return
    if (gameRef.current === 'match_end') return
    clearTimers()
    setRecPhase('rec_starting')
    timers.current.push(window.setTimeout(() => setRecPhase('rec_absorbing_start'), 1000))
    timers.current.push(window.setTimeout(() => setRecPhase('rec_active'), 1350))
  }, [clearTimers])

  const stopRec = useCallback(
    (landOn?: GamePhase) => {
      if (recRef.current !== 'rec_active') return
      clearTimers()
      pendingLand.current = landOn ?? null
      setRecPhase('rec_stopping')
      timers.current.push(window.setTimeout(() => setRecPhase('rec_absorbing_end'), 1000))
      timers.current.push(window.setTimeout(finishStop, 1350))
    },
    [clearTimers, finishStop],
  )

  const toggleRec = useCallback(() => {
    if (isMorphing(recRef.current)) return
    if (recRef.current === 'rec_active') stopRec()
    else startRec()
  }, [startRec, stopRec])

  const enterIngame = useCallback(() => {
    if (isMorphing(recRef.current)) return
    if (flipTimer.current) window.clearTimeout(flipTimer.current)
    setClipsOpen(false)
    setBadge(false)
    setGamePhase('ingame')
  }, [])

  const endMatch = useCallback(() => {
    if (isMorphing(recRef.current)) return
    if (recRef.current === 'rec_active') {
      stopRec('match_end')
      return
    }
    setGamePhase('match_end')
    setBadge(true)
    setMatchSerial((n) => n + 1)
    queueFlip()
  }, [queueFlip, stopRec])

  const goLobby = useCallback(() => {
    if (isMorphing(recRef.current)) return
    if (flipTimer.current) window.clearTimeout(flipTimer.current)
    setClipsOpen(false)
    setBadge(false)
    setGamePhase('lobby')
  }, [])

  const chooseCorner = useCallback((next: Corner) => {
    setCorner(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const openClips = useCallback(() => {
    setBadge(false)
    setClipsOpen(true)
  }, [])

  const closeClips = useCallback(() => setClipsOpen(false), [])

  const pushToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'F9') {
        event.preventDefault()
        toggleRec()
      }
      if (event.key === 'Escape') closeClips()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeClips, toggleRec])

  useEffect(
    () => () => {
      clearTimers()
      if (flipTimer.current) window.clearTimeout(flipTimer.current)
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    },
    [clearTimers],
  )

  return {
    gamePhase,
    recPhase,
    corner,
    badge,
    clipsOpen,
    autoFlipToken,
    matchSerial,
    locked: isMorphing(recPhase),
    toggleRec,
    enterIngame,
    endMatch,
    goLobby,
    chooseCorner,
    openClips,
    closeClips,
    toast,
    pushToast,
  }
}
