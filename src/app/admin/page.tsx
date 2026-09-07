'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FolderPlus,
  Layers,
  Users,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  Edit,
  Trash2,
  ArrowRight,
  TrendingUp,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import { Project, UserSession } from '@/lib/types';
import Navbar from '@/components/Navbar';
import MetricCard from '@/components/MetricCard';
import ProjectModal from '@/components/ProjectModal';
import UsersManager from '@/components/UsersManager';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'proyectos' | 'usuarios'>('proyectos');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');

  // Project Modal
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

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

  const fetchPendingUsers = async () => {
    try {
      const res = await fetch('/api/gerencia-users');
      const data = await res.json();
      if (res.ok && Array.isArray(data.users)) {
        const pending = data.users.filter((u: any) => !u.activo).length;
        setPendingUsersCount(pending);
      }
    } catch {
      // ignore
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchProjects();
    fetchPendingUsers();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'usuarios') {
        setActiveTab('usuarios');
      }
    }
  }, []);

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`¿Estás seguro de eliminar el proyecto "${project.nombre}" y todas sus fases?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
      } else {
        const err = await res.json();
        alert(err.error || 'Error al eliminar');
      }
    } catch {
      alert('Error de conexión al eliminar');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs font-semibold text-slate-400">
        Verificando credenciales de administrador...
      </div>
    );
  }

  // Calculate high-level KPIs
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.estado !== 'Cerrado' && p.estado !== 'Pausado').length;
  const blockedProjects = projects.filter((p) => (p.bloqueos_activos || 0) > 0).length;
  const avgProgress =
    totalProjects > 0
      ? Math.round(
          projects.reduce((acc, p) => acc + (p.avance_porcentaje || 0), 0) / totalProjects
        )
      : 0;

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

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.cliente && p.cliente.toLowerCase().includes(search.toLowerCase())) ||
      (p.responsable && p.responsable.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      filterStatus === 'Todos' ||
      (filterStatus === 'Bloqueado' ? (p.bloqueos_activos || 0) > 0 : p.estado === filterStatus);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Mobile Tab Switcher */}
        <div className="flex sm:hidden bg-slate-200 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('proyectos')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'proyectos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Proyectos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('usuarios')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'usuarios'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Gestión Usuarios</span>
            {pendingUsersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {pendingUsersCount}
              </span>
            )}
          </button>
        </div>

        {/* Banner de alerta si hay solicitudes pendientes de autorización */}
        {pendingUsersCount > 0 && activeTab === 'proyectos' && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  {pendingUsersCount} {pendingUsersCount === 1 ? 'usuario esperando autorización' : 'usuarios esperando autorización'}
                </h4>
                <p className="text-xs text-amber-700">
                  Hay solicitudes de acceso de Gerencia pendientes por aprobar para ingresar a la plataforma.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('usuarios')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Users className="w-4 h-4" />
              Revisar y Aprobar Usuarios
            </button>
          </div>
        )}

        {activeTab === 'usuarios' ? (
          <UsersManager />
        ) : (
          <>
            {/* KPI Cards Row (Compact 2x2 on mobile) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <MetricCard
                title="Total Proyectos"
                value={totalProjects}
                subtitle="Proyectos registrados"
                icon={Layers}
                color="blue"
              />
              <MetricCard
                title="Proyectos Activos"
                value={activeProjects}
                subtitle="En desarrollo continuo"
                icon={TrendingUp}
                color="emerald"
              />
              <MetricCard
                title="Con Bloqueos"
                value={blockedProjects}
                subtitle={blockedProjects > 0 ? 'Requieren desbloqueo' : 'Sin alertas críticas'}
                icon={AlertTriangle}
                color={blockedProjects > 0 ? 'rose' : 'slate'}
              />
              <MetricCard
                title="Avance Promedio"
                value={`${avgProgress}%`}
                subtitle="Cumplimiento de fases"
                icon={CheckCircle2}
                color="amber"
              />
            </div>

            {/* Actions & Filters Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por proyecto, cliente o responsable..."
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['Todos', 'Desarrollo', 'Análisis TI', 'En tendency', 'Productivo', 'Bloqueado', 'Pausado'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        filterStatus === st
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProjectToEdit(null);
                  setIsProjectModalOpen(true);
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
              >
                <FolderPlus className="w-4 h-4" />
                Nuevo Proyecto
              </button>
            </div>

            {/* Project List */}
            {loading ? (
              <div className="py-20 text-center text-xs font-medium text-slate-400">
                Cargando proyectos de Patprimo & Pash...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No se encontraron proyectos</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {search || filterStatus !== 'Todos'
                    ? 'Intenta ajustar los filtros de búsqueda.'
                    : 'Crea tu primer proyecto para comenzar a gestionar tareas con el tablero Kanban.'}
                </p>
                {!search && filterStatus === 'Todos' && (
                  <button
                    type="button"
                    onClick={() => {
                      setProjectToEdit(null);
                      setIsProjectModalOpen(true);
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <FolderPlus className="w-4 h-4" />
                    Crear Proyecto
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {filteredProjects.map((project) => {
                  const hasBlocks = (project.bloqueos_activos || 0) > 0;
                  const totalPhases = project.phases?.length || 0;
                  const completedPhases =
                    project.phases?.filter((p) => p.estado === 'Terminado').length || 0;

                  return (
                    <div
                      key={project.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Status badges & client */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                            {project.cliente || 'Patprimo'}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {hasBlocks && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 animate-pulse border border-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                {project.bloqueos_activos}{' '}
                                {project.bloqueos_activos === 1 ? 'Bloqueo' : 'Bloqueos'}
                              </span>
                            )}

                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getTendencyBadgeColor(
                                project.estado
                              )}`}
                            >
                              <span className="text-[10px] font-medium text-slate-400">Tendency:</span>
                              {project.estado}
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-snug">
                          {project.nombre}
                        </h3>
                        {project.descripcion && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5">
                            {project.descripcion}
                          </p>
                        )}

                        {/* Progress Bar (% Avance Automático) */}
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-semibold text-slate-700">
                              Avance del Proyecto
                            </span>
                            <span className="font-bold text-slate-900">
                              {project.avance_porcentaje}% ({completedPhases}/{totalPhases} tareas)
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
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
                        </div>

                        {/* Meta information: Multiple Responsibles & Total Hours */}
                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mr-0.5">
                              <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              Responsables:
                            </span>
                            {((project.responsables_lista && project.responsables_lista.length > 0)
                              ? project.responsables_lista
                              : (project.responsable || '').split(',').map((r) => r.trim()).filter(Boolean)
                            ).map((person, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                {person}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-semibold">
                              <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>
                                {project.duracion_total_horas ?? (project.duracion_total_dias ? project.duracion_total_dias * 8 : 0)} hrs est.
                              </span>
                              <span className="text-blue-400 font-normal">
                                ({project.duracion_total_dias || 0}d)
                              </span>
                            </div>

                            {(project.fecha_inicio || project.fecha_fin_estimada) && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                <Calendar className="w-3 h-3 shrink-0" />
                                <span>
                                  {project.fecha_inicio
                                    ? new Date(project.fecha_inicio).toLocaleDateString('es-CO', {
                                        day: 'numeric',
                                        month: 'short',
                                      })
                                    : 'N/D'}{' '}
                                  -{' '}
                                  {project.fecha_fin_estimada
                                    ? new Date(project.fecha_fin_estimada).toLocaleDateString('es-CO', {
                                        day: 'numeric',
                                        month: 'short',
                                      })
                                    : 'N/D'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setProjectToEdit(project);
                              setIsProjectModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar proyecto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(project)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar proyecto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <Link
                          href={`/admin/proyectos/${project.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                        >
                          <FolderKanban className="w-3.5 h-3.5" />
                          <span>Tablero & Tareas</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setProjectToEdit(null);
        }}
        onSaved={fetchProjects}
        projectToEdit={projectToEdit}
      />
    </div>
  );
}
