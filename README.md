# Coach Progress Lab

Aplicación full-stack para administrar clientes de coaching, su biblioteca de ejercicios, rutinas, sesiones realizadas, check-ins semanales y progresión. Incluye la base técnica y las Fases 2 a 7 del roadmap; los reportes permanecen planificados.

## Stack

Next.js App Router, React, TypeScript estricto, Route Handlers, MongoDB, Prisma, Tailwind CSS, componentes compatibles con shadcn/ui, React Hook Form, Zod, TanStack Query, Recharts, Vitest y React Testing Library.

## Requisitos

- Node.js 20 o superior
- Yarn 1.x
- Docker Desktop (para MongoDB)

## Inicio rápido

```bash
cd coach-progress
yarn install
cp .env.example .env
docker compose up -d
yarn db:generate
yarn db:push
yarn db:seed
yarn dev
```

La aplicación queda disponible en `http://localhost:3000`; MongoDB se publica en `localhost:27017`. Docker configura automáticamente una réplica local `rs0`, necesaria para las transacciones de Prisma. Para detener la base: `docker compose down`. Los datos persisten en el volumen `coach_progress_mongo`.

## Variables de entorno

Crea `.env` a partir de `.env.example` y ajusta sus valores cuando sea necesario:

```env
DATABASE_URL="mongodb://localhost:27017/coach_progress?replicaSet=rs0"
NEXT_PUBLIC_APP_NAME="Coach Progress Lab"
```

`DATABASE_URL` se valida en código de servidor y nunca se importa desde componentes de cliente. Solo las variables con prefijo `NEXT_PUBLIC_` llegan al navegador.

## Scripts

| Comando                     | Uso                                     |
| --------------------------- | --------------------------------------- |
| `yarn dev`                  | Servidor de desarrollo                  |
| `yarn build` / `yarn start` | Build y servidor de producción          |
| `yarn lint`                 | ESLint actual de Next.js (`eslint .`)   |
| `yarn typecheck`            | Comprobación estricta de TypeScript     |
| `yarn test`                 | Vitest en modo CI                       |
| `yarn test:watch`           | Vitest en watch mode                    |
| `yarn format`               | Formatea con Prettier                   |
| `yarn db:generate`          | Genera Prisma Client                    |
| `yarn db:push`              | Sincroniza el esquema con MongoDB       |
| `yarn db:seed`              | Inserta datos demo de forma idempotente |
| `yarn db:studio`            | Abre Prisma Studio                      |

## Arquitectura

`src/app/api` contiene Route Handlers delgados. La ruta de clientes valida query params con Zod, llama a un servicio y este delega en un repositorio Prisma. `src/server` está marcado como código exclusivo de servidor. La UI no consulta Prisma directamente.

MongoDB usa `ObjectId` como identificador y Prisma no soporta `migrate` con este conector; el esquema se aplica con `db push`. El repositorio elimina las evaluaciones explícitamente al borrar un cliente, dentro de una transacción.

La ruta `GET /api/health` responde `{"status":"ok"}` con HTTP 200. Las rutas de clientes usan Zod, servicios y repositorios, y devuelven el formato `{ "data": ... }`:

| Ruta                                                     | Función                                      |
| -------------------------------------------------------- | -------------------------------------------- |
| `GET`, `POST /api/clients`                               | Listar con búsqueda/filtros y crear clientes |
| `GET`, `PATCH`, `DELETE /api/clients/:clientId`          | Consultar, actualizar y eliminar un cliente  |
| `POST /api/clients/:clientId/assessments`                | Crear una evaluación física                  |
| `PATCH /api/clients/:clientId/assessments/:assessmentId` | Editar una evaluación                        |
| `GET`, `POST /api/exercises`                             | Listar con filtros y crear ejercicios        |
| `GET`, `PATCH`, `DELETE /api/exercises/:exerciseId`      | Consultar, actualizar y eliminar ejercicios  |

El perfil del cliente calcula edad e IMC a partir de la fecha de nacimiento, estatura y la última evaluación; esos valores no se almacenan como columnas.

La biblioteca de ejercicios permite definir tipo de medición, equipo, músculos principales y secundarios, patrón de movimiento, incremento mínimo, política de progresión y sustituciones. Al eliminar un ejercicio, el repositorio elimina sus referencias de sustitución de forma explícita dentro de una transacción MongoDB.

Las rutinas se modelan como plantillas versionadas. Cada versión conserva su estructura ordenada de días, bloques (series rectas, superseries o circuitos) y prescripciones de ejercicios (series, repeticiones, RIR y descansos). Al asignar una rutina, el cliente queda vinculado a una versión específica para preservar la programación original.

| Ruta                                       | Función                                                  |
| ------------------------------------------ | -------------------------------------------------------- |
| `GET`, `POST /api/routines`                | Listar y crear plantillas con su primera versión         |
| `GET`, `PATCH`, `DELETE /api/routines/:id` | Consultar, actualizar metadatos y eliminar una plantilla |
| `POST /api/routines/:id/versions`          | Crear una nueva instantánea versionada                   |
| `POST /api/routines/:id/assignments`       | Asignar una versión concreta a un cliente                |
| `PATCH /api/routine-assignments/:id`       | Pausar o finalizar una asignación                        |

Las sesiones de entrenamiento se registran de forma independiente de las rutinas para conservar el resultado real de cada ejecución. Cada sesión contiene ejercicios y series ordenadas, con carga, repeticiones, duración, RIR, técnica, dolor y observaciones. El historial semanal muestra sesiones, completadas, series y volumen calculado.

| Ruta                                       | Función                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `GET`, `POST /api/workouts`                | Consultar historial semanal y crear una sesión                      |
| `GET`, `PATCH`, `DELETE /api/workouts/:id` | Consultar, editar o eliminar una sesión y sus series explícitamente |

Los check-ins semanales preservan la evolución de medidas, sueño, pasos, energía, hambre, adherencia nutricional y observaciones. La pantalla permite filtrar por cliente y muestra tendencias accesibles de peso, sueño y adherencia con Recharts.

| Ruta                                        | Función                                            |
| ------------------------------------------- | -------------------------------------------------- |
| `GET`, `POST /api/check-ins`                | Listar check-ins y tendencias, o crear un registro |
| `GET`, `PATCH`, `DELETE /api/check-ins/:id` | Consultar, editar o eliminar un check-in           |

El motor de progresión deriva sus resultados directamente de sesiones completadas: calcula volumen, e1RM con la fórmula de Epley, récords personales, evolución frente a la primera exposición y alertas. La recomendación de doble progresión propone aumentar la carga solo cuando las series superiores alcanzan 12 repeticiones y el ejercicio tiene un incremento mínimo configurado.

| Ruta                   | Función                                                  |
| ---------------------- | -------------------------------------------------------- |
| `GET /api/progression` | Obtiene análisis de progreso por cliente y por ejercicio |

## Alcance deliberadamente pendiente

Autenticación y autorización, reportes, fotos, aplicación móvil, IA, notificaciones y pagos.
