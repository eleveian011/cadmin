import React from 'react'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { Check, ChevronsUpDown } from 'lucide-react'

// Headless UI v2 accepts a string shorthand or a full anchor config object.
// The internal type is not exported from the public entry point, so we use
// the string union that covers all valid shorthand values.
type AnchorShorthand =
  | 'top' | 'top start' | 'top end'
  | 'bottom' | 'bottom start' | 'bottom end'
  | 'left' | 'left start' | 'left end'
  | 'right' | 'right start' | 'right end'

export interface ListboxOption {
  value:      string
  label:      string
  subLabel?:  string
  type?:      'section'
  readOnly?:  boolean
}

type ListboxSize      = 'sm' | 'md' | 'lg'
type ListboxItemStyle = 'compact' | 'simple' | 'rich'
type MenuWidthMode    = 'match-trigger' | 'auto' | 'custom'

export interface CdsStackedListboxProps {
  value?:              string
  onChange?:           (value: string) => void
  options?:            ListboxOption[]
  className?:          string
  buttonClassName?:    string
  menuClassName?:      string
  buttonWidthClass?:   string
  menuWidthMode?:      MenuWidthMode
  menuWidthClass?:     string
  size?:               ListboxSize
  itemStyle?:          ListboxItemStyle
  leadingIcon?:        React.ReactNode
  buttonShowSubLabel?: boolean
  renderButton?:       (selected: ListboxOption | undefined) => React.ReactNode
  renderOption?:       (option: ListboxOption, state: { selected: boolean; focus: boolean; readOnly: boolean }) => React.ReactNode
  label?:              string
  anchor?:             AnchorShorthand
  disabled?:           boolean
}

export function CdsStackedListbox({
  value,
  onChange,
  options = [],
  className = '',
  buttonClassName = '',
  menuClassName = '',
  buttonWidthClass = 'w-full',
  menuWidthMode = 'match-trigger',
  menuWidthClass = '',
  size = 'md',
  itemStyle = 'simple',
  leadingIcon = null,
  buttonShowSubLabel = false,
  renderButton,
  renderOption,
  label,
  anchor = 'bottom end',
  disabled = false,
}: CdsStackedListboxProps) {
  const selectable = options.filter(o => o?.type !== 'section')
  const selected = selectable.find(o => o.value === value) ?? selectable[0]

  const sizeMap: Record<ListboxSize, string> = {
    sm: 'h-8 px-2.5 type-body-sm',
    md: 'h-9 px-3 type-body',
    lg: 'h-10 px-3.5 type-body',
  }

  const itemClass = itemStyle === 'compact'
    ? 'flex items-center justify-between rounded-md px-2 py-1.5 type-body-sm cursor-pointer'
    : itemStyle === 'rich'
      ? 'flex items-center justify-between rounded-md px-2.5 py-2.5 type-body cursor-pointer'
      : 'flex items-center justify-between rounded-md px-2.5 py-2 type-body cursor-pointer'

  const resolvedMenuWidthClass = menuWidthMode === 'match-trigger'
    ? 'w-(--button-width)'
    : menuWidthMode === 'custom'
      ? menuWidthClass
      : 'min-w-55'

  const buttonStateClass = disabled
    ? 'cursor-not-allowed opacity-50'
    : "cursor-pointer data-[headlessui-state~='open']:border-(--accent)"

  return (
    <Listbox value={selected?.value} onChange={onChange} disabled={disabled}>
      <div className={`relative ${className}`}>
        <ListboxButton className={`${sizeMap[size]} ${buttonWidthClass} rounded-md border border-(--border) bg-(--surface) text-left text-(--text) outline-none transition hover:bg-(--item-hover) ${buttonStateClass} ${buttonClassName}`}>
          {renderButton ? (
            renderButton(selected)
          ) : (
            <div className="flex w-full items-center gap-2">
              {leadingIcon && <span className="inline-flex shrink-0 text-(--muted)">{leadingIcon}</span>}
              <div className="min-w-0 flex-1">
                <span className="block truncate">{selected?.label || label}</span>
                {buttonShowSubLabel && selected?.subLabel && <div className="truncate type-caption text-(--muted)">{selected.subLabel}</div>}
              </div>
              <ChevronsUpDown size={13} className="ml-auto shrink-0 text-(--subtle)" />
            </div>
          )}
        </ListboxButton>

        <ListboxOptions portal anchor={anchor} className={`z-2100 mt-1 ${resolvedMenuWidthClass} rounded-md border border-(--border) bg-(--surface-overlay) p-1 shadow-(--shadow-lg) [--anchor-gap:6px] ${menuClassName}`}>
          {options.map((option, idx) => {
            if (option?.type === 'section') {
              return (
                <div
                  key={`section-${idx}-${option.label}`}
                  className="px-2.5 py-1.5 type-caption font-semibold uppercase text-(--subtle)"
                >
                  {option.label}
                </div>
              )
            }

            const readonly = !!option?.readOnly

            return (
              <ListboxOption key={option.value} value={option.value} className="group" disabled={readonly}>
                {({ selected: isSelected, focus }) => {
                  if (renderOption) {
                    return <>{renderOption(option, { selected: isSelected, focus, readOnly: readonly })}</>
                  }
                  return (
                    <div className={`${itemClass} ${readonly ? 'text-(--muted) cursor-default opacity-90' : focus ? 'bg-(--accent-subtle) text-(--accent-text)' : 'text-(--text)'}`}>
                      <div className="min-w-0 flex-1">
                        <span className="truncate">{option.label}</span>
                        {itemStyle === 'rich' && option.subLabel && <div className="truncate type-caption text-(--muted)">{option.subLabel}</div>}
                      </div>
                      {isSelected && !readonly && <Check size={13} className="text-(--accent-text)" />}
                    </div>
                  )
                }}
              </ListboxOption>
            )
          })}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}
