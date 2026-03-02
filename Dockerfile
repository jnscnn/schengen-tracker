FROM node:22-slim AS web-build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx expo export --platform web

FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
RUN npx -y tsx --version > /dev/null
COPY server/ server/
COPY assets/ assets/
COPY --from=web-build /app/dist ./dist
EXPOSE 3000
ENV PORT=3000
ENV DB_PATH=/data/schengen.db
ENV NODE_ENV=production
CMD ["npx", "tsx", "server/index.ts"]
