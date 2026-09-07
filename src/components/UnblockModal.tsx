'use client';

import React, { useState } from 'react';
import { CheckCircle2, X, AlertCircle, Calendar, User } from 'lucide-react';
import { Phase, PhaseStatus } from '@/lib/types';

interface UnblockModalProps {
  phase: Phase | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newStatus: PhaseStatus) => Promise<void>;
}

export default function UnblockModal({
  phase,
  isOpen,
  onClose,
  onConfirm,
}: UnblockModalProps) {
  const [newStatus, setNewStatus] = useState<PhaseStatus>('En proceso');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !phase) return null;

  const activeBlock = phase.ultimo_bloqueo;

  const STANDARD_STATES: PhaseStatus[] = [
    'En proceso',
    'Sin iniciar',
    'Terminado',
  ];

  const handleUnblock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await onConfirm(newStatus);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al desbloquear fase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-50/80 px-6 py-4 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-emerald-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-emerald-950">
                Desbloquear Tarea / Etapa
              </h3>
              <p className="text-xs text-emerald-700">Autorización de Administrador</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUnblock} className="p-6 space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Tarea bloqueada
            </span>
            <span className="text-sm font-bold text-slate-800 mt-0.5 block">
              {phase.nombre}
            </span>
          </div>

          {activeBlock && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2">
              <div className="flex items-center justify-between text-rose-800 font-semibold border-b border-rose-100 pb-1.5">
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Motivo reportado:
                </span>
                <span className="flex items-center gap-1 font-normal text-rose-600 text-[11px]">
                  <Calendar className="w-3 h-3" />
                  {new Date(activeBlock.fecha_bloqueo).toLocaleDateString('es-CO')}
                </span>
              </div>
              <p className="text-slate-700 italic">{activeBlock.comentario}</p>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                <User className="w-3 h-3" />
                Bloqueado por: <span className="font-medium">{activeBlock.bloqueado_por}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Estado al que pasará la tarea desbloqueada
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STANDARD_STATES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setNewStatus(st)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                    newStatus === st
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              {loading ? 'Desbloqueando...' : 'Desbloquear y Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
