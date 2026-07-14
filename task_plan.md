# Plan de implementación — Fases 1 a 7

## Objetivo

Completar la base técnica existente, la gestión real de clientes, ejercicios, rutinas, entrenamientos, check-ins y progresión, siguiendo la referencia visual proporcionada.

## Fases

1. **Auditoría y diseño** — completado
2. **Modelo, migración y seed de clientes** — completado
3. **API y servicios CRUD** — completado
4. **Interfaz de clientes y perfil** — completado
5. **Pruebas, documentación y validación** — completado
6. **Modelo y seed de biblioteca de ejercicios** — completado
7. **API, interfaz y validación de ejercicios** — completado
8. **Modelo y seed del constructor de rutinas** — completado
9. **API, interfaz y validación de rutinas** — completado
10. **Modelo y seed de sesiones de entrenamiento** — completado
11. **API, interfaz e historial semanal de entrenamientos** — completado
12. **Modelo y seed de check-ins semanales** — completado
13. **API, interfaz y gráficas de tendencias de check-ins** — completado
14. **Cálculos y seed de señales de progresión** — completado
15. **API, panel de progreso y validación** — completado

## Decisiones

- Una sola aplicación Next.js full-stack; no se añade NestJS ni monorepo.
- El diseño adopta el estilo administrativo editorial, blanco y pastel de la referencia: densidad controlada, bordes sutiles y violeta como acento.
- Fase 2 incorpora CRUD, perfil, contexto físico y evaluaciones; rutinas, check-ins y progresión permanecen fuera de alcance.
- Fase 3 modela sustituciones como referencias `ObjectId` explícitas para evitar una relación auto-referencial innecesaria antes de que existan rutinas.
- La eliminación limpia esas referencias de manera explícita y transaccional, conservando documentos válidos incluso sin cascadas implícitas de MongoDB.
- Fase 4 guardará una asignación contra una versión concreta de rutina; los días, bloques y ejercicios serán la instantánea inmutable de dicha versión.
- Fase 5 guardará los registros de entrenamiento de forma independiente de las rutinas, con series individuales para preservar carga, repeticiones, duración, RIR, técnica, dolor y observaciones históricas.
- Fase 6 guardará un check-in fechado por cliente, separado de las evaluaciones físicas, para conservar medidas, hábitos y adherencia semanal sin alterar el historial de evaluaciones.
- Fase 7 calculará e1RM, volumen, récords, evolución y alertas desde las sesiones completadas existentes; no se almacenarán métricas derivadas que puedan recalcularse a partir de series reales.

## Errores encontrados

| Error                                                | Resolución                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| Contexto del seed no coincidía con el parche inicial | Se inspeccionó el archivo y se reemplazó de manera dirigida.                |
| Typecheck del servicio de evaluaciones               | Se corrigieron el tipo de entrada y el detalle del mapper.                  |
| Seed de ejercicios con listas `readonly`             | Se retiró `as const` del catálogo para entregar arreglos mutables a Prisma. |
| `PATCH` aplicaba un default de creación              | Se creó un esquema Zod de actualización sin valores por defecto.            |
| Build en sandbox no pudo abrir un puerto interno     | Se ejecutó el build fuera del sandbox; compiló correctamente.               |
| Repositorio de rutinas con delimitador incompleto    | Se corrigió el cierre de `deleteMany` antes de continuar con typecheck.     |
| Borrado de rutina dejaba el programa del cliente     | Se limpia `currentProgram` y `currentWeek` dentro de la transacción.        |
| Servidor de desarrollo usaba Prisma Client anterior  | Se reinició después de `db push` para cargar los modelos de entrenamientos. |
| Resolver de formulario transformaba fecha muy pronto | La validación final centralizada con Zod procesa la fecha una sola vez.     |
| Build detectó `useSearchParams` sin límite Suspense  | La página de alta envuelve el formulario en `Suspense` para prerenderizar.  |
| `EmptyState` no acepta acción como prop              | Se añadió el enlace de alta junto al estado vacío de check-ins.             |
| Consulta manual usó límite `52` fuera del contrato   | La API limita `limit` a 50; se verificó con el máximo permitido.            |
| Parche documental no coincidió con el formato actual | Se inspeccionan las secciones concretas antes de aplicar cambios dirigidos. |
| Build aislado bloqueó puerto interno de Turbopack    | Se repite el build fuera del sandbox, como en fases anteriores.             |
| ESLint rechazó una aserción opcional insegura        | Se usa una comprobación explícita antes de comparar el último e1RM.         |
| Build aislado volvió a bloquear puerto de Turbopack  | Se valida el build final fuera del sandbox.                                 |

## Migración a MongoDB

- **Completada:** Prisma, Docker, seed y documentación migrados a MongoDB con réplica local `rs0`.
- Los datos demo de PostgreSQL fueron reemplazados por un seed limpio e idempotente de MongoDB.
- La fuente remota de Google se reemplazó por una pila tipográfica local para que el build no dependa de red.
