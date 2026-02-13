FROM node:22-bookworm-slim AS base
RUN apt update
# RUN apt install libc6-compat
# RUN apt install openssl-dev
# turbo

FROM base AS installer

# Set working directory
WORKDIR /app

RUN npm i -g turbo pnpm
COPY . .

RUN npm i -g pnpm 
RUN CI=true pnpm i
RUN npx turbo prune "saleor-app-products-feed" --docker 
RUN npx turbo build --filter="saleor-app-products-feed"


# Generate a partial monorepo with a pruned lockfile for a target workspace.
# Assuming "TARGET_APP" is the name entered in the project's package.json: { name: "TARGET_APP" }

# Add lockfile and package.json's of isolated subworkspace
# FROM base AS installer
#
# ARG APP_DIR
# ARG APP_NAME
#
# WORKDIR /app
#
# # First install the dependencies (as they change less often)
# COPY .gitignore .gitignore
# COPY --from=builder /app/out/json/ .
# RUN pnpm i
#
# # Build the project
#
# COPY --from=builder /app/ .
#
#
FROM base AS runner

ARG APP_DIR
ARG APP_NAME
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# COPY --from=installer /app/apps/products-feed/next.config.js .
# COPY --from=installer /app/apps/products-feed/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/products-feed/.next/standalone .
COPY --from=installer --chown=nextjs:nodejs /app/apps/products-feed/.next/static ./apps/products-feed/.next/static
# COPY --from=installer --chown=nextjs:nodejs /app/apps/products-feed/.next/standalone ./
# COPY --from=installer --chown=nextjs:nodejs /app/apps/products-feed/.next/static ./apps/products-feed/.next/static
# COPY --from=installer --chown=nextjs:nodejs /app/apps/products-feed/public ./apps/products-feed/public
# COPY --from=installer --chown=nextjs:nodejs /app/node_modules ./node_modules
# COPY --from=installer --chown=nextjs:nodejs /app/node_modules/next/dist/server/future/route-modules ./node_modules/next/dist/server/future/route-modules
# COPY --from=installer --chown=nextjs:nodejs /app/node_modules/next/dist/compiled/next-server ./node_modules/next/dist/compiled/next-server
# COPY --from=installer --chown=nextjs:nodejs /app/node_modules/next/dist/compiled/next-server ./node_modules/next/dist/compiled/next-server
# COPY --from=installer --chown=nextjs:nodejs /app/node_modules/react/jsx-runtime ./node_modules/react/jsx-runtime

WORKDIR /app/apps/products-feed

CMD HOSTNAME="0.0.0.0" node server.js
ARG SERVICE
ARG TITLE
ARG DESC
ARG URL
ARG SOURCE
ARG AUTHORS
ARG LICENSE
LABEL service="saleor-app-products-feed"\
  src="saleor-dockerize-all-apps"\
  org.opencontainers.image.title="saleor-apps-products-feed"\
  org.opencontainers.image.description="saleor apps products-feed"
