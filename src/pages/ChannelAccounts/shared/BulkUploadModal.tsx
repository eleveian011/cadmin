// @ts-nocheck
import { useState, useRef, useEffect } from 'react'
import { Upload, FileSpreadsheet, X, Download, CheckCircle2, SkipForward, Ban } from 'lucide-react'
import { CdsModal, CdsRadio, CdsButton, CdsBadge, useToast } from '../../../components/cds'
import { useBulkUploadChannelAccounts } from '../../../services/hooks'

/* ─── Duplicate-mode option card ────────────────────────────── */

function ModeOption({ active, title, desc, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-start gap-3 rounded-lg border p-3 text-left cursor-pointer transition-colors ${active ? 'border-(--accent) bg-(--accent-subtle)' : 'border-(--border) hover:bg-(--item-hover)'}`}>
      <CdsRadio checked={active} />
      <div>
        <div className="type-body font-semibold text-(--text)">{title}</div>
        <div className="type-caption text-(--muted)">{desc}</div>
      </div>
    </button>
  )
}

/* ─── Result report ─────────────────────────────────────────── */

const OUTCOME_META = {
  added:    { tone: 'success', Icon: CheckCircle2, iconCls: 'text-(--success)' },
  updated:  { tone: 'primary', Icon: CheckCircle2, iconCls: 'text-(--accent)' },
  ignored:  { tone: 'neutral', Icon: SkipForward,  iconCls: 'text-(--muted)' },
  rejected: { tone: 'danger',  Icon: Ban,          iconCls: 'text-(--danger)' },
}

function ResultReport({ result, t }) {
  const summary = [
    { key: 'added',    n: result.added },
    { key: 'updated',  n: result.updated },
    { key: 'ignored',  n: result.ignored },
    { key: 'rejected', n: result.rejected },
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-2">
        {summary.map(s => (
          <div key={s.key} className="flex flex-col items-center gap-1 rounded-md border border-(--border) py-2.5">
            <span className="type-h4 font-bold text-(--text) tabular-nums">{s.n}</span>
            <CdsBadge tone={OUTCOME_META[s.key].tone}>{t(`channelAccount.bulk.outcome.${s.key}`)}</CdsBadge>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-(--border) max-h-64 overflow-y-auto">
        {result.rows.map((r, i) => {
          const meta = OUTCOME_META[r.outcome]
          const Icon = meta.Icon
          return (
            <div key={i} className="flex items-start gap-2.5 px-3 py-2 border-b border-(--border) last:border-b-0">
              <Icon size={15} className={`mt-0.5 shrink-0 ${meta.iconCls}`} />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="type-body-sm text-(--text) tabular-nums">
                  <span className="text-(--subtle)">{t('channelAccount.bulk.row')} {r.rowNumber}</span> · {r.channel_account_number}
                </span>
                {r.reason && <span className="type-caption text-(--muted)">{r.reason}</span>}
              </div>
              <CdsBadge tone={meta.tone}>{t(`channelAccount.bulk.outcome.${r.outcome}`)}</CdsBadge>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Bulk Upload Modal (GLDB only, §7.4) ───────────────────── */

export function BulkUploadModal({ open, onClose, t }) {
  const toast  = useToast()
  const upload = useBulkUploadChannelAccounts()
  const inputRef = useRef(null)

  const [file, setFile]   = useState(null)
  const [mode, setMode]   = useState('ignore')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!open) { setFile(null); setMode('ignore'); setResult(null) }
  }, [open])

  const pickFile = (f) => {
    if (!f) return
    const ok = /\.(xlsx|xls|csv)$/i.test(f.name)
    if (!ok) { toast.show(t('channelAccount.bulk.fileTypeError')); return }
    setFile(f)
  }

  const handleUpload = () => {
    if (!file) return
    // The file bytes go to the backend, which parses + validates and returns the
    // report. The client never parses the workbook (keeps the parse trust boundary
    // server-side). Demo: store mock plays the backend.
    upload.mutateAsync({ fileName: file.name, channel: 'GLDB', mode })
      .then((res) => { setResult(res); toast.show(t('channelAccount.bulk.done')) })
      .catch(e => toast.show(e?.message || t('channelAccount.bulk.failed')))
  }

  const handleTemplate = () => {
    // Template is a backend-provided artifact; demo serves a tiny inline CSV header.
    const cols = 'Payment Channel,Channel Account Number,User Channel Account Number,Currency,Account Type,Participant Code'
    const url = `data:text/csv;charset=utf-8,${encodeURIComponent(cols + '\n')}`
    const a = document.createElement('a')
    a.href = url
    a.download = 'gldb-channel-account-mapping-template.csv'
    a.click()
  }

  const footer = result
    ? [{ label: t('common.done') ?? 'Done', variant: 'primary', onClick: onClose }]
    : [
        { label: t('channelAccount.bulk.upload'), variant: 'primary', onClick: handleUpload, loading: upload.isPending, disabled: !file || upload.isPending },
        { label: t('common.cancel'), onClick: onClose },
      ]

  return (
    <CdsModal
      open={open}
      onClose={onClose}
      size="lg"
      headerMode="close"
      title={t('channelAccount.bulk.title')}
      footer={footer}
    >
      {result ? (
        <ResultReport result={result} t={t} />
      ) : (
        <div className="flex flex-col gap-4">
          {/* GLDB-only scope notice */}
          <div className="rounded-md bg-(--fill) px-3 py-2.5 type-body-sm text-(--muted)">
            {t('channelAccount.bulk.scopeNote')}
          </div>

          {/* Template download */}
          <button type="button" onClick={handleTemplate}
            className="flex items-center gap-2 type-body-sm text-(--accent) hover:underline cursor-pointer self-start">
            <Download size={14} /> {t('channelAccount.bulk.downloadTemplate')}
          </button>

          {/* File picker */}
          <div>
            <label className="type-caption font-semibold text-(--text) mb-1.5 block">{t('channelAccount.bulk.file')}</label>
            {file ? (
              <div className="flex items-center gap-2 rounded-md border border-(--border) bg-(--surface) px-3 py-2.5">
                <FileSpreadsheet size={16} className="text-(--accent) shrink-0" />
                <span className="type-body-sm text-(--text) flex-1 truncate">{file.name}</span>
                <span className="type-caption text-(--subtle)">{(file.size / 1024).toFixed(0)} KB</span>
                <button type="button" className="text-(--muted) hover:text-(--danger) cursor-pointer" onClick={() => setFile(null)}>
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-(--border-strong) px-4 py-6 cursor-pointer hover:bg-(--item-hover) transition-colors"
                onClick={() => inputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]) }}
              >
                <Upload size={18} className="text-(--muted)" />
                <span className="type-body-sm text-(--muted)">{t('channelAccount.bulk.dropHint')}</span>
                <span className="type-caption text-(--subtle)">{t('channelAccount.bulk.accept')}</span>
              </div>
            )}
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={e => { pickFile(e.target.files?.[0]); e.target.value = '' }} />
          </div>

          {/* Duplicate handling — the "覆盖 or drop" decision */}
          <div>
            <label className="type-caption font-semibold text-(--text) mb-1.5 block">{t('channelAccount.bulk.duplicateHandling')}</label>
            <div className="flex flex-col gap-2">
              <ModeOption
                active={mode === 'ignore'}
                title={t('channelAccount.bulk.modeIgnore')}
                desc={t('channelAccount.bulk.modeIgnoreDesc')}
                onClick={() => setMode('ignore')}
              />
              <ModeOption
                active={mode === 'overwrite'}
                title={t('channelAccount.bulk.modeOverwrite')}
                desc={t('channelAccount.bulk.modeOverwriteDesc')}
                onClick={() => setMode('overwrite')}
              />
            </div>
          </div>
        </div>
      )}
    </CdsModal>
  )
}
