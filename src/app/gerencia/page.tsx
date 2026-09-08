'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layers,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Search,
  Clock,
  User as UserIcon,
  Calendar,
  Eye,
  X,
  Building2,
  FolderKanban,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { Project, UserSession } from '@/lib/types';
import Navbar from '@/components/Navbar';
import MetricCard from '@/components/MetricCard';
import TimelineView from '@/components/TimelineView';

export default function GerenciaDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');

  // Selected project for timeline detail modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (!data.session) {
        router.push('/login');
        return;
      }
      setUser(data.session);
    } catch {
      router.push('/login');
    }
  };

  const fetchProjects = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects || []);
      }
    } catch {
      // ignore
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchProjects();

    // Auto-sync real-time every 6 seconds for executive dashboard
    const interval = setInterval(() => {
      fetchProjects(true);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs font-semibold text-slate-400">
        Cargando vista ejecutiva de gerencia...
      </div>
    );
  }

  // KPIs
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.estado !== 'Cerrado' && p.estado !== 'Pausado').length;
  const blockedProjects = projects.filter((p) => (p.bloqueos_activos || 0) > 0).length;
  const avgProgress =
    totalProjects > 0
      ? Math.round(
          projects.reduce((acc, p) => acc + (p.avance_porcentaje || 0), 0) / totalProjects
        )
      : 0;

  const ALL_FILTER_STATUSES = [
    { id: 'Todos', label: 'Todos', activeColor: 'bg-slate-900 text-white', dot: 'bg-slate-400' },
    { id: 'En entendimiento', label: 'En entendimiento', activeColor: 'bg-blue-600 text-white', dot: 'bg-blue-500' },
    { id: 'Levantamiento', label: 'Levantamiento', activeColor: 'bg-purple-600 text-white', dot: 'bg-purple-500' },
    { id: 'Análisis TI', label: 'Análisis TI', activeColor: 'bg-indigo-600 text-white', dot: 'bg-indigo-500' },
    { id: 'En tendency', label: 'En tendency', activeColor: 'bg-sky-600 text-white', dot: 'bg-sky-500' },
    { id: 'Desarrollo', label: 'Desarrollo', activeColor: 'bg-amber-600 text-white', dot: 'bg-amber-500' },
    { id: 'Pruebas funcionales', label: 'Pruebas', activeColor: 'bg-teal-600 text-white', dot: 'bg-teal-500' },
    { id: 'Productivo', label: 'Productivo', activeColor: 'bg-emerald-600 text-white', dot: 'bg-emerald-500' },
    { id: 'Bloqueado', label: 'Con Bloqueos', activeColor: 'bg-rose-600 text-white', dot: 'bg-rose-500' },
    { id: 'Pausado', label: 'Pausados', activeColor: 'bg-amber-800 text-white', dot: 'bg-amber-600' },
    { id: 'Cerrado', label: 'Cerrados', activeColor: 'bg-slate-700 text-white', dot: 'bg-slate-500' },
  ];

  const getStatusCount = (statusId: string) => {
    if (statusId === 'Todos') return projects.length;
    if (statusId === 'Bloqueado') return projects.filter((p) => (p.bloqueos_activos || 0) > 0).length;
    if (statusId === 'Pruebas funcionales') {
      return projects.filter((p) => p.estado === 'Pruebas funcionales' || p.estado === 'Pruebas unitarias').length;
    }
    return projects.filter((p) => p.estado === statusId).length;
  };

  const getTendencyBadge = (status: string) => {
    switch (status) {
      case 'Productivo':
        return {
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'Desarrollo':
        return {
          color: 'bg-amber-50 text-amber-900 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'Análisis TI':
        return {
          color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dot: 'bg-indigo-500',
        };
      case 'En tendency':
        return {
          color: 'bg-sky-50 text-sky-800 border-sky-200',
          dot: 'bg-sky-500',
        };
      case 'Levantamiento':
        return {
          color: 'bg-purple-50 text-purple-800 border-purple-200',
          dot: 'bg-purple-500',
        };
      case 'Pruebas unitarias':
      case 'Pruebas funcionales':
        return {
          color: 'bg-teal-50 text-teal-800 border-teal-200',
          dot: 'bg-teal-500',
        };
      case 'Pausado':
        return {
          color: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
        };
      case 'Cerrado':
        return {
          color: 'bg-zinc-100 text-zinc-600 border-zinc-300',
          dot: 'bg-zinc-400',
        };
      case 'En entendimiento':
      default:
        return {
          color: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
        };
    }
  };

  // Filtered
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.cliente && p.cliente.toLowerCase().includes(search.toLowerCase())) ||
      (p.responsable && p.responsable.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      filterStatus === 'Todos' ||
      (filterStatus === 'Bloqueado'
        ? (p.bloqueos_activos || 0) > 0
        : filterStatus === 'Pruebas funcionales'
        ? p.estado === 'Pruebas funcionales' || p.estado === 'Pruebas unitarias'
        : p.estado === filterStatus);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Tablero Ejecutivo de Proyectos
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Visualización en tiempo real del progreso, etapas y bloqueos de Patprimo & Pash
            </p>
          </div>
          <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
            Modo: <strong className="text-emerald-700 font-semibold">Solo Lectura (Gerencia)</strong>
          </div>
        </div>

        {/* KPIs (Compact 2x2 on mobile, 4 in row on desktop to avoid long scroll) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          <MetricCard
            title="Total Proyectos"
            value={totalProjects}
            subtitle="Cartera corporativa"
            icon={Layers}
            color="blue"
          />
          <MetricCard
            title="En Ejecución"
            value={activeProjects}
            subtitle="Proyectos activos"
            icon={TrendingUp}
            color="emerald"
          />
          <MetricCard
            title="Con Bloqueos"
            value={blockedProjects}
            subtitle={blockedProjects > 0 ? 'Con impedimentos' : 'Flujo normal'}
            icon={AlertTriangle}
            color={blockedProjects > 0 ? 'rose' : 'slate'}
          />
          <MetricCard
            title="Avance Global"
            value={`${avgProgress}%`}
            subtitle="Promedio consolidado"
            icon={CheckCircle2}
            color="amber"
          />
        </div>

        {/* Search Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por proyecto, marca o responsable..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dedicated Status Filter Bar (Full width, No cutting off, Live project counts) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-2.5 sm:p-3 shadow-xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1.5 pr-2 border-r border-slate-200 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Estados</span>
            </div>
            {ALL_FILTER_STATUSES.map((st) => {
              const count = getStatusCount(st.id);
              const isSelected = filterStatus === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setFilterStatus(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? `${st.activeColor} shadow-xs scale-[1.02]`
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isSelected ? 'bg-white' : st.dot
                    }`}
                  />
                  <span>{st.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Projects List (Horizontal view, 1 project per line) */}
        {loading ? (
          <div className="py-16 text-center text-xs font-medium text-slate-400">
            Cargando proyectos...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No se encontraron proyectos</h3>
            <p className="text-xs text-slate-500 mt-0.5">Intenta con otros criterios de búsqueda.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredProjects.map((project) => {
              const hasBlocks = (project.bloqueos_activos || 0) > 0;
              const totalPhases = project.phases?.length || 0;
              const completedPhases =
                project.phases?.filter((p) => p.estado === 'Terminado').length || 0;
              const badge = getTendencyBadge(project.estado);

              const responsables =
                project.responsables_lista && project.responsables_lista.length > 0
                  ? project.responsables_lista
                  : (project.responsable || '')
                      .split(',')
                      .map((r) => r.trim())
                      .filter(Boolean);

              const totalHoras =
                project.duracion_total_horas ??
                (project.duracion_total_dias ? project.duracion_total_dias * 8 : 0);

              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-4 sm:p-5 shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                >
                  {/* Col 1: Identification, Client, Title, Description, Multiple Responsibles */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200/80">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {project.cliente || 'Patprimo'}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border shadow-2xs ${badge.color}`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${badge.dot}`} />
                        <span>{project.estado}</span>
                      </span>

                      {hasBlocks && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-rose-100 text-rose-800 animate-pulse border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          {project.bloqueos_activos}{' '}
                          {project.bloqueos_activos === 1 ? 'Bloqueo' : 'Bloqueos'}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
                      {project.nombre}
                    </h3>

                    {project.descripcion && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {project.descripcion}
                      </p>
                    )}

                    {/* Multiple Responsables list */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mr-0.5">
                        <UserIcon className="w-3 h-3 text-slate-400" />
                        Responsables:
                      </span>
                      {responsables.length > 0 ? (
                        responsables.map((person, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-700"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {person}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Sin asignar</span>
                      )}
                    </div>
                  </div>

                  {/* Col 2: Current Phase */}
                  <div className="lg:w-60 shrink-0 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/80 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Etapa / Tarea Actual
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate mt-0.5">
                      {project.fase_actual || 'Sin tareas'}
                    </p>
                    {hasBlocks ? (
                      <span className="text-[10px] font-semibold text-rose-600 mt-0.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        Impedimento activo
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {completedPhases} de {totalPhases} tareas completadas
                      </span>
                    )}
                  </div>

                  {/* Col 3: Progress & Hours Estimation */}
                  <div className="lg:w-72 shrink-0 flex flex-col justify-between gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 text-[11px] sm:text-xs">
                          Avance del Proyecto
                        </span>
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {project.avance_porcentaje}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                        <Clock className="w-3 h-3 text-blue-500" />
                        <span>{totalHoras} hrs est.</span>
                        <span className="text-blue-400 font-normal">
                          ({project.duracion_total_dias || 0}d)
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                        <span>Ver Etapas</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Project Detail Modal with TimelineView */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                  {selectedProject.cliente || 'Patprimo'}
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {selectedProject.nombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Estado General
                  </span>
                  <div className="mt-0.5">
                    {(() => {
                      const badge = getTendencyBadge(selectedProject.estado);
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${badge.dot}`} />
                          <span>{selectedProject.estado}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Responsables
                  </span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {(selectedProject.responsables_lista && selectedProject.responsables_lista.length > 0
                      ? selectedProject.responsables_lista
                      : (selectedProject.responsable || '').split(',').map((r) => r.trim()).filter(Boolean)
                    ).map((person, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-slate-200 text-slate-800"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {person}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Duración Estimada
                  </span>
                  <p className="font-bold text-xs text-blue-700 mt-0.5">
                    {selectedProject.duracion_total_horas ?? (selectedProject.duracion_total_dias ? selectedProject.duracion_total_dias * 8 : 0)} hrs
                    <span className="text-slate-400 font-normal ml-1">({selectedProject.duracion_total_dias || 0} días)</span>
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    % Avance
                  </span>
                  <p className="font-bold text-xs text-emerald-600 mt-0.5">
                    {selectedProject.avance_porcentaje}%
                  </p>
                </div>
              </div>

              {/* Timeline of phases */}
              <TimelineView phases={selectedProject.phases || []} />
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
