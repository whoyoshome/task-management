# Build stage
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Allow overriding Vite envs at build time
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npx nx build client-app

# Runtime stage: nginx running as a non-root user, so it listens on 8080.
FROM nginxinc/nginx-unprivileged:alpine AS runtime
COPY apps/client-app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/apps/client-app /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
