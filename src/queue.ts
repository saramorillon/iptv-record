import { createWriteStream, type WriteStream } from 'node:fs'
import http from 'node:http'
import { createInterface } from 'node:readline'
import { env } from './env.js'

export class Queue {
  private ended = false
  private urls: string[] = []
  private processedUrls: string[] = []
  private processing = false
  private output: WriteStream
  private startTime = Date.now()

  constructor(tsPath: string) {
    this.output = createWriteStream(tsPath)
  }

  async add(url: string) {
    this.urls.push(url)
    await this.update()
  }

  async start() {
    if (Date.now() - this.startTime < env.DURATION) {
      console.log('Fetching fragments')
      http.get(new URL(env.M3U8_PATH, env.BASE_URL), async (playlist) => {
        for await (const url of createInterface(playlist)) {
          if (url && !url.startsWith('#')) {
            void this.add(url)
          }
        }
      })
      setTimeout(this.start.bind(this), env.INTERVAL)
    } else {
      if (this.urls.length) {
        this.ended = true
      } else {
        this.end()
      }
    }
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
        this.end()
      }
    }
  }

  async processUrl(url: string) {
    console.log(`Processing ${url}`)
    await new Promise<void>((resolve) => {
      http.get(new URL(url, env.BASE_URL), (video) => {
        video
          .on('data', (chunk) => this.output.write(chunk))
          .on('error', console.error)
          .on('end', () => {
            this.processedUrls.push(url)
            resolve()
          })
      })
    })
  }

  end() {
    console.log('Closing output stream')
    this.output.close()
  }
}
