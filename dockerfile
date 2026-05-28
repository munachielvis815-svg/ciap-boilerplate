FROM node:lts-alpine AS base

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY workers/package.json ./workers/package.json
RUN pnpm install --frozen-lockfile

COPY . .

FROM base AS backend-build
RUN pnpm run build:backend

FROM base AS worker-build
RUN pnpm run build:workers

FROM node:lts-alpine AS backend-runtime

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY workers/package.json ./workers/package.json
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=backend-build /app/dist ./dist

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs \
	&& adduser -S nodejs -u 1001 \
	&& chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]

FROM node:lts-alpine AS worker-runtime

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY workers/package.json ./workers/package.json
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=worker-build /app/workers/dist ./workers/dist
COPY --from=worker-build /app/workers/package.json ./workers/package.json
COPY --from=worker-build /app/workers/register-paths.cjs ./workers/register-paths.cjs

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs \
	&& adduser -S nodejs -u 1001 \
	&& chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

CMD ["pnpm", "--dir", "workers", "run", "start"]
