# VPS y despliegues automáticos

Entorno de pruebas: `http://72.62.210.87`. Administración: `/admin/`. Se usa `APP_ENV=staging`, respuestas `noindex` y canonical del dominio definitivo. El dominio antiguo no se modifica. Mientras se accede por IP se usa HTTP; al asignar dominio, configurar HTTPS en Caddy y `PUBLIC_ORIGIN` antes de pasar a producción.

## Arquitectura

En `/opt/neurocanino` residen `.env` y `.images.env` (solo root), `runtime/` y los fuentes de cada versión bajo `releases/frontend/<SHA>` y `releases/backend/<SHA>`. Los contenedores de aplicación usan las imágenes finales de sus Dockerfile, sin montar código del host. MySQL y uploads tienen volúmenes persistentes; Caddy publica 80/443. MySQL y la API no publican puertos. Docker arranca automáticamente con el servidor.

Este directorio del repositorio backend es la fuente versionada del Compose de servidor, Caddy y scripts. El Compose de la raíz del workspace sigue siendo el de desarrollo local.

## GitHub Actions

Los repositorios front y back incluyen `.github/workflows/deploy.yml`. Cada push a `main` ejecuta instalación con lockfile, tipos/compilación y pruebas unitarias; después transmite un `git archive` del SHA comprobado por SSH. Las pull requests solo verifican. También se puede relanzar desde Actions → Verify and deploy → Run workflow.

Cada repositorio tiene un secreto `DEPLOY_SSH_KEY` diferente. Las claves corresponden al usuario `neurodeploy`, con comandos SSH forzados y sin terminal, túneles ni agent forwarding. Cada clave solo permite enviar el componente correspondiente. Se verifica la clave del host; no se emplea la contraseña de root. El servidor no necesita tokens ni claves para leer repositorios privados de GitHub.

Un bloqueo global evita que los despliegues de ambos repositorios se pisen. El servidor valida el SHA y el archivo recibido, construye la imagen, hace copia previa y aplica migraciones antes de actualizar backend. El frontend se puede actualizar por separado. Se comprueban salud del API, frontend y proxy antes de promover `.images.env`. Si falla el arranque, se recuperan las imágenes anteriores; no se revierten automáticamente los cambios SQL. Las migraciones nuevas deben ser compatibles con la versión anterior durante el despliegue.

Los cambios del panel viven en MySQL: el seed es idempotente y no los reemplaza en cada push.

## Operación

```sh
cd /opt/neurocanino
docker compose --env-file .env --env-file .images.env -f runtime/docker-compose.yml ps
docker compose --env-file .env --env-file .images.env -f runtime/docker-compose.yml logs --tail=100 backend frontend
/usr/local/sbin/neurocanino-backup
systemctl status neurocanino-backup.timer
```

Los logs tienen rotación. Las copias contienen SQL, uploads, referencias de imágenes y entorno, se guardan con acceso root en `/var/backups/neurocanino`, tienen retención de siete días y se generan también antes de actualizar. Esas copias son locales al VPS; una copia externa requiere configurar otro destino.

Para recuperar una versión de aplicación, conservar una copia del entorno e imágenes actuales, sustituir los tags en `.images.env` por los del `images.env` de la copia deseada y ejecutar `docker compose ... up -d --wait`. Esto no restaura MySQL. Para restaurar datos, detener frontend/backend, importar `database.sql.gz` en MySQL, restaurar `uploads.tar.gz` en su volumen y arrancar. Nunca ejecutar `down -v` al actualizar.

La reestructuración parte de un esquema nuevo, sin catálogo, cobros ni reseñas en MySQL. Esta migración inicial requiere una base vacía; no se debe aplicar sobre las tablas antiguas. La sustitución del esquema en staging o producción debe prepararse como una operación independiente del despliegue automático. El comando `db:reset:dev` está limitado a desarrollo. El seed inicializa únicamente las cinco agendas y no sobrescribe enlaces editados. El administrador se crea por CLI; las credenciales se mantienen fuera de Git. Si SMTP falla, las solicitudes quedan guardadas y el panel permite reintentar el aviso.

## Cambios de infraestructura

Las modificaciones de Compose y Caddy se aplican con un push del backend. Si se modifican los scripts instalados, actualizarlos como administrador usando `install -m 755 deploy/deploy.sh /usr/local/sbin/neurocanino-deploy`, y análogamente `backup.sh`, `receive.sh` y `ssh-command.sh`. Se mantienen fuera del alcance directo del usuario SSH de Actions.

Secretos y archivos `.env` nunca deben añadirse al repositorio. Para rotar una clave, generar un par nuevo, actualizar su línea de `authorized_keys` y el secreto del repositorio correspondiente. Para cambiar la IP, actualizar la clave de host y destino SSH de ambos workflows.
