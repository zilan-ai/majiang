FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY api ./api
COPY shared ./shared
COPY api/tsconfig.json ./api/tsconfig.json

ENV PORT=3000
EXPOSE 3000

CMD ["npx", "tsx", "api/server.ts"]
