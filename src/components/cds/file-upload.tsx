import React, { useRef } from 'react'
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react'

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  status: 'uploading' | 'done' | 'error'
}

export interface CdsFileUploadProps {
  files: UploadedFile[]
  onChange: (files: UploadedFile[]) => void
  onUpload: (file: File) => Promise<{ id: string; url: string }>
  maxFiles?: number
  maxSizeMb?: number
  accept?: string
  disabled?: boolean
  className?: string
}

let fileIdCounter = 0

export function CdsFileUpload({ files, onChange, onUpload, maxFiles = 5, maxSizeMb = 20, accept = '.pdf,image/*', disabled = false, className = '' }: CdsFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const filesRef = useRef(files)
  filesRef.current = files

  const handleAdd = async (incoming: FileList | null) => {
    if (!incoming || files.length >= maxFiles) return
    const valid = Array.from(incoming)
      .filter(f => f.size <= maxSizeMb * 1024 * 1024)
      .slice(0, maxFiles - files.length)

    for (const file of valid) {
      const tempId = `file_${++fileIdCounter}`
      const placeholder: UploadedFile = { id: tempId, name: file.name, size: file.size, type: file.type, status: 'uploading' }
      onChange([...filesRef.current, placeholder])

      try {
        const result = await onUpload(file)
        onChange(filesRef.current.map(f => f.id === tempId ? { ...f, id: result.id, url: result.url, status: 'done' } : f))
      } catch {
        onChange(filesRef.current.map(f => f.id === tempId ? { ...f, status: 'error' } : f))
      }
    }
  }

  const handleRemove = (id: string) => {
    onChange(files.filter(f => f.id !== id))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) handleAdd(e.dataTransfer.files)
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-md border border-(--border) bg-(--surface) px-4 py-5 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white'}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Upload size={18} className="text-(--muted)" />
        <span className="type-body-sm text-(--muted)">Drop files here or click to browse</span>
        <span className="type-caption text-(--subtle)">PDF or image, max {maxSizeMb}MB, up to {maxFiles} files</span>
      </div>
      <input ref={inputRef} type="file" accept={accept} multiple className="hidden" onChange={e => { handleAdd(e.target.files); e.target.value = '' }} />
      {files.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-2 rounded-md border border-(--border) bg-(--surface) px-3 py-1.5">
              {f.status === 'uploading'
                ? <Loader2 size={14} className="text-(--accent) animate-spin" />
                : f.status === 'error' ? <X size={14} className="text-(--danger)" />
                : f.type.startsWith('image/') ? <Image size={14} className="text-(--muted)" /> : <FileText size={14} className="text-(--muted)" />
              }
              <span className="type-body-sm text-(--text) flex-1 truncate">{f.name}</span>
              <span className="type-caption text-(--subtle)">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
              {f.status === 'uploading' && <span className="type-caption text-(--accent)">Uploading...</span>}
              {f.status === 'error' && <span className="type-caption text-(--danger)">Failed</span>}
              {f.status !== 'uploading' && (
                <button type="button" className="text-(--muted) hover:text-(--danger) cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRemove(f.id) }}><X size={14} /></button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
