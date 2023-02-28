FROM node:18.13.0

ENV PORT=3000
EXPOSE 3000

WORKDIR /app

COPY . .

RUN corepack enable
RUN yarn install
RUN yarn build

ENV NODE_ENV=production

CMD [ "sh", "-c", "yarn start" ]
