# Dev only: runs the TypeScript seed scripts with ts-node, so it keeps the
# full workspace and dev dependencies.
FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

USER node

CMD ["npx", "ts-node", "--project", "tsconfig.seed.json", "tools/seed-all.ts"]
