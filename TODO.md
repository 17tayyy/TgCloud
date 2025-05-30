# TODO - TgCloudAPI (Prioritized & Complete)

---

## 1. **Validaciones y Seguridad Básica**

- [x] Validar nombre de archivo y carpeta (sin caracteres peligrosos ni rutas relativas)
- [ ] Validar tamaño máximo de archivo en upload
- [x] Validar existencia de carpeta al subir archivo (si usas carpetas virtuales)
- [ ] Añadir autenticación básica (API Key, OAuth2, JWT, etc)
- [ ] Añadir autorización/roles si es necesario
- [ ] Validar tipo de archivo permitido en upload
- [ ] Proteger endpoints críticos (subida, descarga, borrado)

---

## 2. **Optimización y Estructura de Código**

- [x] Renombrar funciones para evitar confusión (ej: `remove_file` → `remove_file_from_disk`)
- [ ] Centralizar lógica de negocio en `services/` (por ejemplo, creación de carpetas, subida de archivos)
- [ ] Manejar errores de base de datos con try/except (integridad, duplicados, etc)
- [ ] Usar docstrings en todos los endpoints para mejorar la documentación automática
- [ ] Mejorar el mensaje de creación de carpeta (`return {"message": f"Folder '{folder_data.folder}' created"}`)
- [ ] Usar nombres de parámetros consistentes (`folder`, `foldername`, etc)
- [ ] Devolver respuestas uniformes en todos los endpoints (formato consistente para éxito/error)

---

## 3. **Organización y Estructura del Proyecto**

- [x] Separar modelos y esquemas (`schemas.py` para Pydantic)
- [x] Crear carpeta `services` para lógica de negocio
- [x] Crear carpeta/archivo `dependencies` para dependencias reutilizables (DB, autenticación, etc)
- [x] Crear archivo/carpeta `exceptions` para gestión centralizada de errores personalizados
- [ ] Añadir scripts de inicialización/migración de base de datos (`initial_data.py` o similar)
- [~] Añadir y mantener actualizado `requirements.txt` con todas las dependencias
- [~] Añadir y mantener actualizado el `README.md` con instrucciones claras

---

## 4. **Lógica de Negocio y API**

- [x] Endpoint para listar archivos por carpeta, nombre, fecha, etc (paginación)
- [x] Endpoint para borrar archivos (tanto en Telegram como en la base de datos)
- [ ] Endpoint para actualizar metadatos de archivos
- [ ] Endpoint para crear/borrar carpetas virtuales
- [x] Endpoint para obtener información detallada de un archivo
- [ ] Endpoint para descargar archivos por ID, nombre, carpeta, etc
- [ ] Endpoint para subir archivos cifrados (opcional)
- [ ] Endpoint para compartir archivos (generar enlaces temporales, opcional)
- [ ] Endpoint para obtener espacio usado/libre (estadísticas)

---

## 5. **Manejo de Errores y Validaciones**

- [x] Validar existencia de archivos antes de subir/descargar
- [ ] Manejar errores de Telegram (conexión, permisos, etc)
- [ ] Manejar errores de base de datos (integridad, duplicados, etc)
- [ ] Devolver mensajes de error claros y consistentes en la API
- [ ] Añadir logs para operaciones críticas y errores

---

## 6. **Limpieza y Mantenimiento**

- [ ] Script/tarea para limpiar archivos temporales huérfanos (descargas incompletas, etc)
- [ ] Script/tarea para sincronizar base de datos con Telegram (verificar archivos existentes)
- [ ] Script/tarea para migraciones de base de datos

---

## 7. **Tests**

- [ ] Añadir tests unitarios para servicios y lógica de negocio
- [ ] Añadir tests de integración para endpoints principales
- [ ] Añadir tests de carga para subida/descarga de archivos grandes
- [ ] Añadir mocks para pruebas sin Telegram real

---

## 8. **Calidad de Código**

- [ ] Añadir tipado estricto (`mypy`)
- [ ] Añadir linting (`flake8`, `black`)
- [ ] Añadir pre-commit hooks para calidad de código
- [ ] Añadir docstrings y comentarios en funciones y endpoints

---

## 9. **Documentación**

- [ ] Mejorar y mantener la documentación en `README.md`
- [ ] Añadir ejemplos de uso de la API (curl, http, etc)
- [ ] Documentar variables de entorno y configuración
- [ ] Documentar estructura de carpetas y archivos

---

## 10. **DevOps y Despliegue**

- [ ] Añadir Dockerfile y docker-compose para despliegue fácil
- [ ] Añadir scripts de despliegue (opcional)
- [ ] Añadir configuración para despliegue en servicios cloud (Heroku, Azure, etc)
- [ ] Añadir CI/CD para tests y despliegue automático

---