import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import { env } from '../env.js'

export async function getRecord(req: IncomingMessage, res: ServerResponse) {
  const tsPath = join(env.OUT_DIR, req.params.id)

  const exists = await stat(tsPath)
    .then(() => true)
    .catch(() => false)

  if (!exists) {
    res.statusCode = 404
    res.end()
    return
  }

  res.setHeader('content-type', 'application/octet-stream')
  res.setHeader('content-disposition', `attachment; filename="${req.params.id}"`)
  await new Promise<void>((resolve) => createReadStream(tsPath).pipe(res).on('end', resolve))
}
