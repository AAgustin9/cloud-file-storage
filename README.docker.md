# Ejecución de Cloud File Storage en Docker

Este documento proporciona instrucciones para ejecutar la API de almacenamiento de archivos en la nube usando Docker.

## Requisitos previos

- Docker instalado en tu sistema
- Docker Compose instalado en tu sistema

## Configuración

1. Clona el repositorio:
```
git clone <url-del-repositorio>
cd cloud-file-storage
```

2. Configura las variables de entorno (opcional):
   - Puedes modificar el archivo `docker-compose.yml` para cambiar configuraciones como puertos, credenciales, etc.
   - Para producción, asegúrate de cambiar `JWT_SECRET` a una clave segura.

## Ejecución

### Iniciar los servicios

```
docker-compose up -d
```

Esto inicia tres servicios:
- **api**: La API de almacenamiento de archivos en NestJS
- **db**: Base de datos PostgreSQL
- **minio**: Servicio de almacenamiento compatible con S3 (opcional)

### Ver logs

```
docker-compose logs -f
```

Para ver los logs de un servicio específico:
```
docker-compose logs -f api
```

### Detener los servicios

```
docker-compose down
```

Para eliminar también los volúmenes (¡esto borrará todos los datos!):
```
docker-compose down -v
```

## Acceso a servicios

- **API NestJS**: http://localhost:3000
- **Documentación Swagger**: http://localhost:3000/api
- **MinIO Console**: http://localhost:9001 (usuario: minio, contraseña: minio123)

## Uso de MinIO como almacenamiento

Si deseas usar MinIO como proveedor de almacenamiento compatible con S3, necesitarás configurar las siguientes variables de entorno en el servicio `api` en el archivo `docker-compose.yml`:

```yaml
environment:
  - S3_ENDPOINT=http://minio:9000
  - S3_ACCESS_KEY=minio
  - S3_SECRET_KEY=minio123
  - S3_BUCKET=cloud-files
```

Además, necesitarás crear el bucket "cloud-files" en MinIO a través de la consola web después de iniciar los servicios.

## Solución de problemas

### Problemas de conectividad con la base de datos

Si la API no puede conectarse a la base de datos, verifica que la URL de conexión en `DATABASE_URL` sea correcta. El host debe ser el nombre del servicio (`db`) y no `localhost`.

### Errores en las migraciones de Prisma

Si las migraciones no se aplican correctamente, puedes ejecutarlas manualmente:

```
docker-compose exec api npx prisma migrate deploy
```

### Problema con permisos de archivos

Si hay problemas con los permisos de los archivos cargados, verifica que el directorio `/app/uploads` tenga los permisos correctos dentro del contenedor:

```
docker-compose exec api ls -la /app/uploads
``` 