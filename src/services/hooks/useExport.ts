import { useMutation } from '@tanstack/react-query'
import { exportData } from '../store'
import type { ExportParams, ExportResult } from '../store'

export type { ExportParams, ExportResult }

export function useExport() {
  return useMutation({
    mutationFn: exportData,
  })
}
