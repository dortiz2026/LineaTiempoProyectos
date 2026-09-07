'use client';

import React from 'react';
import {
  GripVertical,
  Clock,
  Calendar,
  AlertTriangle,
  History,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
} from 'lucide-react';
import { Phase } from '@/lib/types';

interface PhaseCardProps {
  phase: Phase;
  isAdmin?: boolean;
  onDragStart?: (e: React.DragEvent, phase: Phase) => void;
  onBlockClick?: (phase: Phase) => void;
  onUnblockClick?: (phase: Phase) => void;
  onHistoryClick?: (phase: Phase) => void;
  onDeleteClick?: (phase: Phase) => void;
}

export default function PhaseCard({
  phase,
  isAdmin = false,
  onDragStart,
  onBlockClick,
  onUnblockClick,
  onHistoryClick,
  onDeleteClick,
}: PhaseCardProps) {
  const isBlocked = phase.estado === 'Bloqueado';
  const isCompleted = phase.estado === 'Terminado';
  const activeBlock = phase.ultimo_bloqueo;
  const hasHistory = Boolean(phase.blocks && phase.blocks.length > 0);

  return (
    <div
      draggable={isAdmin}
      onDragStart={(e) => onDragStart && onDragStart(e, phase)}
      className={`group relative bg-white rounded-xl border p-4 shadow-2xs hover:shadow-md transition-all ${
        isAdmin ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        isBlocked
          ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20'
          : isCompleted
          ? 'border-emerald-200 bg-emerald-50/10'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top row: tags & drag indicator */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {phase.es_levantamiento && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              <Lock className="w-3 h-3 text-purple-500" />
              Etapa Fija Obligatoria
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-500" />
            {phase.estimacion_horas ?? (phase.estimacion_dias ? phase.estimacion_dias * 8 : 40)} hrs
            <span className="text-blue-400 font-normal">({phase.estimacion_dias || 1}d)</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          {hasHistory && onHistoryClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onHistoryClick(phase);
              }}
              title="Ver historial de bloqueos"
              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <History className="w-3.5 h-3.5" />
            </button>
          )}

          {isAdmin && onDeleteClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(phase);
              }}
              title="Eliminar tarea"
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {isAdmin && (
            <span className="text-slate-300 group-hover:text-slate-400 p-0.5">
              <GripVertical className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>

      {/* Phase Title */}
      <h4 className="font-semibold text-sm text-slate-800 tracking-tight leading-snug mb-2">
        {phase.nombre}
      </h4>

      {/* Dates row */}
      {(phase.fecha_inicio_estimada || phase.fecha_fin_estimada) && (
        <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2">
          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
          <span>
            {phase.fecha_inicio_estimada
              ? new Date(phase.fecha_inicio_estimada).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                })
              : 'Sin inicio'}{' '}
            -{' '}
            {phase.fecha_fin_estimada
              ? new Date(phase.fecha_fin_estimada).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                })
              : 'Sin fin'}
          </span>
        </div>
      )}

      {/* Blocker alert callout if blocked */}
      {isBlocked && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs">
          <div className="flex items-center gap-1.5 text-rose-800 font-semibold mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Fase Bloqueada</span>
          </div>
          {activeBlock && (
            <p className="text-[11px] text-slate-700 italic line-clamp-2 mb-2">
              &ldquo;{activeBlock.comentario}&rdquo;
            </p>
          )}

          {isAdmin && onUnblockClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUnblockClick(phase);
              }}
              className="w-full mt-1 py-1.5 px-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs transition-colors"
            >
              <Unlock className="w-3 h-3" />
              Desbloquear Fase
            </button>
          )}
        </div>
      )}
    </div>
  );
}
