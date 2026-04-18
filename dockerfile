FROM node:lts-alpine

WORKDIR /app

# Enable pnpm via Corepack (pinned version for reproducible builds).
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Copy dependency manifests first for Docker layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

RUN set -x && pnpm install --frozen-lockfile

# Copy source code after dependencies are installed.
COPY . .

# Ensure runtime log directory exists for file logging mode.
RUN mkdir -p logs

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start:prod"]
