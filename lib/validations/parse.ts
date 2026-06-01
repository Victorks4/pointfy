import { z, type ZodSchema } from 'zod'
import { formatZodError } from '@/lib/server/action-result'

export function parseInput<T>(schema: ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new Error(formatZodError(result.error))
  }
  return result.data
}

export const uuidSchema = z.string().uuid('ID inválido')
