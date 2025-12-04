FROM node:24-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx nx build user-microservice

CMD ["node", "dist/apps/user-microservice/main.js"]
