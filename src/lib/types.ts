export type ProjectStatus =
  | 'En entendimiento'
  | 'Levantamiento'
  | 'En tendency'
  | 'Análisis TI'
  | 'Desarrollo'
  | 'Pruebas unitarias'
  | 'Pruebas funcionales'
  | 'Productivo'
  | 'Pausado'
  | 'Cerrado';

export type PhaseStatus =
  | 'Sin iniciar'
  | 'En proceso'
  | 'Bloqueado'
  | 'Terminado';

export interface Project {
  id: string;
  nombre: string;
  cliente: string | null;
  responsable: string | null;
  fecha_inicio: string | null;
  fecha_fin_estimada: string | null;
  descripcion: string | null;
  estado: ProjectStatus;
  created_at: string;
  updated_at?: string;
  // Computed fields
  phases?: Phase[];
  avance_porcentaje?: number;
  duracion_total_dias?: number;
  duracion_total_horas?: number;
  fase_actual?: string;
  bloqueos_activos?: number;
  responsables_lista?: string[];
}

export interface Phase {
  id: string;
  project_id: string;
  nombre: string;
  orden: number;
  es_levantamiento: boolean;
  estimacion_dias: number;
  estimacion_horas?: number;
  fecha_inicio_estimada: string | null;
  fecha_fin_estimada: string | null;
  estado: PhaseStatus;
  created_at: string;
  updated_at?: string;
  blocks?: PhaseBlock[];
  ultimo_bloqueo?: PhaseBlock | null;
}

export interface PhaseBlock {
  id: string;
  phase_id: string;
  comentario: string;
  bloqueado_por: string;
  fecha_bloqueo: string;
  fecha_desbloqueo: string | null;
  desbloqueado_por: string | null;
  activo: boolean;
}

export type TeamRole = 'admin' | 'pm' | 'developer';

export interface AdminUser {
  id: string;
  email: string;
  nombre: string;
  rol?: TeamRole;
  activo?: boolean;
  autorizado_por?: string | null;
  created_at: string;
}

export interface GerenciaAccess {
  id: string;
  email: string;
  activo: boolean;
  fecha_solicitud: string;
  fecha_activacion: string | null;
  activado_por?: string | null;
}

export interface UserSession {
  email: string;
  nombre: string;
  role: 'admin' | 'gerencia';
  teamRole?: TeamRole;
  activo: boolean;
}
