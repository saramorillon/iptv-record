import { readdir, unlink } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import { env } from '../env.js'

export async function deleteRecords(req: IncomingMessage, res: ServerResponse) {
  const files = await readdir(env.OUT_DIR)

  for (const file of files) {
    const tsPath = join(env.OUT_DIR, file)
    await unlink(tsPath)
  }

  res.statusCode = 204
  res.end()
}
