FROM node:lts-alpine

WORKDIR /app

# Enable pnpm via Corepack (pinned version for reproducible builds).
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Copy dependency manifests first for Docker layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

RUN set -x && pnpm install --frozen-lockfile

# Keep local env path available for bind mount usage.
RUN touch .env

# Copy source code after dependencies are installed.
COPY . .

# Ensure runtime log directory exists for file logging mode.
RUN mkdir -p logs

# Generate Drizzle artifacts required by runtime startup flow.
# Skip in containerized environments where database is external.
# If db:generate fails, the app will still start (assumes migrations are current).
RUN pnpm run db:generate || echo "Warning: db:generate skipped (database may not be available)"

EXPOSE 3000

CMD ["pnpm", "start:dev"]
