// @ts-nocheck
import { useState, useEffect } from 'react'
import { AlertTriangle, Ban, ChevronLeft, ChevronRight, ExternalLink, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CdsStatusTag, CdsSpinner, CdsCopyButton } from '../../../components/cds'

/* ─── Status tone (mirrors ChannelAccounts helpers) ─────────────── */
const STATUS_TONE = { active: 'success', initial: 'warning', suspended: 'warning', closed: 'danger' }
const isException = (s) => s !== 'active'

/* ─── Match confidence — inline text next to the section title (§6.2) ───── */

const CONFIDENCE_TONE = {
  exact:    'text-(--success-text)',
  multiple: 'text-(--warning-text)',
  none:     'text-(--danger-text)',
}

function ConfidenceText({ confidence, t }) {
  return (
    <span className={`type-body-sm font-semibold ${CONFIDENCE_TONE[confidence]}`}>
      {t(`gldbParser.confidence.${confidence}`)}
    </span>
  )
}

/* ─── Carousel switcher: < 1/10 > (sits where the tag used to be) ───────── */

function CarouselSwitcher({ index, total, onPrev, onNext }) {
  const btn = 'flex h-6 w-6 items-center justify-center rounded-md text-(--muted) hover:text-(--accent) hover:bg-(--item-hover) cursor-pointer transition-colors'
  return (
    <div className="flex items-center gap-1">
      <button type="button" className={btn} onClick={onPrev} aria-label="Previous match">
        <ChevronLeft size={16} />
      </button>
      <span className="type-body-sm font-semibold text-(--text) tabular-nums select-none">{index + 1}/{total}</span>
      <button type="button" className={btn} onClick={onNext} aria-label="Next match">
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

/* ─── One field row — same two-column style as Transaction Details ──────── */
function PayeeField({ label, value, copyable }) {
  const empty = value == null || value === '' || value === '—'
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-(--border) last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
      <span className="type-caption text-(--muted)">{label}</span>
      <span className="flex items-center justify-between gap-1.5 min-w-0">
        {empty
          ? <span className="type-body text-(--subtle)">—</span>
          : <span className="type-body text-(--text) tabular-nums wrap-break-word min-w-0">{value}</span>}
        {!empty && copyable && <CdsCopyButton text={String(value)} className="shrink-0" />}
      </span>
    </div>
  )
}

/* ─── One matched payee card (§6.2 output display) ──────────────── */

function PayeeCard({ account, t }) {
  const blocking = isException(account.participant_status)
  const inactive = account.mapping_status === 'inactive'
  const accountTypeLabel = `${t(`channelAccount.accountType.${account.account_type}`)} ${t('gldbParser.payee.account')}`

  return (
    <div className="rounded-lg border border-(--border) bg-(--surface) px-4 pt-3 pb-1 flex flex-col gap-3">
      {/* Header: name + status (left), account type as text (right) */}
      <div className="flex items-center justify-between gap-3 flex-wrap pb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="type-h5 font-semibold text-(--text)">{account.client_name}</span>
          <CdsStatusTag tone={STATUS_TONE[account.participant_status]}>
            {t(`channelAccount.clientStatus.${account.participant_status}`)}
          </CdsStatusTag>
        </div>
        <span className="type-body-sm text-(--muted)">{accountTypeLabel}</span>
      </div>

      {/* Fields — two-column grid, no inner box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        <PayeeField label={t('channelAccount.col.participantCode')} value={account.participant_code ?? '—'} copyable />
        <PayeeField label={t('channelAccount.col.userChannelAccountNumber')} value={account.user_channel_account_number} copyable />
        <PayeeField label={t('channelAccount.col.participantStatus')} value={t(`channelAccount.clientStatus.${account.participant_status}`)} />
        <PayeeField label={t('channelAccount.col.currency')} value={account.currency} />
        <PayeeField label={t('channelAccount.col.referenceCode')} value={account.reference_code ?? '—'} />
      </div>

      {blocking && (
        <div className="flex items-start gap-2 rounded-md border border-(--warning-border) bg-(--warning-bg) px-3 py-2 mb-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-(--warning-text)" />
          <span className="type-body-sm text-(--warning-text)">{t('gldbParser.payee.statusWarning')}</span>
        </div>
      )}
      {inactive && (
        <div className="flex items-start gap-2 rounded-md bg-(--fill) px-3 py-2 mb-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-(--muted)" />
          <span className="type-body-sm text-(--muted)">{t('gldbParser.payee.inactiveWarning')}</span>
        </div>
      )}
    </div>
  )
}

/* ─── Payee section: title + confidence + carousel of matches (§6.2) ─────── */

export function PayeeSection({ lookup, isFetching, t }) {
  const matches = lookup?.matches ?? []
  const total = matches.length
  const [index, setIndex] = useState(0)
  // Track slide direction so the incoming card animates from the right (next) or left (prev).
  const [dir, setDir] = useState('right')

  // Reset to the first match whenever the lookup changes (new account searched).
  useEffect(() => { setIndex(0); setDir('right') }, [lookup?.searchedAccountNo, total])

  const prev = () => { setDir('left');  setIndex(i => (i - 1 + total) % total) }
  const next = () => { setDir('right'); setIndex(i => (i + 1) % total) }
  const current = matches[Math.min(index, Math.max(total - 1, 0))]
  const slideClass = dir === 'right' ? 'animate-carousel-right' : 'animate-carousel-left'

  return (
    <section className="flex flex-col gap-2">
      {/* Header: title + inline confidence text (left), carousel switcher (right) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <h3 className="type-h5 font-semibold text-(--text)">{t('gldbParser.section.payee')}</h3>
          {!isFetching && lookup && <ConfidenceText confidence={lookup.confidence} t={t} />}
        </div>
        {isFetching
          ? <CdsSpinner size="sm" />
          : total > 1 && <CarouselSwitcher index={index} total={total} onPrev={prev} onNext={next} />}
      </div>

      {/* Multiple-matches warning — directly under the title, 14px, danger style */}
      {!isFetching && lookup?.confidence === 'multiple' && (
        <div className="flex items-start gap-2 rounded-md border border-(--danger-border) bg-(--danger-bg) px-3 py-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-(--danger)" />
          <span className="type-body text-(--danger-text)">{t('gldbParser.payee.multipleHint')}</span>
        </div>
      )}

      {/* Body */}
      {!isFetching && lookup && (
        lookup.confidence === 'none' ? (
          <div className="rounded-lg border border-(--danger-border) bg-(--danger-bg) p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Ban size={16} className="text-(--danger) shrink-0" />
              <span className="type-body font-semibold text-(--danger)">{t('gldbParser.payee.notFoundTitle')}</span>
            </div>
            <div className="type-body-sm text-(--text)">
              {t('gldbParser.payee.notFoundDesc')}
              <span className="font-bold tabular-nums"> {lookup.searchedAccountNo}</span>
            </div>
            <Link to="/channel-accounts"
              className="inline-flex items-center gap-1.5 type-body-sm font-semibold text-(--accent) hover:text-(--accent-hover) self-start">
              <Search size={14} /> {t('gldbParser.payee.goToMapping')}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {current && (
              <div key={index} className={slideClass}>
                <PayeeCard account={current} t={t} />
              </div>
            )}
            <Link to="/channel-accounts"
              className="inline-flex items-center gap-1.5 type-caption text-(--muted) hover:text-(--accent) self-start">
              <ExternalLink size={12} /> {t('gldbParser.payee.viewInMapping')}
            </Link>
          </div>
        )
      )}
    </section>
  )
}
