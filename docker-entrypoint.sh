#!/bin/sh
set -e

# Ejecutar las migraciones de Prisma
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Iniciar la aplicación
echo "Starting application..."
exec "$@" 