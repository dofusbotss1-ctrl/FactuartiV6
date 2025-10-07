// filepath: src/config/app.ts
export const CASE_INSENSITIVE_COMPANY_NAMES: boolean =
  (import.meta.env.VITE_CASE_INSENSITIVE_COMPANY_NAMES ?? 'true').toString().toLowerCase() === 'true';
