FROM node:18.13.0

ENV PORT=3000
EXPOSE 3000

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

RUN corepack enable
RUN yarn install

COPY . .

RUN yarn build

ENV NODE_ENV=production

CMD [ "sh", "-c", "yarn start" ]
