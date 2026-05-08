FROM node:lts-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Install build dependencies (includes devDependencies)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# Copy source and build once during image creation
COPY . .
RUN pnpm run build

FROM node:lts-alpine AS runtime

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Install production-only dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/dist ./dist

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs \
	&& adduser -S nodejs -u 1001 \
	&& chown -R nodejs:nodejs /app

USER nodejs

# Expose app port
EXPOSE 3000

# Run the prebuilt app instead of recompiling on container start
CMD ["pnpm", "run", "start:prod"]
