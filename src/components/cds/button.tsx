import React from 'react'
import { CdsSpinner } from './spinner'

type ButtonVariant  = 'primary' | 'secondary' | 'ghost' | 'text' | 'subtle' | 'inverse'
type ButtonSize     = 'xs' | 'sm' | 'md' | 'lg'
type ButtonWidth    = 'compact' | 'full' | 'manually'
type ButtonWeight   = 'bold' | 'normal'

export interface CdsButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?:           React.ElementType
  variant?:      ButtonVariant
  size?:         ButtonSize
  width?:        ButtonWidth
  weight?:       ButtonWeight
  icon?:         React.ReactNode
  iconPosition?: 'left' | 'right'
  loading?:      boolean
  className?:    string
  children?:     React.ReactNode
}

export function CdsButton({
  as: Comp = 'button',
  variant = 'primary',
  size = 'md',
  width = 'compact',
  weight = 'bold',
  icon = null,
  iconPosition = 'left',
  loading = false,
  className = '',
  children,
  ...props
}: CdsButtonProps) {
  const base = 'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2'

  const variants: Record<ButtonVariant, string> = {
    primary:   'bg-(--accent) text-(--on-primary) hover:bg-(--accent-hover)',
    secondary: 'bg-(--accent-secondary) text-(--on-primary) hover:bg-(--accent-hover)',
    ghost:     'bg-transparent text-(--accent) shadow-[inset_0_0_0_1px_var(--accent)] hover:shadow-[inset_0_0_0_2px_var(--accent)]',
    text:      'bg-transparent text-(--accent) hover:text-(--accent-hover)',
    subtle:    'bg-transparent text-(--text) shadow-[inset_0_0_0_1px_var(--border)] hover:bg-(--item-hover)',
    inverse:   'bg-transparent text-(--on-primary) shadow-[inset_0_0_0_1px_var(--on-primary)] hover:bg-[color-mix(in_srgb,var(--on-primary)_12%,transparent)]',
  }

  const disabledVariants: Record<ButtonVariant, string> = {
    primary:   'bg-(--surface-disabled) text-(--disabled)',
    secondary: 'bg-(--surface-disabled) text-(--disabled)',
    ghost:     'bg-transparent text-(--disabled) shadow-[inset_0_0_0_1px_var(--surface-disabled)]',
    text:      'bg-transparent text-(--disabled)',
    subtle:    'bg-transparent text-(--disabled) shadow-[inset_0_0_0_1px_var(--surface-disabled)]',
    inverse:   'bg-transparent text-(--on-primary) opacity-50 shadow-[inset_0_0_0_1px_var(--on-primary)]',
  }

  const sizes: Record<ButtonSize, string> = {
    xs: 'h-6 px-2 type-body-sm',
    sm: 'h-8 px-3 type-body',
    md: 'h-10 px-4 type-body',
    lg: 'h-12 px-5 type-body',
  }

  const widths: Record<ButtonWidth, string> = {
    compact:  'w-auto',
    full:     'w-full',
    manually: '',
  }

  const weights: Record<ButtonWeight, string> = {
    bold:   'font-bold',
    normal: 'font-normal',
  }

  const isDisabled = loading || props.disabled
  const variantClass = isDisabled ? disabledVariants[variant] : variants[variant]
  const disabledClass = isDisabled ? 'pointer-events-none' : ''

  return (
    <Comp
      className={`${base} ${variantClass} ${sizes[size]} ${widths[width]} ${weights[weight]} ${disabledClass} ${className}`}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="relative flex items-center justify-center">
          <span className="invisible flex items-center gap-1.5">
            {icon && iconPosition === 'left' && <span className="inline-flex items-center">{icon}</span>}
            {children && <span>{children}</span>}
            {icon && iconPosition === 'right' && <span className="inline-flex items-center">{icon}</span>}
          </span>
          <CdsSpinner className="absolute h-4 w-4" />
        </span>
      ) : (
        <>
          {icon && iconPosition === 'left'  && <span className="inline-flex items-center">{icon}</span>}
          {children && <span>{children}</span>}
          {icon && iconPosition === 'right' && <span className="inline-flex items-center">{icon}</span>}
        </>
      )}
    </Comp>
  )
}
