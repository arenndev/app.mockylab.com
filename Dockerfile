# Stage 1: Dependencies ve Build aşaması
FROM node:18-alpine AS builder

WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./
COPY yarn.lock ./

# Dependencies'leri yükle
RUN npm install --legacy-peer-deps

# Kaynak kodları kopyala
COPY . .

# Build al
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production aşaması
FROM node:18-alpine AS runner

WORKDIR /app

# Production modu
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Sistem kullanıcısı oluştur
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Gerekli dosyaları builder'dan kopyala
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Kullanıcı izinlerini ayarla
RUN chown -R nextjs:nodejs /app

# Sistem kullanıcısına geç
USER nextjs

# Port ve host ayarları
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Uygulamayı başlat
CMD ["node", "server.js"] 