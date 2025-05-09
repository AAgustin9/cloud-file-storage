FROM node:18-alpine as builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias incluyendo Prisma
RUN npm ci

# Copiar el código fuente
COPY . .

# Generar cliente Prisma, construir el proyecto y limpiar cache
RUN npx prisma generate \
    && npm run build \
    && npm cache clean --force

# Imagen final
FROM node:18-alpine

WORKDIR /app

# Instalar sólo dependencias de producción
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

# Copiar archivos compilados y Prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Copiar script de entrada
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Establecer variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Crear directorio para uploads
RUN mkdir -p /app/uploads && \
    chmod -R 777 /app/uploads

# Exponer puerto
EXPOSE 3000

# Establecer script de entrada
ENTRYPOINT ["docker-entrypoint.sh"]

# Comando para iniciar la aplicación
CMD ["node", "dist/main"] 