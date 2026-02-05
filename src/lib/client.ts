import { treaty } from '@elysiajs/eden'
import type { App } from '../app/api/[[...slugs]]/route'

const apiBase =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

// .api to enter /api prefix
export const client = treaty<App>(apiBase).api
