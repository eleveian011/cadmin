import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '../_client'

export interface ExportParams {
  type:    string
  filters: Record<string, string>
}

export interface ExportResult {
  job_id:       string
  download_url: string
  filename:     string
}

export function useExport() {
  return useMutation({
    mutationFn: (params: ExportParams) =>
      apiFetch<ExportResult>('/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }),
  })
}
