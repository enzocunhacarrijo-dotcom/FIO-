# Built with the monorepo root as build context (Railway root directory = repo
# root), because the backend depends on the @hair-analysis/shared workspace
# package and npm workspaces need the whole tree to install correctly.

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/mobile/package.json apps/mobile/package.json
RUN npm ci

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/backend apps/backend
RUN npm run build:shared
RUN npm run build --workspace=@hair-analysis/backend

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/packages/shared packages/shared
COPY --from=build /app/apps/backend/package.json apps/backend/package.json
COPY --from=build /app/apps/backend/dist apps/backend/dist
COPY --from=build /app/apps/backend/src/db/migrations apps/backend/dist/db/migrations

EXPOSE 3001
CMD ["node", "apps/backend/dist/index.js"]
