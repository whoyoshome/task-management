FROM node:24-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx nx build api-gateway

CMD ["node", "dist/apps/api-gateway/main.js"]
