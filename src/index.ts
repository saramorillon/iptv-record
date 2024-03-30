import { Router, parseJsonBody } from '@saramorillon/http-router'
import { mkdir } from 'node:fs/promises'
import http, { type IncomingMessage, type ServerResponse } from 'node:http'
import { deleteRecord } from './controllers/deleteRecord.js'
import { getRecord } from './controllers/getRecord.js'
import { listRecords } from './controllers/listRecords.js'
import { record } from './controllers/record.js'
import { env } from './env.js'

const router = new Router(env.PROTOCOL)

router.get('/records', listRecords)
router.get('/record/:id', getRecord)
router.post('/record', parseJsonBody, record)
router.delete('/record/:id', deleteRecord)

const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  router.listen(req, res)
})

mkdir(env.OUT_DIR)
  .catch(() => false)
  .finally(() => server.listen(3000, () => console.log('Listening')))
