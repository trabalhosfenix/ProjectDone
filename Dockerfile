# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl openssl-dev

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install prisma@5.22.0 @prisma/client@5.22.0 --save-exact --no-package-lock

RUN npm install

COPY . .

# Gera o cliente Prisma com o adapter
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copia tudo necessário
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]