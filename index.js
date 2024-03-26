import { cleanEnv, num, str, url } from 'envalid'
import FfmpegCommand from 'fluent-ffmpeg'
import { createWriteStream } from 'node:fs'
import { mkdir, unlink } from 'node:fs/promises'
import http from 'node:http'
import { join } from 'node:path'
import { createInterface } from 'node:readline'

const env = cleanEnv(process.env, {
  INTERVAL: num({ default: 99000 }),
  DURATION: num({ default: 3600000 }),
  OUT_DIR: str({ default: 'out' }),
  BASE_URL: url(),
  M3U8_PATH: str(),
})

const now = new Date().toISOString().replace(/:|T|Z/g, '_').slice(0, -5)
const start = Date.now()
const tsPath = join(env.OUT_DIR, `${now}.ts`)
const mp4Path = join(env.OUT_DIR, `${now}.mp4`)
const output = createWriteStream(tsPath)

class Queue {
  constructor() {
    this.ended = false
    this.urls = []
    this.processedUrls = []
    this.processing = false
  }

  async add(url) {
    this.urls.push(url)
    await this.update()
  }

  async update() {
    if (!this.processing) {
      this.processing = true

      const url = this.urls.shift()
      if (url && !this.processedUrls.includes(url)) {
        await this.processUrl(url)
      }

      this.processing = false

      if (this.urls.length) {
        await this.update()
      } else if (this.ended) {
        console.log('Bye!')
        output.close()
        new FfmpegCommand()
          .input(tsPath)
          .save(mp4Path)
          .on('end', async () => {
            await unlink(tsPath)
            process.exit()
          })
      }
    }
  }

  async processUrl(url) {
    console.log(`Processing ${url}`)
    await new Promise((resolve) => {
      http.get(new URL(url, env.BASE_URL), (video) => {
        video
          .on('data', (chunk) => output.write(chunk))
          .on('error', console.error)
          .on('end', () => {
            this.processedUrls.push(url)
            resolve()
          })
      })
    })
  }
}

const queue = new Queue()

function run() {
  if (Date.now() - start < env.DURATION) {
    console.log('Fetching fragments')
    http.get(new URL(env.M3U8_PATH, env.BASE_URL), async (playlist) => {
      for await (const url of createInterface(playlist)) {
        if (url && !url.startsWith('#')) {
          void queue.add(url)
        }
      }
    })
    setTimeout(run, env.INTERVAL)
  } else {
    queue.ended = true
  }
}

mkdir(env.OUT_DIR)
  .catch(() => false)
  .finally(run)
