// @ts-nocheck
import { useState, useEffect } from 'react'
import {
  CdsModal, CdsInput, CdsStackedListbox, useToast,
} from '../../../components/cds'
import { useCreateChannelAccount, useUpdateChannelAccount } from '../../../services/hooks'
import { CHANNEL_OPTIONS, ACCOUNT_TYPE_OPTIONS } from './helpers'

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

const EMPTY = {
  payment_channel: 'GLDB',
  channel_account_number: '',
  mca_account_number: '',
  account_type: 'fiat',
  currency: '',
  client_name: '',
  participant_code: '',
  member_id: '',
  // bank info
  ben_name: '', ben_address: '', ben_country: '',
  bank_name: '', bank_account: '', bank_swift: '', bank_country: '', bank_address: '',
}

/**
 * Add / Edit entry modal (§7.4 Operations).
 * - Add: all fields editable except Reference Code (system-generated).
 * - Edit: GLDB → channel account number + MCA number editable; non-GLDB → both read-only.
 *   Client identity fields (name, participant code, member id, statuses) are always
 *   read-only after creation.
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
        channel_account_number: account.channel_account_number,
        mca_account_number: account.mca_account_number,
        account_type: account.account_type,
        currency: account.currency,
        client_name: account.client_name,
        participant_code: account.participant_code ?? '',
        member_id: account.member_id ?? '',
        ben_name: account.beneficiary.name,
        ben_address: account.beneficiary.address,
        ben_country: account.beneficiary.country,
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
  // Edit: channel account number editable only for GLDB; MCA number editable only for GLDB.
  const channelAcctReadOnly = isEdit && !isGldb
  const mcaReadOnly         = isEdit && !isGldb
  // Client identity is read-only on edit (auto-populated from CAMP).
  const identityReadOnly    = isEdit

  // Validation: at least one client identifier; key mapping fields present.
  const hasIdentity = !!(form.participant_code.trim() || form.member_id.trim())
  const valid = !!(
    form.channel_account_number.trim() &&
    form.mca_account_number.trim() &&
    form.currency.trim() &&
    form.client_name.trim() &&
    hasIdentity
  )

  const channelOpts     = CHANNEL_OPTIONS.map(c => ({ value: c, label: c }))
  const accountTypeOpts = ACCOUNT_TYPE_OPTIONS.map(a => ({ value: a, label: t(`channelAccount.accountType.${a}`) }))

  const buildBank = () => ({
    beneficiary:  { name: form.ben_name.trim(), address: form.ben_address.trim() || '—', country: form.ben_country.trim() || '—' },
    bank_details: {
      bank_name: form.bank_name.trim(), account_number: form.bank_account.trim(),
      swift_code: form.bank_swift.trim(), country_code: form.bank_country.trim(), bank_address: form.bank_address.trim(),
    },
  })

  const handleSubmit = () => {
    if (!valid) return
    if (isEdit) {
      const bank = buildBank()
      update.mutateAsync({
        id: account.id,
        channel_account_number: isGldb ? form.channel_account_number.trim() : undefined,
        mca_account_number:     isGldb ? form.mca_account_number.trim() : undefined,
        beneficiary:  bank.beneficiary,
        bank_details: bank.bank_details,
        intermediary_bank: account.intermediary_bank,
      })
        .then(() => { toast.show(t('channelAccount.toast.updated')); onClose() })
        .catch(e => toast.show(e?.message || 'Update failed'))
    } else {
      const bank = buildBank()
      create.mutateAsync({
        payment_channel: form.payment_channel,
        channel_account_number: form.channel_account_number.trim(),
        mca_account_number: form.mca_account_number.trim(),
        account_type: form.account_type,
        currency: form.currency.trim(),
        mapping_status: 'active',
        client_name: form.client_name.trim(),
        participant_code: form.participant_code.trim() || null,
        member_id: form.member_id.trim() || null,
        beneficiary:  bank.beneficiary,
        bank_details: bank.bank_details,
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
        {/* Mapping */}
        <section>
          <div className="type-body-sm font-semibold text-(--text) mb-2.5">{t('channelAccount.detail.mapping')}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label={t('channelAccount.col.channel')} required>
              <CdsStackedListbox
                size="md" buttonWidthClass="w-full"
                value={form.payment_channel}
                onChange={isEdit ? undefined : (v) => set({ payment_channel: v })}
                options={channelOpts}
              />
            </Field>
            <Field label={t('channelAccount.col.accountType')} required>
              <CdsStackedListbox
                size="md" buttonWidthClass="w-full"
                value={form.account_type}
                onChange={isEdit ? undefined : (v) => set({ account_type: v })}
                options={accountTypeOpts}
              />
            </Field>
            <Field label={t('channelAccount.col.channelAccountNumber')} required
              hint={channelAcctReadOnly ? t('channelAccount.form.nonGldbReadOnly') : undefined}>
              <CdsInput
                size="md" value={form.channel_account_number}
                onChange={e => set({ channel_account_number: e.target.value })}
                disabled={channelAcctReadOnly}
                className={channelAcctReadOnly ? ro : ''}
                placeholder="GLDB-8800-…"
              />
            </Field>
            <Field label={t('channelAccount.col.mcaAccountNumber')} required
              hint={mcaReadOnly ? t('channelAccount.form.nonGldbReadOnly') : undefined}>
              <CdsInput
                size="md" value={form.mca_account_number}
                onChange={e => set({ mca_account_number: e.target.value })}
                disabled={mcaReadOnly}
                className={mcaReadOnly ? ro : ''}
                placeholder="MCA-…"
              />
            </Field>
            <Field label={t('channelAccount.col.currency')} required>
              <CdsInput size="md" value={form.currency} onChange={e => set({ currency: e.target.value })} placeholder="SGD" />
            </Field>
            {isEdit && (
              <Field label={t('channelAccount.col.referenceCode')} hint={t('channelAccount.form.refCodeHint')}>
                <CdsInput size="md" value={account.reference_code ?? '—'} disabled className={ro} />
              </Field>
            )}
          </div>
        </section>

        {/* Client identity */}
        <section>
          <div className="type-body-sm font-semibold text-(--text) mb-1">{t('channelAccount.detail.client')}</div>
          <p className="type-caption text-(--subtle) mb-2.5">
            {identityReadOnly ? t('channelAccount.form.identityReadOnly') : t('channelAccount.form.identityHint')}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label={t('channelAccount.col.clientName')} required>
              <CdsInput size="md" value={form.client_name} onChange={e => set({ client_name: e.target.value })}
                disabled={identityReadOnly} className={identityReadOnly ? ro : ''} />
            </Field>
            <span />
            <Field label={t('channelAccount.col.participantCode')}>
              <CdsInput size="md" value={form.participant_code} onChange={e => set({ participant_code: e.target.value })}
                disabled={identityReadOnly} className={identityReadOnly ? ro : ''} placeholder="PART-…" />
            </Field>
            <Field label={t('channelAccount.col.memberId')}>
              <CdsInput size="md" value={form.member_id} onChange={e => set({ member_id: e.target.value })}
                disabled={identityReadOnly} className={identityReadOnly ? ro : ''} placeholder="MBR-…" />
            </Field>
          </div>
        </section>

        {/* Beneficiary */}
        <section>
          <div className="type-body-sm font-semibold text-(--text) mb-2.5">{t('channelAccount.bank.beneficiary')}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label={t('channelAccount.bank.beneficiaryName')}>
              <CdsInput size="md" value={form.ben_name} onChange={e => set({ ben_name: e.target.value })} />
            </Field>
            <Field label={t('channelAccount.bank.beneficiaryCountry')}>
              <CdsInput size="md" value={form.ben_country} onChange={e => set({ ben_country: e.target.value })} />
            </Field>
            <div className="col-span-2">
              <Field label={t('channelAccount.bank.beneficiaryAddress')}>
                <CdsInput size="md" value={form.ben_address} onChange={e => set({ ben_address: e.target.value })} />
              </Field>
            </div>
          </div>
        </section>

        {/* Bank details */}
        <section>
          <div className="type-body-sm font-semibold text-(--text) mb-2.5">{t('channelAccount.bank.bankDetails')}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
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
