import { useId } from 'react'
import type { SceneId } from '../clips/library.ts'

export function ClipArt({ scene }: { scene: SceneId }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 640 360" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky(scene)[0]} />
          <stop offset="100%" stopColor={sky(scene)[1]} />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill={`url(#${uid}-sky)`} />
      {scene === 'lantern' && <Lantern />}
      {scene === 'canyon' && <Canyon />}
      {scene === 'duel' && <Duel />}
      {scene === 'lounge' && <Lounge />}
      {scene === 'victory' && <Victory />}
      {scene === 'alley' && <Alley />}
    </svg>
  )
}

function sky(scene: SceneId): [string, string] {
  switch (scene) {
    case 'lantern':
      return ['#2a1b55', '#141426']
    case 'canyon':
      return ['#ff8a3d', '#4a2a55']
    case 'duel':
      return ['#1a2148', '#101018']
    case 'lounge':
      return ['#243044', '#151820']
    case 'victory':
      return ['#3a2a86', '#f2b24a']
    case 'alley':
      return ['#102033', '#070910']
  }
}

function Lantern() {
  return (
    <g>
      <rect x="70" y="210" width="500" height="16" rx="8" fill="#2a2438" />
      {[120, 250, 390, 510].map((x) => (
        <g key={x}>
          <line x1={x} y1="70" x2={x} y2="150" stroke="#ffb25a" strokeWidth="3" />
          <rect x={x - 14} y="148" width="28" height="36" rx="8" fill="#ffcf70" />
        </g>
      ))}
      <circle cx="210" cy="230" r="28" fill="#f4efe6" />
      <rect x="190" y="254" width="40" height="46" rx="14" fill="#7c5cff" />
    </g>
  )
}

function Canyon() {
  return (
    <g>
      <path d="M0 250 L90 140 L150 220 L230 90 L310 230 L400 120 L480 240 L560 150 L640 230 L640 360 L0 360 Z" fill="#6a3a4a" />
      <path d="M0 290 L120 200 L210 280 L320 170 L430 300 L640 210 L640 360 L0 360 Z" fill="#3d2438" />
      <circle cx="470" cy="86" r="34" fill="#ffe1a8" />
    </g>
  )
}

function Duel() {
  return (
    <g>
      <circle cx="180" cy="210" r="36" fill="#d7d3e6" />
      <rect x="150" y="242" width="60" height="70" rx="18" fill="#ff7a59" />
      <circle cx="460" cy="200" r="40" fill="#1d1a24" />
      <rect x="424" y="236" width="72" height="78" rx="18" fill="#7c5cff" />
      <path d="M230 220 H400" stroke="#9ecbff" strokeWidth="8" strokeLinecap="round" />
    </g>
  )
}

function Lounge() {
  return (
    <g>
      <rect x="70" y="70" width="250" height="210" rx="18" fill="#10141c" opacity="0.72" />
      {[0, 1, 2, 3].map((row) => (
        <g key={row}>
          <circle cx="104" cy={108 + row * 40} r="10" fill="#7c5cff" />
          <rect x="126" y={100 + row * 40} width="150" height="12" rx="6" fill="#d5d8e2" opacity="0.8" />
        </g>
      ))}
      <circle cx="470" cy="190" r="46" fill="#f2d7c4" />
      <rect x="430" y="230" width="80" height="70" rx="20" fill="#67d2c5" />
    </g>
  )
}

function Victory() {
  return (
    <g>
      <circle cx="320" cy="250" r="120" fill="#f6c453" opacity="0.35" />
      <rect x="250" y="150" width="140" height="18" rx="9" fill="#fff" />
      <rect x="210" y="210" width="220" height="54" rx="16" fill="#ffe56a" />
      <rect x="210" y="276" width="220" height="54" rx="16" fill="#7c5cff" />
      <text x="258" y="245" fill="#241808" fontSize="24" fontWeight="800">
        로비로
      </text>
      <text x="248" y="311" fill="#fff" fontSize="24" fontWeight="800">
        한 판 더
      </text>
    </g>
  )
}

function Alley() {
  return (
    <g>
      <rect x="40" y="40" width="180" height="280" fill="#162033" />
      <rect x="420" y="20" width="180" height="300" fill="#1a2740" />
      {[70, 120, 170].map((y) => (
        <rect key={y} x="60" y={y} width="36" height="22" fill="#8fd0ff" opacity="0.7" />
      ))}
      <circle cx="320" cy="210" r="30" fill="#efe8dc" />
      <rect x="298" y="236" width="44" height="64" rx="16" fill="#ff7a59" />
    </g>
  )
}
