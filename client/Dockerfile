FROM node:20-bookworm-slim AS base

WORKDIR /app

# Dependencies Stage
FROM base AS dependencies
COPY package*.json ./
RUN npm ci

# Build Stage
FROM dependencies AS build
COPY tsconfig.json next.config.js ./
COPY public ./public/
COPY src ./src/
ENV NODE_ENV=production
RUN npm run build

# Production Runner Stage
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY public ./public/
COPY --from=build /app/.next ./.next
COPY next.config.js ./

EXPOSE 3000

CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
