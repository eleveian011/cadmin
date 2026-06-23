// @ts-nocheck
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FileJson, Copy, CheckCheck } from 'lucide-react'
import {
  CdsPageHeader, CdsButton, CdsTextarea, CdsCopyButton, useToast,
} from '../../components/cds'
import type { BreadcrumbItem } from '../../components/cds'
import { usePayeeLookup } from '../../services/hooks'
import { parseWebhook, SAMPLE_WEBHOOK } from './shared/parse'
import { buildSummaryRows, summaryRowsToText } from './shared/summary'
import { PayeeSection } from './shared/PayeeResult'

const BREADCRUMBS: BreadcrumbItem[] = [{ label: 'GLDB Webhook Parser' }]

/* ─── Parse-error line (§6.1 validation) — plain inline text, no banner ──── */
function ParseError({ error, t }) {
  // No error (parse succeeded or input empty) → render nothing.
  if (!error || error === 'empty') return null
  const key = ['missing-account', 'missing-sender'].includes(error) ? error : 'invalid-json'
  return <span className="type-body-sm text-(--danger-text)">{t(`gldbParser.error.${key}`)}</span>
}

/* ─── One parsed field cell (§6.1 displayed fields) ─────────────── */
const WARNING_TEXT = {
  'unknown-currency': 'gldbParser.warn.unknownCurrency',
  'invalid-amount':   'gldbParser.warn.invalidAmount',
}

function FieldCell({ field, t }) {
  const empty = field.value == null
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-(--border) last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
      <span className="type-caption text-(--muted)">{field.label}</span>
      <span className="flex items-center justify-between gap-1.5 min-w-0">
        {empty
          ? <span className="type-body text-(--subtle) wrap-break-word">{t('gldbParser.notProvided')}</span>
          : <span className="type-body text-(--text) tabular-nums wrap-break-word min-w-0">{field.value}</span>}
        {!empty && <CdsCopyButton text={String(field.value)} className="shrink-0" />}
      </span>
      {field.warning && WARNING_TEXT[field.warning] && (
        <span className="type-caption text-(--warning-text)">{t(WARNING_TEXT[field.warning])}</span>
      )}
    </div>
  )
}

// Persist the pasted webhook across navigation (survives tab switches + refresh;
// cleared when the browser tab closes). Demo-grade — the frontend team can swap
// this for their own store when wiring the real API.
const DRAFT_KEY = 'gldb-parser:input'

export default function GldbParser() {
  const { t } = useTranslation()
  const toast = useToast()

  const [input, setInput] = useState(() => sessionStorage.getItem(DRAFT_KEY) ?? '')
  const [parse, setParse] = useState({ ok: false, error: 'empty' })
  const [copied, setCopied] = useState(false)

  // Mirror the input into sessionStorage so it's restored when returning to the page.
  useEffect(() => {
    if (input) sessionStorage.setItem(DRAFT_KEY, input)
    else sessionStorage.removeItem(DRAFT_KEY)
  }, [input])

  // Auto-parse on input, debounced 500ms (§6.1). No manual parse button — the
  // parse is fully automatic. Runs once on mount too, so a restored draft re-parses.
  useEffect(() => {
    const id = setTimeout(() => setParse(parseWebhook(input)), 500)
    return () => clearTimeout(id)
  }, [input])

  const lookupKey = parse.ok ? parse.lookupAccountNo : null
  const { data: lookup, isFetching } = usePayeeLookup(lookupKey)

  // Paste: in dev, drop in the sample payload for quick iteration; in production
  // builds, read the user's clipboard (a normal paste into the textarea).
  const handlePaste = async () => {
    if (import.meta.env.DEV) { setInput(SAMPLE_WEBHOOK); return }
    try {
      const text = await navigator.clipboard.readText()
      if (text) setInput(text)
    } catch {
      toast.show(t('gldbParser.pasteFailed'))
    }
  }
  const handleClear = () => { setInput(''); setParse({ ok: false, error: 'empty' }) }

  const summaryRows = useMemo(() => {
    if (!parse.ok || !parse.payload) return []
    return buildSummaryRows(parse.payload, lookup?.matches ?? [], t)
  }, [parse, lookup, t])

  const handleCopy = useCallback(() => {
    if (!summaryRows.length) return
    navigator.clipboard.writeText(summaryRowsToText(summaryRows)).then(() => {
      setCopied(true)
      toast.show(t('gldbParser.summary.copied'))
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => toast.show(t('gldbParser.summary.copyFailed')))
  }, [summaryRows, toast, t])

  const showResults = parse.ok && !!parse.fields

  return (
    <div className="flex flex-col gap-6">
      <CdsPageHeader
        breadcrumb={BREADCRUMBS}
        title={t('gldbParser.title')}
        subtitle={t('gldbParser.subtitle')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        {/* ── Left: input (4/10) ────────────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <label className="type-h5 font-semibold text-(--text)">{t('gldbParser.inputLabel')}</label>
            <div className="flex items-center gap-4">
              <button type="button" onClick={handlePaste}
                className="type-body font-semibold text-(--accent) hover:text-(--accent-hover) cursor-pointer transition-colors">
                {t('gldbParser.paste')}
              </button>
              <button type="button" onClick={handleClear} disabled={!input}
                className="type-body font-semibold text-(--accent) hover:text-(--accent-hover) cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {t('gldbParser.clear')}
              </button>
            </div>
          </div>

          <CdsTextarea
            value={input}
            onChange={setInput}
            rows={20}
            placeholder={t('gldbParser.inputPlaceholder')}
            className="font-mono type-body-sm"
          />

          <ParseError error={parse.error} t={t} />
        </div>

        {/* ── Right: parsed fields + payee + summary (6/10) ─────── */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {!showResults ? (
            <div className="rounded-lg border border-dashed border-(--border-strong) px-4 py-16 flex flex-col items-center gap-2 text-center">
              <FileJson size={24} className="text-(--subtle)" />
              <span className="type-body text-(--muted)">{t('gldbParser.emptyState')}</span>
              <span className="type-caption text-(--subtle)">{t('gldbParser.emptyStateHint')}</span>
            </div>
          ) : (
            <>
              {/* Transaction fields */}
              <section className="flex flex-col gap-2">
                <h3 className="type-h5 font-semibold text-(--text)">{t('gldbParser.section.transaction')}</h3>
                <div className="rounded-lg border border-(--border) bg-(--surface) px-4 py-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  {parse.fields.map(f => <FieldCell key={f.key} field={f} t={t} />)}
                </div>
              </section>

              {/* Payee lookup */}
              <PayeeSection lookup={lookup} isFetching={isFetching} t={t} />

              {/* Summary + copy */}
              <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="type-h5 font-semibold text-(--text)">{t('gldbParser.section.summary')}</h3>
                  <button type="button" onClick={handleCopy} disabled={isFetching}
                    className="inline-flex items-center gap-1.5 type-body-sm font-semibold text-(--accent) hover:text-(--accent-hover) cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                    {copied ? t('gldbParser.summary.copiedShort') : t('gldbParser.summary.copy')}
                  </button>
                </div>
                <div className="rounded-lg border border-(--border) bg-(--surface) px-4 py-1">
                  {summaryRows.map((r, i) => (
                    <div key={i} className="flex flex-col gap-0.5 py-2 border-b border-(--border) last:border-b-0">
                      <span className="type-caption text-(--muted)">{r.label}</span>
                      <span className="flex items-center justify-between gap-1.5 min-w-0">
                        <span className="type-body text-(--text) wrap-break-word min-w-0">{r.value}</span>
                        <CdsCopyButton text={`${r.label}: ${r.value}`} className="shrink-0" />
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
