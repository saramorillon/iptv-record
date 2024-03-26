import Ffmpeg from 'fluent-ffmpeg'
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
  res.setHeader('content-disposition', `attachment; filename="${req.params.id.replace('.ts', '.mp4')}"`)

  const command = Ffmpeg()

  res.on('close', () => {
    command.kill('SIGKILL')
  })

  try {
    await new Promise<void>((resolve, reject) => {
      command
        .input(tsPath)
        .addOutputOptions('-movflags +frag_keyframe+separate_moof+omit_tfhd_offset+empty_moov')
        .format('mp4')

      command.on('progress', (progress) => {
        console.log(`Converting ${req.params.id}: ${progress.percent.toFixed(2)}%`)
      })

      command.on('error', (error) => {
        if (error.message.includes('SIGKILL')) {
          resolve()
        } else {
          reject()
        }
      })

      command.on('end', () => {
        resolve()
      })

      command.pipe(res)
    })

    res.statusCode = 201
    res.end()
  } catch (error) {
    res.statusCode = 500
    res.end()
  }
}
