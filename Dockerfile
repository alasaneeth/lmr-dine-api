FROM node:20-alpine AS base
WORKDIR /app

# ── Install deps ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# ── Build stage ───────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -S rms && adduser -S rms -G rms

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create upload & log dirs with correct ownership
RUN mkdir -p uploads/menu logs && chown -R rms:rms /app

USER rms

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1

CMD ["node", "server.js"]
