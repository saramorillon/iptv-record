FROM node:20-alpine

RUN apk update && apk add ffmpeg

WORKDIR /app

COPY yarn.lock .
COPY package.json .

RUN yarn install --frozen-lockfile --production --ignore-scripts

COPY index.js .

CMD ["node", "index.js"]