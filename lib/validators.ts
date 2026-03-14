import { z } from 'zod'
import { isReserved } from '@/lib/alias'

const MAX_CONTENT_SIZE = 1_048_576 // 1MB

const AliasSchema = z
  .string()
  .min(1, 'Alias is required')
  .max(50, 'Alias must be 50 characters or less')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Only lowercase letters, numbers, and hyphens (no leading/trailing hyphens)'
  )
  .refine((val) => !isReserved(val), { message: 'This alias is reserved' })

export const CreatePasteSchema = z.object({
  title: z.string().max(200, 'Title must be 200 characters or less').default('Untitled'),
  content: z
    .string()
    .min(1, 'Content is required')
    .refine((val) => val.trim().length > 0, { message: 'Content cannot be only whitespace' })
    .refine((val) => new TextEncoder().encode(val).length <= MAX_CONTENT_SIZE, {
      message: 'Content exceeds 1MB limit',
    }),
  language: z.string().max(50).default('text'),
  alias: AliasSchema.optional(),
  visibility: z.enum(['public', 'unlisted', 'private', 'password']),
  password: z.string().min(4, 'Password must be at least 4 characters').max(100).optional(),
  burn_after_reading: z.boolean().default(false),
  forked_from: z.string().uuid().optional(),
  expiry: z.enum(['1h', '1d', '7d', '30d', 'never']),
}).refine(data => data.visibility !== 'password' || (data.password && data.password.length > 0), {
  message: "Password is required when visibility is set to 'password'",
  path: ['password']
})

export const UpdatePasteSchema = z.object({
  title: z.string().max(200).optional(),
  content: z
    .string()
    .min(1)
    .refine((val) => val.trim().length > 0, { message: 'Content cannot be only whitespace' })
    .refine((val) => new TextEncoder().encode(val).length <= MAX_CONTENT_SIZE, {
      message: 'Content exceeds 1MB limit',
    })
    .optional(),
  language: z.string().max(50).optional(),
  visibility: z.enum(['public', 'unlisted', 'private', 'password']).optional(),
  password: z.string().min(4).max(100).optional(),
})

export type CreatePasteInput = z.infer<typeof CreatePasteSchema>
export type UpdatePasteInput = z.infer<typeof UpdatePasteSchema>
