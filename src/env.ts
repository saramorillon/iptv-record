import { z } from 'zod'

export const env = z
  .object({
    PROTOCOL: z.string().optional().default('https'),
    OUT_DIR: z.string().optional().default('out'),
  })
  .parse(process.env)
