# TODO - TgCloudAPI

## Organización y Estructura

- [x] Separar modelos y esquemas (usar `schemas.py` para Pydantic)
- [x] Crear carpeta `services` para lógica de negocio
- [ ] Crear carpeta/archivo `dependencies` para dependencias reutilizables (DB, autenticación, etc)
- [ ] Crear archivo/carpeta `exceptions` para gestión centralizada de errores personalizados
- [ ] Añadir scripts de inicialización/migración de base de datos (`initial_data.py` o similar)
- [ ] Añadir y mantener actualizado `requirements.txt` con todas las dependencias
- [ ] Añadir y mantener actualizado el `README.md` con instrucciones claras

## Seguridad

- [ ] Implementar autenticación (API Key, OAuth2, JWT, etc)
- [ ] Añadir autorización/roles si es necesario
- [ ] Validar tamaño y tipo de archivos subidos
- [ ] Proteger endpoints críticos (subida, descarga, borrado)

## Lógica de negocio y API

- [ ] Endpoint para listar archivos por carpeta, nombre, fecha, etc (paginación)
- [ ] Endpoint para borrar archivos (tanto en Telegram como en la base de datos)
- [ ] Endpoint para actualizar metadatos de archivos
- [ ] Endpoint para crear/borrar carpetas virtuales
- [ ] Endpoint para obtener información detallada de un archivo
- [ ] Endpoint para descargar archivos por ID, nombre, carpeta, etc
- [ ] Endpoint para subir archivos cifrados (opcional)
- [ ] Endpoint para compartir archivos (generar enlaces temporales, opcional)
- [ ] Endpoint para obtener espacio usado/libre (estadísticas)

## Manejo de errores y validaciones

- [ ] Validar existencia de archivos antes de subir/descargar
- [ ] Manejar errores de Telegram (conexión, permisos, etc)
- [ ] Manejar errores de base de datos (integridad, duplicados, etc)
- [ ] Devolver mensajes de error claros y consistentes en la API
- [ ] Añadir logs para operaciones críticas y errores

## Limpieza y mantenimiento

- [ ] Script/tarea para limpiar archivos temporales huérfanos (descargas incompletas, etc)
- [ ] Script/tarea para sincronizar base de datos con Telegram (verificar archivos existentes)
- [ ] Script/tarea para migraciones de base de datos

## Tests

- [ ] Añadir tests unitarios para servicios y lógica de negocio
- [ ] Añadir tests de integración para endpoints principales
- [ ] Añadir tests de carga para subida/descarga de archivos grandes
- [ ] Añadir mocks para pruebas sin Telegram real

## Calidad de código

- [ ] Añadir tipado estricto (`mypy`)
- [ ] Añadir linting (`flake8`, `black`)
- [ ] Añadir pre-commit hooks para calidad de código
- [ ] Añadir docstrings y comentarios en funciones y endpoints

## Documentación

- [ ] Mejorar y mantener la documentación en `README.md`
- [ ] Añadir ejemplos de uso de la API (curl, http, etc)
- [ ] Documentar variables de entorno y configuración
- [ ] Documentar estructura de carpetas y archivos

## DevOps y despliegue

- [ ] Añadir Dockerfile y docker-compose para despliegue fácil
- [ ] Añadir scripts de despliegue (opcional)
- [ ] Añadir configuración para despliegue en servicios cloud (Heroku, Azure, etc)
- [ ] Añadir CI/CD para tests y despliegue automático

---

**Nota:**  
Este TODO es una guía completa para evolucionar tu proyecto desde una fase beta a un sistema robusto, seguro y mantenible.