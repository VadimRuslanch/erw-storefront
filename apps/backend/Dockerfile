FROM node:20-alpine AS builder

WORKDIR /repo

RUN apk add --no-cache libc6-compat python3 make g++ \
  && corepack enable

COPY . .

RUN pnpm install --frozen-lockfile

ARG MEDUSA_BACKEND_URL
ARG MEDUSA_STOREFRONT_URL
ARG STORE_CORS
ARG ADMIN_CORS
ARG AUTH_CORS

ENV MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL
ENV MEDUSA_STOREFRONT_URL=$MEDUSA_STOREFRONT_URL
ENV STORE_CORS=$STORE_CORS
ENV ADMIN_CORS=$ADMIN_CORS
ENV AUTH_CORS=$AUTH_CORS

# Build-time dummy values. Runtime values come from docker-compose env.
ENV DATABASE_URL=postgres://medusa:medusa@localhost:5432/medusa
ENV REDIS_URL=redis://localhost:6379
ENV JWT_SECRET=buildtime
ENV COOKIE_SECRET=buildtime
ENV DISABLE_MEDUSA_ADMIN=false
ENV MEDUSA_WORKER_MODE=server

RUN pnpm --dir apps/backend build


FROM node:20-alpine AS runner

WORKDIR /server

RUN apk add --no-cache libc6-compat \
  && corepack enable

COPY --from=builder /repo/apps/backend/.medusa/server ./

RUN pnpm install --prod --frozen-lockfile || pnpm install --prod

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=9000

EXPOSE 9000

CMD ["pnpm", "start"]
