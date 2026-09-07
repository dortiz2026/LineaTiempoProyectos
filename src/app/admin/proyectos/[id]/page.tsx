'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User as UserIcon,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Kanban,
  GitCommit,
  Edit,
  Building2,
} from 'lucide-react';
import { Project, UserSession } from '@/lib/types';
import Navbar from '@/components/Navbar';
import KanbanBoard from '@/components/KanbanBoard';
import TimelineView from '@/components/TimelineView';
import NewPhaseModal from '@/components/NewPhaseModal';
import ProjectModal from '@/components/ProjectModal';

export default function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [user, setUser] = useState<UserSession | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('kanban');

  // Modals
  const [isNewPhaseOpen, setIsNewPhaseOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (!data.session || data.session.role !== 'admin') {
        router.push('/login');
        return;
      }
      setUser(data.session);
    } catch {
      router.push('/login');
    }
  };

  const fetchProject = async (isInitial = false) => {
    try {
      if (isInitial && !project) {
        setLoading(true);
      }
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (res.ok) {
        setProject(data.project);
      } else {
        router.push('/admin');
      }
    } catch {
      router.push('/admin');
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSession();
    fetchProject(true);
  }, [projectId]);

  if (!user || loading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs font-semibold text-slate-400">
        Cargando detalles del proyecto...
      </div>
    );
  }

  const phases = project.phases || [];
  const totalPhases = phases.length;
  const completedPhases = phases.filter((p) => p.estado === 'Terminado').length;
  const hasBlocks = (project.bloqueos_activos || 0) > 0;

  const getTendencyBadgeColor = (status: string) => {
    switch (status) {
      case 'Productivo':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Desarrollo':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Análisis TI':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'En tendency':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Levantamiento':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Pruebas unitarias':
      case 'Pruebas funcionales':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Pausado':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Cerrado':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      case 'En entendimiento':
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Todos los Proyectos</span>
          </Link>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-200 p-1 rounded-xl border border-slate-300/60">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Tablero Linear (Tareas)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Línea de Tiempo</span>
            </button>
          </div>
        </div>

        {/* Project Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {project.cliente || 'Patprimo'}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getTendencyBadgeColor(
                    project.estado
                  )}`}
                >
                  <span className="text-[10px] font-medium text-slate-400">Tendency:</span>
                  {project.estado}
                </span>

                {hasBlocks && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 animate-pulse border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    {project.bloqueos_activos}{' '}
                    {project.bloqueos_activos === 1 ? 'Tarea Bloqueada' : 'Tareas Bloqueadas'}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                {project.nombre}
              </h1>

              {project.descripcion && (
                <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
                  {project.descripcion}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Responsables:</span>
                  {((project.responsables_lista && project.responsables_lista.length > 0)
                    ? project.responsables_lista
                    : (project.responsable || '').split(',').map((r) => r.trim()).filter(Boolean)
                  ).map((person, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {person}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    {project.duracion_total_horas ?? (project.duracion_total_dias ? project.duracion_total_dias * 8 : 0)} hrs estimadas
                  </span>
                  <span className="text-blue-400 font-normal">
                    ({project.duracion_total_dias || 0} días)
                  </span>
                </div>

                {(project.fecha_inicio || project.fecha_fin_estimada) && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {project.fecha_inicio
                        ? new Date(project.fecha_inicio).toLocaleDateString('es-CO')
                        : 'N/D'}{' '}
                      -{' '}
                      {project.fecha_fin_estimada
                        ? new Date(project.fecha_fin_estimada).toLocaleDateString('es-CO')
                        : 'N/D'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Progress & Edit Button */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 shrink-0 lg:w-72">
              <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-600">% Avance Global</span>
                  <span className="font-bold text-base text-slate-900">
                    {project.avance_porcentaje}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      project.avance_porcentaje === 100
                        ? 'bg-emerald-500'
                        : hasBlocks
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${project.avance_porcentaje || 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 text-right font-medium">
                  {completedPhases} de {totalPhases} tareas completadas
                </p>
              </div>

              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setIsEditProjectOpen(true)}
                  className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar Proyecto
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewPhaseOpen(true)}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nueva Tarea
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Board or Timeline */}
        {viewMode === 'kanban' ? (
          <KanbanBoard
            projectId={project.id}
            phases={phases}
            isAdmin={true}
            onPhasesChanged={fetchProject}
            onOpenNewPhaseModal={() => setIsNewPhaseOpen(true)}
          />
        ) : (
          <TimelineView phases={phases} />
        )}
      </main>

      {/* New Phase Modal */}
      <NewPhaseModal
        projectId={project.id}
        isOpen={isNewPhaseOpen}
        onClose={() => setIsNewPhaseOpen(false)}
        onCreated={fetchProject}
      />

      {/* Edit Project Modal */}
      <ProjectModal
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        onSaved={fetchProject}
        projectToEdit={project}
      />
    </div>
  );
}
