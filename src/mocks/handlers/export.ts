import { http, HttpResponse } from 'msw'

export const exportHandlers = [
  http.post('/api/v1/export', async ({ request }) => {
    const body = await request.json() as { type: string; filters: Record<string, string> }
    const filename = `export_${body.type}_${body.filters.from ?? 'all'}_${body.filters.to ?? 'now'}.csv`
    return HttpResponse.json({
      data: {
        job_id:       `job_${Date.now()}`,
        download_url: `data:text/csv;charset=utf-8,transaction_id%2Camount%2Cstatus%0ADP001%2C1000%2Csuccessful`,
        filename,
      },
    })
  }),
]
