import { readdir, stat } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import prettyBytes from 'pretty-bytes'
import { env } from '../env.js'

export async function listRecords(req: IncomingMessage, res: ServerResponse) {
  const files = await readdir(env.OUT_DIR)
  const result = []
  for (const file of files) {
    const { size } = await stat(join(env.OUT_DIR, file))
    result.push({ name: file, size: prettyBytes(size), href: new URL(`record/${file}`, req.baseUrl) })
  }
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(result))
}
