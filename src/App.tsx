import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { buildLibrary, type ClipItem } from './clips/library.ts'
import { DemoBar } from './components/DemoBar.tsx'
import { DorPopup } from './components/DorPopup.tsx'
import { GameVideo } from './components/GameVideo.tsx'
import { OverlayWidget } from './components/OverlayWidget.tsx'
import { useOverlayMachine } from './overlay/machine.ts'

export default function App() {
  const overlay = useOverlayMachine()
  const clips = useMemo(() => buildLibrary(overlay.matchSerial), [overlay.matchSerial])
  const [focusClip, setFocusClip] = useState<ClipItem | null>(null)

  return (
    <main className="relative h-full overflow-hidden">
      <GameVideo phase={overlay.gamePhase} />
      <OverlayWidget
        gamePhase={overlay.gamePhase}
        recPhase={overlay.recPhase}
        corner={overlay.corner}
        badge={overlay.badge}
        recCount={overlay.recCount}
        autoFlipToken={overlay.autoFlipToken}
        onCorner={overlay.chooseCorner}
        onOpenClips={() => {
          setFocusClip(null)
          overlay.openClips()
        }}
        onOpenClipDetail={(clip) => {
          setFocusClip({
            id: `match-${overlay.matchSerial}-${clip.id}`,
            timeLabel: clip.time,
            game: '나이트 런',
            meta: `전체 영상 1 · 클립 ${clip.id}`,
            favorite: false,
            scene: 'duel',
            fresh: true,
            src: '/gameplay.mp4',
            startAt: clip.thumbAt,
          })
          overlay.openClips()
        }}
        onStartRec={overlay.toggleRec}
        onHome={() => {
          setFocusClip(null)
          overlay.openClips()
        }}
      />
      <DemoBar
        gamePhase={overlay.gamePhase}
        recPhase={overlay.recPhase}
        locked={overlay.locked}
        onToggle={overlay.toggleRec}
        onLobby={overlay.goLobby}
        onIngame={overlay.enterIngame}
        onMatchEnd={overlay.endMatch}
      />
      <DorPopup
        open={overlay.clipsOpen}
        clips={clips}
        focusClip={focusClip}
        matchSerial={overlay.matchSerial}
        recPhase={overlay.recPhase}
        onClose={overlay.closeClips}
        onShare={() => overlay.pushToast('길드에 공유했습니다')}
        onCopy={(id) => {
          const link = `https://dor.gg/clip/${id}`
          void navigator.clipboard?.writeText(link).catch(() => undefined)
          overlay.pushToast('링크를 복사했습니다')
        }}
      />
      <AnimatePresence>
        {overlay.toast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-8 left-1/2 z-[110] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black"
          >
            {overlay.toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
