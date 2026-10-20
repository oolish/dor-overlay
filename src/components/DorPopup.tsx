import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  Minus,
  Plus,
  RotateCw,
  Search,
  Send,
  Settings,
  Square,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import type { ClipItem } from '../clips/library.ts'
import { libraryCount } from '../clips/library.ts'
import type { RecPhase } from '../overlay/types.ts'
import { ClipArt } from './ClipArt.tsx'
import { DorGhost } from './DorGhost.tsx'

type Tab = 'all' | 'fav' | 'video'

type Props = {
  open: boolean
  clips: ClipItem[]
  matchSerial: number
  recPhase: RecPhase
  onClose: () => void
  onShare: () => void
  onCopy: (id: string) => void
}

export function DorPopup({
  open,
  clips,
  matchSerial,
  recPhase,
  onClose,
  onShare,
  onCopy,
}: Props) {
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [seenOpen, setSeenOpen] = useState(open)

  if (open !== seenOpen) {
    setSeenOpen(open)
    setActiveId(null)
    setSelecting(false)
    setSelected([])
  }

  const shown = useMemo(() => {
    const needle = query.trim()
    return clips.filter((clip) => {
      const fav = favorites[clip.id] ?? clip.favorite
      if (tab === 'fav' && !fav) return false
      if (!needle) return true
      return `${clip.game} ${clip.timeLabel} ${clip.meta} 비디오`.includes(needle)
    })
  }, [clips, favorites, query, tab])

  if (!open) return null

  const active = clips.find((clip) => clip.id === activeId) ?? null
  const recording =
    recPhase === 'rec_active' || recPhase === 'rec_starting' || recPhase === 'rec_absorbing_start'

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/50 px-4 pt-16 pb-4" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-label="dor.gg 내 클립"
        onMouseDown={(event) => event.stopPropagation()}
        className={`flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#101114] text-white shadow-2xl ${expanded ? 'h-[calc(100vh-5.5rem)] w-[calc(100vw-2rem)]' : 'h-[min(760px,calc(100vh-6rem))] w-[min(1080px,calc(100vw-2rem))]'}`}
      >
        <header className="relative flex h-12 shrink-0 items-center gap-3 px-3">
          <div className="flex items-center gap-2">
            <DorGhost className="h-6 w-6" />
            <span className="text-sm font-extrabold tracking-[0.18em]">DOR</span>
          </div>
          <div className="flex items-center gap-1 text-white/70">
            <IconButton label="뒤로" onClick={() => setActiveId(null)} disabled={!active}>
              <ChevronLeft size={16} />
            </IconButton>
            <IconButton label="앞으로" disabled>
              <ChevronRight size={16} />
            </IconButton>
            <IconButton
              label="새로고침"
              onClick={() => {
                setQuery('')
                setTab('all')
                setActiveId(null)
              }}
            >
              <RotateCw size={15} />
            </IconButton>
          </div>
          <div className="pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs text-white/85">
            {recording ? '녹화 중' : '녹화 대기 중'}
            <span className={`h-2 w-2 rounded-full ${recording ? 'bg-red-500' : 'bg-emerald-400'}`} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] font-bold">
              99+
            </span>
            <IconButton label="최소화">
              <Minus size={15} />
            </IconButton>
            <IconButton label={expanded ? '복원' : '최대화'} onClick={() => setExpanded((value) => !value)}>
              <Square size={13} />
            </IconButton>
            <IconButton label="닫기" onClick={onClose}>
              <X size={16} />
            </IconButton>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          <nav className="flex w-[72px] shrink-0 flex-col items-center gap-1 py-3">
            <SideButton label="홈" active>
              <Home size={20} />
            </SideButton>
            <SideButton label="친구">
              <Users size={20} />
            </SideButton>
            <SideButton label="검색">
              <Search size={20} />
            </SideButton>
            <button type="button" className="relative my-1 grid h-10 w-10 place-items-center" aria-label="새 소식">
              <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#ff7a59] to-[#7c5cff]" />
              <span className="absolute top-0 right-1 grid h-4 w-4 place-items-center rounded-full bg-[#3b82f6] text-[9px] font-bold">
                N
              </span>
            </button>
            <SideButton label="추가">
              <Plus size={20} />
            </SideButton>
            <SideButton label="알림" dot>
              <Bell size={20} />
            </SideButton>
            <SideButton label="보내기">
              <Send size={20} />
            </SideButton>
            <span className="mt-1 grid h-8 w-8 place-items-center rounded-full bg-white/10">
              <DorGhost className="h-5 w-5" />
            </span>
            <span className="mt-2 grid h-8 w-8 place-items-center rounded-full bg-fuchsia-500/20 text-fuchsia-300">
              <SparkMark />
            </span>
            <div className="mt-auto">
              <SideButton label="설정">
                <Settings size={20} />
              </SideButton>
            </div>
          </nav>
          <div className="mb-3 mr-3 flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#17181f]">
            {active ? (
              <Player
                clip={active}
                onBack={() => setActiveId(null)}
                onShare={onShare}
                onCopy={() => onCopy(active.id)}
              />
            ) : (
              <Library
                clips={shown}
                count={libraryCount(matchSerial)}
                tab={tab}
                query={query}
                selecting={selecting}
                selected={selected}
                favorites={favorites}
                onTab={setTab}
                onQuery={setQuery}
                onToggleSelect={() => {
                  setSelecting((value) => !value)
                  setSelected([])
                }}
                onOpen={(clip) => {
                  if (selecting) {
                    setSelected((current) =>
                      current.includes(clip.id) ? current.filter((id) => id !== clip.id) : [...current, clip.id],
                    )
                    return
                  }
                  setActiveId(clip.id)
                }}
                onHeart={(clip) =>
                  setFavorites((current) => ({
                    ...current,
                    [clip.id]: !(current[clip.id] ?? clip.favorite),
                  }))
                }
              />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function Library({
  clips,
  count,
  tab,
  query,
  selecting,
  selected,
  favorites,
  onTab,
  onQuery,
  onToggleSelect,
  onOpen,
  onHeart,
}: {
  clips: ClipItem[]
  count: number
  tab: Tab
  query: string
  selecting: boolean
  selected: string[]
  favorites: Record<string, boolean>
  onTab: (tab: Tab) => void
  onQuery: (value: string) => void
  onToggleSelect: () => void
  onOpen: (clip: ClipItem) => void
  onHeart: (clip: ClipItem) => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 px-5 pt-4">
        <ChevronLeft size={18} className="text-white/70" />
        <h2 className="text-[17px] font-semibold">전체</h2>
        <p className="text-sm text-white/45">13 폴더 · {count} 클립</p>
        <button
          type="button"
          onClick={onToggleSelect}
          className={`ml-auto rounded-full border px-4 py-1.5 text-sm ${selecting ? 'border-white bg-white text-black' : 'border-white/20 text-white/90'}`}
        >
          {selecting ? `${selected.length}개 선택` : '선택하기'}
        </button>
      </div>
      <label className="mx-5 mt-4 flex items-center gap-2 rounded-full bg-[#2a2b33] px-4 py-2.5 text-sm text-white/50">
        <Search size={16} />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="클립, 게임, 이벤트를 찾아보세요"
          className="w-full bg-transparent text-white outline-none placeholder:text-white/40"
        />
      </label>
      <div className="mt-4 flex gap-2 px-5">
        <Chip active={tab === 'all'} onClick={() => onTab('all')}>
          전체
        </Chip>
        <Chip active={tab === 'fav'} onClick={() => onTab('fav')}>
          즐겨찾기
        </Chip>
        <Chip active={tab === 'video'} onClick={() => onTab('video')}>
          비디오
        </Chip>
      </div>
      <div className="clip-scroll mt-4 min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        {clips.length === 0 ? (
          <p className="py-16 text-center text-sm text-white/45">찾는 클립이 없습니다</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            {clips.map((clip, index) => {
              const fav = favorites[clip.id] ?? clip.favorite
              const marked = index === 0 || clip.fresh
              return (
                <article key={clip.id} className="relative">
                  {marked && (
                    <span className="absolute -top-1 -left-1 z-10 grid h-6 w-6 place-items-center rounded-full bg-[#3b82f6] text-xs font-bold">
                      N
                    </span>
                  )}
                  <button type="button" onClick={() => onOpen(clip)} className="block w-full text-left">
                    <div className={`relative aspect-video overflow-hidden rounded-xl ${selected.includes(clip.id) ? 'ring-2 ring-white' : ''}`}>
                      <ClipArt scene={clip.scene} />
                      <div className="absolute top-3 left-3 drop-shadow">
                        <p className="text-[15px] leading-none font-bold">비디오</p>
                        <p className="mt-1 text-[13px]">{clip.timeLabel}</p>
                      </div>
                      <span className="absolute bottom-3 left-3 rounded-full bg-black/80 px-3 py-1 text-xs font-semibold">
                        스크린 녹화
                      </span>
                      <span className="absolute right-3 bottom-3 text-xs font-semibold tracking-wide text-white/90">
                        {clip.game}
                      </span>
                    </div>
                  </button>
                  <div className="flex items-center px-1 pt-2 text-white/70">
                    <button type="button" aria-label="즐겨찾기" onClick={() => onHeart(clip)} className="grid h-7 w-7 place-items-center">
                      <Heart size={16} className={fav ? 'fill-white text-white' : ''} />
                    </button>
                    <span className="ml-auto text-xs text-white/55">{clip.meta}</span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Player({
  clip,
  onBack,
  onShare,
  onCopy,
}: {
  clip: ClipItem
  onBack: () => void
  onShare: () => void
  onCopy: () => void
}) {
  const src = clip.fresh ? '/match-end.mp4' : '/gameplay.mp4'
  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
      <button type="button" onClick={onBack} className="flex w-fit items-center gap-1 text-sm text-white/70">
        <ChevronLeft size={16} />
        전체
      </button>
      <div className="mt-3 overflow-hidden rounded-xl bg-black">
        <video key={clip.id} src={src} controls autoPlay playsInline className="aspect-video w-full bg-black" />
      </div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">{clip.game}</p>
          <p className="text-sm text-white/50">{clip.timeLabel} · {clip.meta}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onShare} className="rounded-full bg-[#5865f2] px-4 py-2 text-sm font-semibold">
            디스코드/길드에 1-Click 공유
          </button>
          <button type="button" onClick={onCopy} className="rounded-full border border-white/20 px-4 py-2 text-sm">
            링크 복사
          </button>
        </div>
      </div>
    </div>
  )
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium ${active ? 'bg-white text-black' : 'bg-[#2a2b33] text-white/85'}`}
    >
      {children}
    </button>
  )
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-md text-white/75 hover:bg-white/10 disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function SideButton({
  children,
  label,
  active,
  dot,
}: {
  children: ReactNode
  label: string
  active?: boolean
  dot?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`relative grid h-10 w-10 place-items-center rounded-xl ${active ? 'text-white' : 'text-white/55 hover:text-white'}`}
    >
      {children}
      {dot && <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-rose-500" />}
    </button>
  )
}

function SparkMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
      <path d="M8 1.2 9.4 6.6 14.8 8 9.4 9.4 8 14.8 6.6 9.4 1.2 8 6.6 6.6 Z" fill="currentColor" />
    </svg>
  )
}
