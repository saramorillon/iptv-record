import { cleanEnv, num, str, url } from 'envalid'

export const env = cleanEnv(process.env, {
  INTERVAL: num({ default: 99000 }),
  DURATION: num({ default: 3600000 }),
  OUT_DIR: str({ default: 'out' }),
  BASE_URL: url(),
  M3U8_PATH: str(),
})
