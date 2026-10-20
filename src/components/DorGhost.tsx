type DorGhostProps = {
  className?: string
}

export function DorGhost({ className }: DorGhostProps) {
  return (
    <img
      src="/dor-ghost.webp"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`select-none object-cover ${className ?? ''}`}
    />
  )
}
