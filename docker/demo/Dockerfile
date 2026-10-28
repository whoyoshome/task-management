# Single-container backend for the free public demo (see docs/DEPLOYMENT.md):
# the gateway and the three microservices in one image, run by start.js.
# Local and production setups use docker/node-service/Dockerfile instead,
# one container per service.
ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx nx run-many -t build -p api-gateway auth-microservice user-microservice task-microservice

FROM node:${NODE_VERSION}-slim AS runtime
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist/apps ./dist
COPY docker/demo/start.js docker/demo/database-url.js ./

# The microservices only listen on loopback: their TCP commands are not
# authenticated, and only the gateway's $PORT may be reachable.
ENV MS_BIND_HOST=127.0.0.1 \
    USER_MS_HOST=127.0.0.1 USER_MS_PORT=4001 \
    TASK_MS_HOST=127.0.0.1 TASK_MS_PORT=4002 \
    AUTH_MS_HOST=127.0.0.1 AUTH_MS_PORT=4003

# The gateway writes its log files under ./logs.
RUN mkdir logs && chown node:node logs
USER node

CMD ["node", "start.js"]
