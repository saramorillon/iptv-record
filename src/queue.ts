import { createWriteStream, type WriteStream } from 'node:fs'
import http from 'node:http'
import { createInterface } from 'node:readline'

interface IQueueOptions {
  tsPath: string
  duration: number
  interval: number
  m3u8Path: string
  baseUrl: string
}

export class Queue {
  private ended = false
  private urls: string[] = []
  private processedUrls: string[] = []
  private processing = false
  private output: WriteStream
  private startTime = Date.now()

  constructor(private options: IQueueOptions) {
    this.output = createWriteStream(this.options.tsPath)
  }

  async add(url: string) {
    this.urls.push(url)
    await this.update()
  }

  async start() {
    if (Date.now() - this.startTime < this.options.duration) {
      console.log('Fetching fragments')
      http.get(new URL(this.options.m3u8Path, this.options.baseUrl), async (playlist) => {
        for await (const url of createInterface(playlist)) {
          if (url && !url.startsWith('#')) {
            void this.add(url)
          }
        }
      })
      setTimeout(this.start.bind(this), this.options.interval)
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
      http.get(new URL(url, this.options.baseUrl), (video) => {
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
