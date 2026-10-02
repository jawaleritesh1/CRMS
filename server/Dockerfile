FROM node:20-bookworm-slim AS base

# Install OpenSSL and necessary system libraries for Prisma and Argon2
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies Stage
FROM base AS dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Build Stage
FROM dependencies AS build
COPY tsconfig.json ./
COPY src ./src/
RUN npx prisma generate
RUN npm run build

# Production Runner Stage
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npm install -g tsx
RUN npx prisma generate

COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
