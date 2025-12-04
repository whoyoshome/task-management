# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Allow overriding Vite envs at build time
ARG VITE_API_URL
ARG VITE_MIDDLEWARE
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_MIDDLEWARE=${VITE_MIDDLEWARE}

# Build the client app
RUN npx nx build client-app

# Runtime stage (nginx)
FROM nginx:alpine AS runtime
COPY apps/client-app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/apps/client-app /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
