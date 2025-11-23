import { parse } from 'date-fns'

export const toUtcDate = (isoLike: string): Date => {
  const parsed = parse(isoLike, 'yyyy-MM-dd HH:mm:ss', new Date())
  // shift to UTC
  return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60 * 1000)
}