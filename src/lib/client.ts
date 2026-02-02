import { treaty } from '@elysiajs/eden'
import type { App } from '../app/api/[[...slugs]]/route'


// .api to enter /api prefix
export const client = treaty<App>(process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://treaty.vercel.app/api").api
    

