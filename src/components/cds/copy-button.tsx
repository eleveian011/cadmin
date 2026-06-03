import { useState } from 'react'
import { Copy, CheckCheck } from 'lucide-react'
import { useToast } from './toast'

export interface CdsCopyButtonProps {
  text: string
  className?: string
}

export function CdsCopyButton({ text, className = '' }: CdsCopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const toast = useToast()
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    toast.show('Copied to clipboard')
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button type="button" className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded text-(--muted) hover:text-(--accent) hover:bg-(--item-hover) transition-colors ${className}`} onClick={handleCopy} title="Copy">
      {copied ? <CheckCheck size={13} className="text-(--success)" /> : <Copy size={13} />}
    </button>
  )
}
