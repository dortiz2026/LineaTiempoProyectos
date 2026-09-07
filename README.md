# Línea de Tiempo de Proyectos | Patprimo & Pash

Plataforma corporativa moderna para el seguimiento estratégico, estimación y control del ciclo de vida de proyectos y tareas para **Patprimo** y **Pash**.

---

## 🚀 Características Principales

### 🏢 1. Arquitectura de Estados en Dos Niveles
- **Nivel Proyecto (Macro-Estados Software Tendency):**
  Refleja el estado general corporativo:
  - `En entendimiento`
  - `Levantamiento`
  - `En tendency`
  - `Análisis TI`
  - `Desarrollo`
  - `Pruebas unitarias`
  - `Pruebas funcionales`
  - `Productivo`
  - *(Opciones administrativas: `Pausado`, `Cerrado`)*
- **Nivel Tareas / Etapas (Flujo Operativo de Avance):**
  Mide el progreso interno con los estados estándar de flujo de trabajo:
  - `Sin iniciar`
  - `En proceso`
  - `Bloqueado` *(Requiere registro obligatorio del motivo e historial)*
  - `Terminado` *(Suma automáticamente al % de avance)*
- **Fase Obligatoria Inicial:** Cada proyecto inicia con la etapa fija *"Levantamiento de información"*.

### ⚡ 2. Tablero Linear con Arrastre Instantáneo (0ms Optimistic UI)
- Arrastre y soltado entre columnas fluido y sin recargas de pantalla (0 milisegundos de latencia en interfaz).
- Modal obligatorio al mover a `Bloqueado` para capturar motivo y responsable.
- Desbloqueo administrativo seguro con destino a `En proceso`, `Sin iniciar` o `Terminado`.
- Bitácora completa de bloqueos con fechas, autores y comentarios históricos.

### 📋 3. Vista Ejecutiva de Gerencia (Solo Lectura)
- Visualización horizontal: **un proyecto por fila**.
- Insignia de estado Tendency corporativo.
- Múltiples responsables con chips individuales.
- Barra de avance porcentual calculado automáticamente.
- Horas totales estimadas por proyecto y por etapa.
- Modal interactivo de detalle con secuencia cronológica de etapas.
- Auto-sincronización en tiempo real sin recargar página.

### 👥 4. Control de Acceso y Roles
- **Administrador:** Gestión total de proyectos, tareas, arrastre de etapas, desbloqueo y aprobación de usuarios de gerencia.
- **Gerencia:** Registro con solicitud de aprobación y vista ejecutiva protegida en modo solo lectura.

---

## 🛠️ Stack Tecnológico

- **Framework:** [Next.js 16.2 (App Router)](https://nextjs.org/)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Base de Datos:** [Supabase PostgreSQL](https://supabase.com/)
- **Iconos:** [Lucide React](https://lucide.dev/)
- **Autenticación:** JWT con cookies seguras `HttpOnly` y contraseñas hasheadas en SHA-256 con salt corporativo.

---

## ⚙️ Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/dortiz2026/LineaTiempoProyectos.git
cd LineaTiempoProyectos
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` basado en `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role
JWT_SECRET=tu-clave-secreta-jwt-de-32-caracteres
```

### 4. Inicializar la Base de Datos
Ejecuta el script SQL en el **SQL Editor** de Supabase usando el archivo incluido:
```bash
supabase/schema.sql
```

### 5. Iniciar servidor de desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## 📦 Estructura del Proyecto

```
linea_tiempo/
├── src/
│   ├── app/
│   │   ├── admin/             # Panel y detalle de proyectos admin
│   │   ├── gerencia/          # Tablero ejecutivo horizontal de gerencia
│   │   ├── login/             # Inicio de sesión y solicitud de acceso
│   │   ├── pendiente/         # Pantalla de espera para gerencia no activada
│   │   └── api/               # Endpoints REST protegidos
│   ├── components/            # KanbanBoard, TimelineView, PhaseCard, Modales
│   └── lib/                   # Tipos TypeScript, cliente Supabase, Auth JWT
├── supabase/
│   └── schema.sql             # Definición completa de tablas e índices DDL
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 📄 Licencia

Uso interno corporativo — **Patprimo & Pash**. Todos los derechos reservados.
