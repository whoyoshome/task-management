FROM node:24-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx nx build task-microservice

CMD ["node", "dist/apps/task-microservice/main.js"]
