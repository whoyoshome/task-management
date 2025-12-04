FROM node:24-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx nx build auth-microservice

CMD ["node", "dist/apps/auth-microservice/main.js"]
