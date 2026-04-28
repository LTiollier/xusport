# syntax=docker/dockerfile:1.7
# Multi-stage Dockerfile for the XuSport Next.js frontend.
# `deps`    — installs node_modules (used by docker-compose dev mode)
# `builder` — produces a production build
# `runner`  — minimal runtime image serving `next start`

FROM node:22-alpine AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json* ./
RUN npm ci

FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
COPY --from=builder --chown=nextjs:nextjs /app/.next ./.next
COPY --from=builder --chown=nextjs:nextjs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nextjs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nextjs /app/next.config.js ./next.config.js
USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]
