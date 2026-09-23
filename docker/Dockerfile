# ==============================================================================
# OMNIFLUX - DOCKERFILE MULTI-STAGE OTIMIZADO (PRODUCTION-READY)
# Next.js 14+ com App Router, Standalone Output e Usuário Não-Privilegiado
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: Base Alpine com dependências de sistema mínimas
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base

# libc6-compat é recomendada para compatibilidade com bibliotecas nativas e Prisma no Alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ------------------------------------------------------------------------------
# STAGE 2: Instalação de Dependências
# ------------------------------------------------------------------------------
FROM base AS deps

# Copia manifestos de pacotes
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
# Copia o schema do Prisma se presente, para permitir geração antecipada de tipos
COPY prisma ./prisma/

RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Nenhum lockfile detectado, utilizando npm install..." && npm install; \
  fi

# ------------------------------------------------------------------------------
# STAGE 3: Compilação e Geração do Standalone
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desativa telemetria durante o build para performance e privacidade
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Gera o client do Prisma se o schema existir
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi

# Compila o projeto Next.js
RUN \
  if [ -f package-lock.json ]; then npm run build; \
  elif [ -f yarn.lock ]; then yarn build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else npm run build; \
  fi

# ------------------------------------------------------------------------------
# STAGE 4: Imagem de Produção Final (Minimalista e Segura)
# ------------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Criação de grupo e usuário de sistema dedicados (sem privilégios de root)
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nodejs

# Configuração de diretórios com permissões adequadas
RUN mkdir .next && chown nodejs:nodejs .next

# Copia artefatos necessários a partir do builder
# Modo standalone condensa o runtime do Node.js e dependências estritamente necessárias
COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/.next/static ./.next/static

# Muda para o usuário sem privilégios
USER nodejs

EXPOSE 3000

# Execução direta via Node.js utilizando o servidor standalone
CMD ["node", "server.js"]
