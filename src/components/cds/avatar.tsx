import React from 'react'

// Curated set of colors that work well as avatar backgrounds with white text.
// Derived from the CDS semantic palette, picked for readability and variety.
const AVATAR_PALETTE = [
  '#4f46e5', // indigo   (accent)
  '#0e7a5a', // emerald  (success)
  '#1d4ed8', // blue     (info)
  '#6d28d9', // violet
  '#0f766e', // teal
  '#b45309', // amber
  '#c0392b', // red      (danger)
  '#854d0e', // orange   (warning)
]

function nameToColor(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

type AvatarSize  = 'sm' | 'md' | 'lg'
type AvatarShape = 'circle' | 'square'

export interface CdsAvatarProps {
  size?:      AvatarSize
  shape?:     AvatarShape
  src?:       string
  name?:      string
  color?:     string
  badge?:     boolean
  className?: string
}

export function CdsAvatar({
  size = 'md',
  shape = 'circle',
  src,
  name,
  color,
  badge = false,
  className = '',
}: CdsAvatarProps) {
  const sizeMap: Record<AvatarSize, { box: string; text: string; dot: string; dotPos: string }> = {
    sm: { box: 'h-6 w-6',   text: 'type-caption',   dot: 'h-2 w-2',     dotPos: '-top-px -right-px'   },
    md: { box: 'h-8 w-8',   text: 'type-caption',   dot: 'h-2.5 w-2.5', dotPos: '-top-0.5 -right-0.5' },
    lg: { box: 'h-12 w-12', text: 'type-body-lg', dot: 'h-3 w-3',     dotPos: '-top-0.5 -right-0.5' },
  }

  const shapeMap: Record<AvatarShape, string> = {
    circle: 'rounded-full',
    square: size === 'lg' ? 'rounded-lg' : 'rounded-md',
  }

  const s = sizeMap[size]
  const r = shapeMap[shape]

  const initials = name
    ? name.trim().split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const bg = color ?? nameToColor(initials + (name ?? ''))
  const style: React.CSSProperties = { background: bg, color: '#fff' }

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <span
        className={`inline-flex items-center justify-center overflow-hidden font-semibold ${s.box} ${r}`}
        style={style}
      >
        {src
          ? <img src={src} alt={name ?? ''} className="h-full w-full object-cover" />
          : <span className={s.text}>{initials}</span>
        }
      </span>
      {badge && (
        <span className={`absolute ${s.dotPos} ${s.dot} rounded-full bg-(--danger) ring-2 ring-(--surface)`} />
      )}
    </div>
  )
}
