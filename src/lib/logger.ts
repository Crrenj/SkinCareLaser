const isProd = process.env.NODE_ENV === 'production'

function formatArgs(args: unknown[]): unknown[] {
  if (!isProd) return args
  return args.map((a) =>
    a instanceof Error ? { message: a.message, stack: a.stack } : a,
  )
}

export const logger = {
  error(...args: unknown[]) {
    console.error(...formatArgs(args))
  },
  warn(...args: unknown[]) {
    console.warn(...formatArgs(args))
  },
  info(...args: unknown[]) {
    if (!isProd) console.log(...args)
  },
}
