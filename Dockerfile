# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências do sistema
RUN apk add --no-cache openssl openssl-dev python3 make g++

# Copia arquivos de dependência
COPY package*.json ./
COPY prisma ./prisma/

# Instala TODAS as dependências (incluindo devDependencies)
RUN npm install --no-audit --no-fund

# Gera o cliente Prisma (precisa estar disponível)
RUN npx prisma generate

# Copia o resto do código
COPY . .

# Build da aplicação
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Apenas utilitários necessários em produção
RUN apk add --no-cache openssl postgresql-client

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cria usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia arquivos públicos e configurações
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copia o build do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# COPIA O NODE_MODULES COMPLETO (solução para o Prisma)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Garante permissões corretas
RUN chmod -R 755 /app/node_modules/.bin

# Expõe a porta
EXPOSE 3000

# Configura variáveis de ambiente
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copia entrypoint
COPY --chown=nextjs:nodejs entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Muda para usuário não-root
USER nextjs

CMD ["./entrypoint.sh"]