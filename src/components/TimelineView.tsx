'use client';

import React, { useState } from 'react';
import {
  CircleDashed,
  PlayCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Lock,
} from 'lucide-react';
import { Phase } from '@/lib/types';
import BlockHistoryModal from './BlockHistoryModal';

interface TimelineViewProps {
  phases: Phase[];
}

export default function TimelineView({ phases }: TimelineViewProps) {
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);

  const sortedPhases = [...phases].sort((a, b) => a.orden - b.orden);

  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'Terminado':
      case 'Productivo':
      case 'Completado':
        return {
          color: 'bg-emerald-500 text-white',
          border: 'border-emerald-500',
          bg: 'bg-emerald-50',
          badge: 'bg-emerald-100 text-emerald-800',
          icon: CheckCircle2,
          label: 'Terminado',
        };
      case 'En proceso':
      case 'En progreso':
      case 'Desarrollo':
        return {
          color: 'bg-blue-600 text-white',
          border: 'border-blue-500',
          bg: 'bg-blue-50',
          badge: 'bg-blue-100 text-blue-800',
          icon: PlayCircle,
          label: 'En proceso',
        };
      case 'Bloqueado':
        return {
          color: 'bg-rose-600 text-white animate-pulse',
          border: 'border-rose-500',
          bg: 'bg-rose-50',
          badge: 'bg-rose-100 text-rose-800',
          icon: AlertTriangle,
          label: 'Bloqueado',
        };
      case 'Sin iniciar':
      default:
        return {
          color: 'bg-slate-500 text-white',
          border: 'border-slate-400',
          bg: 'bg-slate-50',
          badge: 'bg-slate-200 text-slate-700',
          icon: CircleDashed,
          label: status || 'Sin iniciar',
        };
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Línea de Tiempo y Etapas del Proyecto
            </h3>
            <p className="text-xs text-slate-500">
              Secuencia cronológica de tareas con estados y alertas de bloqueo
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              Sin iniciar
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              En proceso
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600 inline-block animate-pulse" />
              Bloqueado
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Terminado
            </span>
          </div>
        </div>

        {/* Timeline steps */}
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6 sm:space-y-8 my-4">
          {sortedPhases.map((phase, idx) => {
            const st = getStatusDetails(phase.estado);
            const Icon = st.icon;
            const isBlocked = phase.estado === 'Bloqueado';
            const activeBlock = phase.ultimo_bloqueo;

            return (
              <div key={phase.id} className="relative group">
                {/* Node icon on line */}
                <div
                  className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full ${st.color} flex items-center justify-center shadow-xs ring-4 ring-white`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>

                {/* Content card */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    isBlocked
                      ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200'
                      : 'bg-slate-50/80 hover:bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">
                        Paso {idx + 1}
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                        {phase.nombre}
                      </h4>
                      {phase.es_levantamiento && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800">
                          <Lock className="w-3 h-3 text-purple-600" />
                          Fase Fija
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${st.badge}`}
                      >
                        {st.label}
                      </span>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {phase.estimacion_horas ?? (phase.estimacion_dias ? phase.estimacion_dias * 8 : 40)} hrs
                        <span className="text-blue-500 font-normal ml-1">({phase.estimacion_dias || 1}d)</span>
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  {(phase.fecha_inicio_estimada || phase.fecha_fin_estimada) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Inicio:{' '}
                        <strong>
                          {phase.fecha_inicio_estimada
                            ? new Date(phase.fecha_inicio_estimada).toLocaleDateString('es-CO')
                            : 'N/D'}
                        </strong>{' '}
                        | Fin estimado:{' '}
                        <strong>
                          {phase.fecha_fin_estimada
                            ? new Date(phase.fecha_fin_estimada).toLocaleDateString('es-CO')
                            : 'N/D'}
                        </strong>
                      </span>
                    </div>
                  )}

                  {/* If blocked, show clear highlight and button for popup */}
                  {isBlocked && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-rose-200 shadow-2xs">
                      <div className="flex items-center justify-between gap-2 text-rose-800 font-bold text-xs mb-1">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          ALERTA DE BLOQUEO ACTIVO
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedPhase(phase)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 underline font-medium"
                        >
                          Ver bitácora completa
                        </button>
                      </div>
                      {activeBlock && (
                        <p className="text-xs text-slate-700 italic">
                          &ldquo;{activeBlock.comentario}&rdquo;
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        Reportado por {activeBlock?.bloqueado_por || 'Administrador'} el{' '}
                        {activeBlock?.fecha_bloqueo
                          ? new Date(activeBlock.fecha_bloqueo).toLocaleDateString('es-CO')
                          : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Block History Modal */}
      <BlockHistoryModal
        phase={selectedPhase}
        isOpen={Boolean(selectedPhase)}
        onClose={() => setSelectedPhase(null)}
      />
    </>
  );
}
