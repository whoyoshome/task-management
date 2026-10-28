FROM node:24-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npx", "ts-node", "--project", "tsconfig.seed.json", "tools/seed-all.ts"]
