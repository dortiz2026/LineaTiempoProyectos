'use client';

import React, { useState } from 'react';
import {
  CircleDashed,
  PlayCircle,
  AlertOctagon,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { Phase, PhaseStatus } from '@/lib/types';
import PhaseCard from './PhaseCard';
import BlockerModal from './BlockerModal';
import UnblockModal from './UnblockModal';
import BlockHistoryModal from './BlockHistoryModal';

interface KanbanBoardProps {
  projectId: string;
  phases: Phase[];
  isAdmin: boolean;
  onPhasesChanged: () => void;
  onOpenNewPhaseModal?: () => void;
}

const COLUMNS: {
  id: PhaseStatus;
  title: string;
  icon: any;
  headerColor: string;
  badgeColor: string;
  desc: string;
}[] = [
  {
    id: 'Sin iniciar',
    title: 'Sin iniciar',
    icon: CircleDashed,
    headerColor: 'border-t-slate-400 bg-slate-50/90',
    badgeColor: 'bg-slate-200 text-slate-700',
    desc: 'Tareas pendientes por comenzar',
  },
  {
    id: 'En proceso',
    title: 'En proceso',
    icon: PlayCircle,
    headerColor: 'border-t-blue-500 bg-blue-50/50',
    badgeColor: 'bg-blue-100 text-blue-700',
    desc: 'En ejecución activa',
  },
  {
    id: 'Bloqueado',
    title: 'Bloqueado',
    icon: AlertOctagon,
    headerColor: 'border-t-rose-500 bg-rose-50/70',
    badgeColor: 'bg-rose-100 text-rose-800 animate-pulse',
    desc: 'Impedimentos que requieren desbloqueo',
  },
  {
    id: 'Terminado',
    title: 'Terminado',
    icon: CheckCircle2,
    headerColor: 'border-t-emerald-500 bg-emerald-50/50',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    desc: 'Completado con éxito',
  },
];

export default function KanbanBoard({
  projectId,
  phases,
  isAdmin,
  onPhasesChanged,
  onOpenNewPhaseModal,
}: KanbanBoardProps) {
  // Local state for 0ms instantaneous optimistic updates (Linear-style feel)
  const [localPhases, setLocalPhases] = useState<Phase[]>(phases);
  const [draggedPhase, setDraggedPhase] = useState<Phase | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<PhaseStatus | null>(null);

  // Synchronize when parent passes new phases
  React.useEffect(() => {
    setLocalPhases(phases);
  }, [phases]);

  // Modals state
  const [phaseToBlock, setPhaseToBlock] = useState<Phase | null>(null);
  const [phaseToUnblock, setPhaseToUnblock] = useState<Phase | null>(null);
  const [phaseForHistory, setPhaseForHistory] = useState<Phase | null>(null);

  const handleDragStart = (e: React.DragEvent, phase: Phase) => {
    setDraggedPhase(phase);
    e.dataTransfer.setData('text/plain', phase.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: PhaseStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: PhaseStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedPhase || draggedPhase.estado === targetColumn) {
      setDraggedPhase(null);
      return;
    }

    const currentPhase = draggedPhase;
    setDraggedPhase(null);

    // Case 1: Moving to Bloqueado -> MUST prompt for comment
    if (targetColumn === 'Bloqueado') {
      setPhaseToBlock(currentPhase);
      return;
    }

    // Case 2: Moving FROM Bloqueado to any other column -> Admin unblocks
    if (currentPhase.estado === 'Bloqueado') {
      setPhaseToUnblock(currentPhase);
      return;
    }

    // Case 3: Standard status move (Instantaneous Optimistic Update)
    const previousPhases = [...localPhases];

    // Move immediately in UI! (0ms lag, no page reload)
    setLocalPhases((prev) =>
      prev.map((p) => (p.id === currentPhase.id ? { ...p, estado: targetColumn } : p))
    );

    try {
      const res = await fetch(`/api/phases/${currentPhase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: targetColumn }),
      });

      if (!res.ok) {
        // Rollback on server error
        setLocalPhases(previousPhases);
        const err = await res.json();
        alert(err.error || 'Error al actualizar el estado de la fase');
        return;
      }

      // Sync overall project metrics in background without flicker
      onPhasesChanged();
    } catch {
      setLocalPhases(previousPhases);
      alert('Error de conexión al mover la fase');
    }
  };

  const handleConfirmBlock = async (comment: string) => {
    if (!phaseToBlock) return;
    const targetId = phaseToBlock.id;
    const previousPhases = [...localPhases];

    // Optimistically update to blocked
    setLocalPhases((prev) =>
      prev.map((p) =>
        p.id === targetId
          ? {
              ...p,
              estado: 'Bloqueado',
              ultimo_bloqueo: {
                id: 'temp-' + Date.now(),
                phase_id: p.id,
                comentario: comment,
                bloqueado_por: 'Administrador',
                fecha_bloqueo: new Date().toISOString(),
                fecha_desbloqueo: null,
                desbloqueado_por: null,
                activo: true,
              },
            }
          : p
      )
    );

    try {
      const res = await fetch(`/api/phases/${targetId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario: comment }),
      });

      if (!res.ok) {
        setLocalPhases(previousPhases);
        const err = await res.json();
        throw new Error(err.error || 'Error al bloquear la fase');
      }

      onPhasesChanged();
    } catch (err: any) {
      setLocalPhases(previousPhases);
      throw err;
    }
  };

  const handleConfirmUnblock = async (newStatus: PhaseStatus) => {
    if (!phaseToUnblock) return;
    const targetId = phaseToUnblock.id;
    const previousPhases = [...localPhases];

    // Optimistically unblock
    setLocalPhases((prev) =>
      prev.map((p) =>
        p.id === targetId
          ? {
              ...p,
              estado: newStatus,
              ultimo_bloqueo: null,
            }
          : p
      )
    );

    try {
      const res = await fetch(`/api/phases/${targetId}/unblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevo_estado: newStatus }),
      });

      if (!res.ok) {
        setLocalPhases(previousPhases);
        const err = await res.json();
        throw new Error(err.error || 'Error al desbloquear la fase');
      }

      onPhasesChanged();
    } catch (err: any) {
      setLocalPhases(previousPhases);
      throw err;
    }
  };

  const handleDeletePhase = async (phase: Phase) => {
    if (!confirm(`¿Estás seguro de eliminar la fase "${phase.nombre}"?`)) return;
    const previousPhases = [...localPhases];

    // Optimistically remove
    setLocalPhases((prev) => prev.filter((p) => p.id !== phase.id));

    try {
      const res = await fetch(`/api/phases/${phase.id}`, { method: 'DELETE' });
      if (!res.ok) {
        setLocalPhases(previousPhases);
        const err = await res.json();
        alert(err.error || 'Error al eliminar la fase');
        return;
      }
      onPhasesChanged();
    } catch {
      setLocalPhases(previousPhases);
      alert('Error de conexión al eliminar la fase');
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start pb-6 pt-1">
        {COLUMNS.map((col) => {
          const colPhases = localPhases.filter((p) => p.estado === col.id);
          const Icon = col.icon;
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`w-full flex flex-col rounded-2xl bg-slate-100/80 border border-slate-200 overflow-hidden transition-all duration-150 min-h-[420px] shadow-2xs ${
                isOver ? 'ring-2 ring-blue-500 bg-blue-50/50 scale-[1.01]' : ''
              }`}
            >
              {/* Column Header */}
              <div
                className={`p-3.5 border-t-4 border-b border-slate-200 flex flex-col gap-1 ${col.headerColor}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate mr-1">
                    <Icon className="w-4 h-4 text-slate-700 shrink-0" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 truncate">
                      {col.title}
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${col.badgeColor}`}
                  >
                    {colPhases.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal truncate">
                  {col.desc}
                </p>
              </div>

              {/* Cards Container */}
              <div className="p-3 flex-1 flex flex-col gap-3">
                {colPhases.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-12 px-4 text-center">
                    <p className="text-xs text-slate-400 font-medium">
                      {isAdmin ? 'Arrastra una tarea aquí' : 'Sin tareas en este estado'}
                    </p>
                  </div>
                ) : (
                  colPhases.map((phase) => (
                    <PhaseCard
                      key={phase.id}
                      phase={phase}
                      isAdmin={isAdmin}
                      onDragStart={handleDragStart}
                      onBlockClick={(p) => setPhaseToBlock(p)}
                      onUnblockClick={(p) => setPhaseToUnblock(p)}
                      onHistoryClick={(p) => setPhaseForHistory(p)}
                      onDeleteClick={handleDeletePhase}
                    />
                  ))
                )}

                {/* Add Task button in Sin iniciar column */}
                {isAdmin && col.id === 'Sin iniciar' && onOpenNewPhaseModal && (
                  <button
                    type="button"
                    onClick={onOpenNewPhaseModal}
                    className="w-full mt-1 py-2.5 px-3 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-white text-slate-600 hover:text-blue-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    Nueva Tarea / Etapa
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Blocker Modal */}
      <BlockerModal
        phase={phaseToBlock}
        isOpen={Boolean(phaseToBlock)}
        onClose={() => setPhaseToBlock(null)}
        onConfirm={handleConfirmBlock}
      />

      {/* Unblock Modal */}
      <UnblockModal
        phase={phaseToUnblock}
        isOpen={Boolean(phaseToUnblock)}
        onClose={() => setPhaseToUnblock(null)}
        onConfirm={handleConfirmUnblock}
      />

      {/* Block History Modal */}
      <BlockHistoryModal
        phase={phaseForHistory}
        isOpen={Boolean(phaseForHistory)}
        onClose={() => setPhaseForHistory(null)}
      />
    </>
  );
}
