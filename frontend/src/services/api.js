/**
 * The one place the app picks its data source.
 *   default            -> the real API (see httpApi.js), reached at VITE_API_URL or the /api dev proxy
 *   VITE_USE_MOCK=true -> the offline localStorage mock (see mockApi.js), handy for demos without a server
 */
import { httpApi } from './httpApi.js'
import { mockApi } from './mockApi.js'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
export const api = USE_MOCK ? mockApi : httpApi
