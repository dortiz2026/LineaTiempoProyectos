-- ==============================================================================
-- SCHEMA DDL: LÍNEA DE TIEMPO DE PROYECTOS PATPRIMO & PASH
-- Compatible con Supabase PostgreSQL
-- ==============================================================================

-- 1. Tabla de Usuarios Administradores
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Solicitudes de Acceso de Gerencia (Aprobadas por Admin)
CREATE TABLE IF NOT EXISTS public.gerencia_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_activacion TIMESTAMPTZ,
  activado_por TEXT
);

-- 3. Tabla de Proyectos (Macro-Estados corporativos Tendency)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  cliente TEXT,
  responsable TEXT,
  fecha_inicio DATE,
  fecha_fin_estimada DATE,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'En entendimiento' CHECK (
    estado IN (
      'En entendimiento',
      'Levantamiento',
      'En tendency',
      'Análisis TI',
      'Desarrollo',
      'Pruebas unitarias',
      'Pruebas funcionales',
      'Productivo',
      'Pausado',
      'Cerrado',
      'Activo'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Fases / Tareas dentro de cada Proyecto (Flujo operativo de avance)
CREATE TABLE IF NOT EXISTS public.phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 1,
  es_levantamiento BOOLEAN NOT NULL DEFAULT FALSE,
  estimacion_dias INTEGER NOT NULL DEFAULT 5,
  estimacion_horas INTEGER NOT NULL DEFAULT 40,
  fecha_inicio_estimada DATE,
  fecha_fin_estimada DATE,
  estado TEXT NOT NULL DEFAULT 'Sin iniciar' CHECK (
    estado IN (
      'Sin iniciar',
      'En proceso',
      'Bloqueado',
      'Terminado'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Bloqueos e Impedimentos
CREATE TABLE IF NOT EXISTS public.phase_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES public.phases(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  bloqueado_por TEXT NOT NULL,
  fecha_bloqueo TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_desbloqueo TIMESTAMPTZ,
  desbloqueado_por TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_phases_project_id ON public.phases(project_id);
CREATE INDEX IF NOT EXISTS idx_phases_orden ON public.phases(orden);
CREATE INDEX IF NOT EXISTS idx_phase_blocks_phase_id ON public.phase_blocks(phase_id);
CREATE INDEX IF NOT EXISTS idx_phase_blocks_activo ON public.phase_blocks(activo);
