# Image for the Node services (api-gateway and the microservices). Build it
# from the repository root with the app name as an argument:
#   docker build -f docker/node-service/Dockerfile --build-arg APP=api-gateway .
ARG NODE_VERSION=24

# Build stage: full workspace and dev dependencies, used only to compile.
FROM node:${NODE_VERSION}-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG APP
RUN test -n "$APP" && npx nx build "$APP"

# Runtime stage: the compiled bundle plus production dependencies only. They
# come from the root lockfile rather than the one Nx generates per app,
# because Nx drops packages pinned through "overrides" when it prunes it.
FROM node:${NODE_VERSION}-slim AS runtime
ARG APP
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist/apps/${APP} ./dist

# The gateway writes its log files under ./logs.
RUN mkdir logs && chown node:node logs
USER node

CMD ["node", "dist/main.js"]
