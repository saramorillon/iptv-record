import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import { env } from '../env.js'
import { Queue } from '../queue.js'

export async function record(req: IncomingMessage, res: ServerResponse) {
  const now = new Date().toISOString().replace(/:|T|Z/g, '_').slice(0, -5)
  const tsPath = join(env.OUT_DIR, `${now}.ts`)

  const queue = new Queue(tsPath)
  void queue.start()

  res.statusCode = 201
  res.end()
}
