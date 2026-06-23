// @ts-nocheck
import { useState, useEffect, useMemo } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import {
  CdsModal, CdsInput, CdsStackedListbox, CdsDropdownPanel, useToast,
} from '../../../components/cds'
import { useCreateChannelAccount, useUpdateChannelAccount } from '../../../services/hooks'
import { useClientSearch } from '../../../services/hooks'
import { CHANNEL_OPTIONS, ACCOUNT_TYPE_OPTIONS, CURRENCY_OPTIONS } from './helpers'

/* ─── Small labeled-field wrapper ───────────────────────────── */

function Field({ label, required, hint, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="type-caption font-semibold text-(--text)">
        {label}{required && <span className="text-(--danger)"> *</span>}
      </label>
      {children}
      {hint && <span className="type-caption text-(--subtle)">{hint}</span>}
    </div>
  )
}

/* ─── Client ⇄ Participant linked search ──────────────────────────────────────
 * Type into either Client Name or Participant Code; search CAMP; pick a result →
 * both fields fill and lock (read-only). A "Change" link clears the lock so Ops
 * can re-search. On edit, the client identity is always locked (read-only).
 */
function ClientPicker({ form, set, locked, t }) {
  const [field, setField] = useState<'name' | 'code' | null>(null) // which input is being typed
  const [q, setQ] = useState('')
  const { data } = useClientSearch(q, { limit: 8 })
  const results = data?.items ?? []

  const pick = (c) => {
    set({ client_name: c.client_name, participant_code: c.participant_code })
    setField(null); setQ('')
  }
  const clear = () => set({ client_name: '', participant_code: '' })

  const bound = !!(form.client_name && form.participant_code)

  // Read-only display once both are bound (or on edit).
  if (locked || bound) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label={t('channelAccount.col.clientName')} required>
          <CdsInput size="md" value={form.client_name} disabled className="bg-(--disabled-surface) text-(--disabled-text)" />
        </Field>
        <Field label={t('channelAccount.col.participantCode')} required
          hint={!locked ? undefined : t('channelAccount.form.identityReadOnly')}>
          <div className="flex items-center gap-2">
            <CdsInput size="md" value={form.participant_code} disabled className="bg-(--disabled-surface) text-(--disabled-text) flex-1" />
            {!locked && (
              <button type="button" onClick={clear}
                className="type-body-sm font-semibold text-(--accent) hover:text-(--accent-hover) cursor-pointer whitespace-nowrap">
                {t('channelAccount.form.change')}
              </button>
            )}
          </div>
        </Field>
      </div>
    )
  }

  const SearchBox = ({ which, value, placeholder }) => (
    <Popover className="relative">
      <CdsInput
        size="md"
        value={field === which ? q : value}
        onChange={e => { setField(which); setQ(e.target.value) }}
        onClear={() => { setField(which); setQ('') }}
        placeholder={placeholder}
      />
      {field === which && q.trim() && results.length > 0 && (
        <div className="absolute z-1200 mt-1 w-full">
          <CdsDropdownPanel className="w-full p-1.5 max-h-64 overflow-y-auto">
            {results.map(c => (
              <button key={c.participant_code} type="button" onClick={() => pick(c)}
                className="w-full flex flex-col gap-0.5 rounded-md px-2.5 py-1.5 text-left hover:bg-(--item-hover) cursor-pointer">
                <span className="type-body text-(--text)">{c.client_name}</span>
                <span className="type-caption text-(--muted) tabular-nums">{c.participant_code} · {c.parent_node}</span>
              </button>
            ))}
          </CdsDropdownPanel>
        </div>
      )}
    </Popover>
  )

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      <Field label={t('channelAccount.col.clientName')} required hint={t('channelAccount.form.clientSearchHint')}>
        <SearchBox which="name" value={form.client_name} placeholder={t('channelAccount.form.clientNamePlaceholder')} />
      </Field>
      <Field label={t('channelAccount.col.participantCode')} required hint={t('channelAccount.form.participantSearchHint')}>
        <SearchBox which="code" value={form.participant_code} placeholder="PART-…" />
      </Field>
    </div>
  )
}

/* ─── Currency multi-select ───────────────────────────────────── */
function CurrencyMultiSelect({ value, onChange, t }) {
  const label = value.length === 0
    ? t('channelAccount.form.currencyPlaceholder')
    : value.join(', ')
  const toggle = (c) => onChange(value.includes(c) ? value.filter(v => v !== c) : [...value, c])
  return (
    <Popover className="relative">
      <PopoverButton className="w-full flex items-center justify-between gap-2 rounded-md border border-(--border) bg-(--surface) px-3 py-2 type-body text-(--text) hover:bg-(--item-hover) outline-none focus:border-(--accent) cursor-pointer">
        <span className={value.length ? 'text-(--text)' : 'text-(--subtle)'}>{label}</span>
        <ChevronDown size={15} className="text-(--muted) shrink-0" />
      </PopoverButton>
      <PopoverPanel anchor="bottom start" className="z-1200 mt-1">
        <CdsDropdownPanel className="w-48 p-1.5 max-h-64 overflow-y-auto">
          {CURRENCY_OPTIONS.map(c => {
            const on = value.includes(c)
            return (
              <button key={c} type="button" onClick={() => toggle(c)}
                className="w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left type-body text-(--text) hover:bg-(--item-hover) cursor-pointer">
                <span>{c}</span>
                {on && <Check size={15} className="text-(--accent) shrink-0" />}
              </button>
            )
          })}
        </CdsDropdownPanel>
      </PopoverPanel>
    </Popover>
  )
}

const EMPTY = {
  payment_channel: 'GLDB',
  user_channel_account_number: '',
  channel_account_number: '',
  account_type: 'fiat',
  currency: [],
  client_name: '',
  participant_code: '',
  bank_name: '', bank_account: '', bank_swift: '', bank_country: '', bank_address: '',
}

/**
 * Add / Edit Mapping modal (§7.4 Operations, v0.2).
 * - Client identity at top: search either Client Name or Participant Code; picking
 *   a result fills + locks both.
 * - Channel Account Number (Internal) is optional (GLDB-only quirk).
 * - Currency is multi-select. Bank details follow the channel account directly.
 */
export function AccountFormModal({ account, open, onClose, t }) {
  const isEdit = !!account
  const toast  = useToast()
  const create = useCreateChannelAccount()
  const update = useUpdateChannelAccount()

  const [form, setForm] = useState(EMPTY)
  const set = (patch) => setForm(prev => ({ ...prev, ...patch }))

  useEffect(() => {
    if (!open) return
    if (account) {
      setForm({
        payment_channel: account.payment_channel,
        user_channel_account_number: account.user_channel_account_number,
        channel_account_number: account.channel_account_number,
        account_type: account.account_type,
        currency: account.currency,
        client_name: account.client_name,
        participant_code: account.participant_code ?? '',
        bank_name: account.bank_details.bank_name,
        bank_account: account.bank_details.account_number,
        bank_swift: account.bank_details.swift_code,
        bank_country: account.bank_details.country_code,
        bank_address: account.bank_details.bank_address,
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, account?.id])

  const isGldb = form.payment_channel === 'GLDB'
  const userAcctReadOnly = isEdit && !isGldb
  const internalReadOnly = isEdit && !isGldb

  // Validation: user channel account number, ≥1 currency, client identity present.
  const valid = !!(
    form.user_channel_account_number.trim() &&
    form.currency.length > 0 &&
    form.client_name.trim() &&
    form.participant_code.trim()
  )

  const channelOpts     = CHANNEL_OPTIONS.map(c => ({ value: c, label: c }))
  const accountTypeOpts = ACCOUNT_TYPE_OPTIONS.map(a => ({ value: a, label: t(`channelAccount.accountType.${a}`) }))

  const buildBank = () => ({
    bank_name: form.bank_name.trim(), account_number: form.bank_account.trim(),
    swift_code: form.bank_swift.trim(), country_code: form.bank_country.trim(), bank_address: form.bank_address.trim(),
  })

  const handleSubmit = () => {
    if (!valid) return
    if (isEdit) {
      update.mutateAsync({
        id: account.id,
        user_channel_account_number: isGldb ? form.user_channel_account_number.trim() : undefined,
        channel_account_number: isGldb ? form.channel_account_number.trim() : undefined,
        currency: form.currency,
        bank_details: buildBank(),
        intermediary_bank: account.intermediary_bank,
      })
        .then(() => { toast.show(t('channelAccount.toast.updated')); onClose() })
        .catch(e => toast.show(e?.message || 'Update failed'))
    } else {
      create.mutateAsync({
        payment_channel: form.payment_channel,
        user_channel_account_number: form.user_channel_account_number.trim(),
        channel_account_number: form.channel_account_number.trim(),
        account_type: form.account_type,
        currency: form.currency,
        mapping_status: 'active',
        client_name: form.client_name.trim(),
        participant_code: form.participant_code.trim() || null,
        bank_details: buildBank(),
        intermediary_bank: null,
      })
        .then(() => { toast.show(t('channelAccount.toast.created')); onClose() })
        .catch(e => toast.show(e?.message || 'Create failed'))
    }
  }

  const ro = 'bg-(--disabled-surface) text-(--disabled-text)'

  return (
    <CdsModal
      open={open}
      onClose={onClose}
      size="xl"
      headerMode="close"
      title={isEdit ? t('channelAccount.form.editTitle') : t('channelAccount.form.addTitle')}
      footer={[
        {
          label: isEdit ? t('common.save') : t('channelAccount.form.create'),
          variant: 'primary',
          onClick: handleSubmit,
          loading: create.isPending || update.isPending,
          disabled: !valid || create.isPending || update.isPending,
        },
        { label: t('common.cancel'), onClick: onClose },
      ]}
      dismissOnBackdrop
    >
      <div className="flex flex-col gap-5">
        {/* Client identity — at the top (no heading) */}
        <section>
          <ClientPicker form={form} set={set} locked={isEdit} t={t} />
        </section>

        {/* Channel account + bank details */}
        <section>
          <div className="type-body-sm font-semibold text-(--text) mb-2.5">{t('channelAccount.detail.mapping')}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label={t('channelAccount.col.channel')} required>
              <CdsStackedListbox size="md" buttonWidthClass="w-full"
                value={form.payment_channel}
                onChange={isEdit ? undefined : (v) => set({ payment_channel: v })}
                options={channelOpts} />
            </Field>
            <Field label={t('channelAccount.col.accountType')} required>
              <CdsStackedListbox size="md" buttonWidthClass="w-full"
                value={form.account_type}
                onChange={isEdit ? undefined : (v) => set({ account_type: v })}
                options={accountTypeOpts} />
            </Field>
            <Field label={t('channelAccount.col.userChannelAccountNumber')} required
              hint={userAcctReadOnly ? t('channelAccount.form.nonGldbReadOnly') : undefined}>
              <CdsInput size="md" value={form.user_channel_account_number}
                onChange={e => set({ user_channel_account_number: e.target.value })}
                disabled={userAcctReadOnly} className={userAcctReadOnly ? ro : ''} placeholder="…" />
            </Field>
            <Field label={t('channelAccount.col.channelAccountNumber')}
              hint={internalReadOnly ? t('channelAccount.form.nonGldbReadOnly') : undefined}>
              <CdsInput size="md" value={form.channel_account_number}
                onChange={e => set({ channel_account_number: e.target.value })}
                disabled={internalReadOnly} className={internalReadOnly ? ro : ''} placeholder="GLDB-8800-…" />
            </Field>
            <Field label={t('channelAccount.col.currency')} required>
              <CurrencyMultiSelect value={form.currency} onChange={(v) => set({ currency: v })} t={t} />
            </Field>
            {isEdit && (
              <Field label={t('channelAccount.col.referenceCode')} hint={t('channelAccount.form.refCodeHint')}>
                <CdsInput size="md" value={account.reference_code ?? '—'} disabled className={ro} />
              </Field>
            )}
          </div>

          {/* Bank details — part of the channel account, no separate heading */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-3">
            <Field label={t('channelAccount.bank.bankName')}>
              <CdsInput size="md" value={form.bank_name} onChange={e => set({ bank_name: e.target.value })} />
            </Field>
            <Field label={t('channelAccount.bank.accountNumber')}>
              <CdsInput size="md" value={form.bank_account} onChange={e => set({ bank_account: e.target.value })} />
            </Field>
            <Field label={t('channelAccount.bank.swiftCode')}>
              <CdsInput size="md" value={form.bank_swift} onChange={e => set({ bank_swift: e.target.value })} />
            </Field>
            <Field label={t('channelAccount.bank.countryCode')}>
              <CdsInput size="md" value={form.bank_country} onChange={e => set({ bank_country: e.target.value })} />
            </Field>
            <div className="col-span-2">
              <Field label={t('channelAccount.bank.bankAddress')}>
                <CdsInput size="md" value={form.bank_address} onChange={e => set({ bank_address: e.target.value })} />
              </Field>
            </div>
          </div>
        </section>
      </div>
    </CdsModal>
  )
}
