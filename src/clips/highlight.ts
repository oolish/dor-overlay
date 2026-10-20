import { useEffect, useState } from 'react'

function paint(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#24144a')
  sky.addColorStop(0.45, '#3a1d38')
  sky.addColorStop(1, '#10141c')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = '#1c2433'
  ctx.beginPath()
  ctx.moveTo(0, h * 0.72)
  ctx.lineTo(w * 0.22, h * 0.58)
  ctx.lineTo(w * 0.4, h * 0.7)
  ctx.lineTo(w * 0.62, h * 0.5)
  ctx.lineTo(w * 0.84, h * 0.66)
  ctx.lineTo(w, h * 0.56)
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.fill()

  ctx.strokeStyle = 'rgba(150, 186, 255, 0.45)'
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.arc(w * 0.52, h * 0.7, 150 + Math.sin(t * Math.PI * 2) * 10, Math.PI, 0)
  ctx.stroke()

  const x = w * (0.18 + t * 0.64)
  const y = h * (0.62 + Math.sin(t * Math.PI * 4) * 0.03)
  const glow = ctx.createRadialGradient(x, y, 4, x, y, 78)
  glow.addColorStop(0, 'rgba(255,255,255,0.95)')
  glow.addColorStop(0.4, 'rgba(255,122,89,0.45)')
  glow.addColorStop(1, 'rgba(255,122,89,0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(x, y, 78, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#f4f1ff'
  round(ctx, x - 16, y - 36, 32, 44, 16)
  ctx.fill()
  ctx.fillStyle = '#7c5cff'
  round(ctx, x - 22, y - 8, 18, 28, 8)
  ctx.fill()

  ctx.fillStyle = 'rgba(8, 8, 12, 0.62)'
  round(ctx, 28, 28, 250, 72, 16)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 28px "Apple SD Gothic Neo", sans-serif'
  ctx.fillText('하이라이트', 48, 74)
  ctx.font = '600 18px "Apple SD Gothic Neo", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.fillText(`${(t * 4).toFixed(1)}초`, w - 110, 58)
}

function round(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}

export async function createHighlightVideo() {
  const canvas = document.createElement('canvas')
  canvas.width = 960
  canvas.height = 540
  const ctx = canvas.getContext('2d')
  if (!ctx || typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
    throw new Error('recorder-unavailable')
  }
  const stream = canvas.captureStream(30)
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
    ? 'video/webm;codecs=vp8'
    : 'video/webm'
  const recorder = new MediaRecorder(stream, { mimeType: mime })
  const chunks: Blob[] = []
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  }
  const stopped = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime }))
  })
  recorder.start(120)
  const duration = 4000
  const started = performance.now()
  await new Promise<void>((resolve) => {
    const frame = (now: number) => {
      const t = Math.min(1, (now - started) / duration)
      paint(ctx, t, canvas.width, canvas.height)
      if (t < 1) requestAnimationFrame(frame)
      else resolve()
    }
    requestAnimationFrame(frame)
  })
  if (recorder.state !== 'inactive') recorder.stop()
  stream.getTracks().forEach((track) => track.stop())
  const blob = await stopped
  return URL.createObjectURL(blob)
}

export function useHighlightVideo() {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    createHighlightVideo()
      .then((next) => {
        if (cancelled) {
          URL.revokeObjectURL(next)
          return
        }
        objectUrl = next
        setUrl(next)
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [])

  return url
}
