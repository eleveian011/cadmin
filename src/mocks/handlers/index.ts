import { depositOrderHandlers } from './deposit-orders'
import { exportHandlers } from './export'
import { taskHandlers } from './tasks'

export const handlers = [
  ...depositOrderHandlers,
  ...exportHandlers,
  ...taskHandlers,
]
