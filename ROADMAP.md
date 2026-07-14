# Roadmap inicial — Coach Progress Lab

## Fase 1: Base técnica — completada

Objetivo: tener un proyecto estable que pueda ejecutarse localmente.

- Crear la aplicación full-stack con Next.js App Router.
- Configurar React, TypeScript, Route Handlers y la estructura de UI, servicios y repositorios.
- Conectar MongoDB y Prisma.
- Configurar lint, formato, tests y variables de entorno.
- Crear layout administrativo.
- Agregar endpoint de salud.
- Crear modelos iniciales de organización, usuario y cliente.

> Decisión técnica: el proyecto utiliza una sola aplicación Next.js; no se crea monorepo ni NestJS, conforme a la arquitectura acordada.

Resultado esperado:

```text
Frontend funcionando
API funcionando
Base de datos conectada
Migraciones ejecutándose
Proyecto validado por lint y typecheck
```

## Fase 2: Gestión de clientes — completada

Objetivo: reemplazar los datos mock por información real.

- CRUD de clientes y evaluaciones.
- Selector y buscador de clientes.
- Perfil del cliente.
- Datos físicos y contexto de entrenamiento.
- Cálculo automático de edad e IMC.
- Estados activo, pausado, finalizado y archivado.
- Historial y edición de evaluaciones.

Primer flujo completo:

```text
Crear cliente
→ abrir dashboard
→ editar evaluación
→ ver datos actualizados
```

## Fase 3: Biblioteca de ejercicios — completada

- CRUD de ejercicios.
- Tipos de medición.
- Equipo.
- Músculos y patrones de movimiento.
- Sustituciones.
- Incrementos mínimos.
- Políticas de progresión.

## Fase 4: Constructor de rutinas — completada

- Crear plantillas.
- Crear días de entrenamiento.
- Crear bloques, circuitos y superseries.
- Agregar series, repeticiones, RIR y descansos.
- Versionar rutinas.
- Asignar una rutina a un cliente.

## Fase 5: Registro de entrenamientos — completada

- Crear sesiones.
- Registrar ejercicios.
- Registrar cada serie.
- Guardar peso, repeticiones, tiempo y RIR.
- Marcar técnica, dolor y observaciones.
- Mostrar historial semanal.

## Fase 6: Check-ins — completada

- Formulario semanal.
- Peso y medidas.
- Sueño, pasos, energía y hambre.
- Adherencia nutricional.
- Campos opcionales.
- Gráficas de tendencias.

## Fase 7: Motor de progresión — completada

- Récords personales.
- Volumen.
- e1RM.
- Progreso desde línea base.
- Doble progresión.
- Sugerencias de aumento de carga.
- Alertas por estancamiento o dolor.

## Orden recomendado de implementación

```text
Infraestructura
→ Clientes
→ Ejercicios
→ Rutinas
→ Asignaciones
→ Entrenamientos
→ Check-ins
→ Progresión
→ Reportes
```

No conviene comenzar por las fórmulas o gráficas. Primero deben existir datos consistentes de clientes, ejercicios, sesiones y series; de lo contrario, el dashboard terminará dependiendo de datos mock o estructuras que después habrá que rehacer.
