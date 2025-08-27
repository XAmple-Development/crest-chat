// Simple logger utility for development vs production
const isDev = import.meta.env.DEV

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args)
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args)
  },
  error: (...args: any[]) => {
    console.error(...args) // Always log errors
  },
  info: (...args: any[]) => {
    if (isDev) console.info(...args)
  }
}