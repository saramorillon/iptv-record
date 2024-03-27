import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import { z } from 'zod'
import { env } from '../env.js'
import { Queue } from '../queue.js'

const schema = z.object({
  baseUrl: z.string().url(),
  m3u8Path: z.string(),
  duration: z.number(),
  interval: z.number(),
})

export async function record(req: IncomingMessage, res: ServerResponse) {
  const body = schema.parse(req.body)

  const now = new Date().toISOString().replace(/:|T|Z/g, '_').slice(0, -5)
  const tsPath = join(env.OUT_DIR, `${now}.ts`)

  const queue = new Queue({ ...body, tsPath })
  void queue.start()

  res.statusCode = 201
  res.end()
}
