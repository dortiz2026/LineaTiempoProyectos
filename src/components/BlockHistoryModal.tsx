'use client';

import React from 'react';
import { History, X, AlertCircle, CheckCircle, Calendar, User } from 'lucide-react';
import { Phase } from '@/lib/types';

interface BlockHistoryModalProps {
  phase: Phase | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BlockHistoryModal({
  phase,
  isOpen,
  onClose,
}: BlockHistoryModalProps) {
  if (!isOpen || !phase) return null;

  const blocks = phase.blocks || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-800">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-slate-900">
                Historial de Bloqueos
              </h3>
              <p className="text-xs text-slate-500">{phase.nombre}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4">
          {blocks.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              Esta fase no registra bloqueos en su historial.
            </div>
          ) : (
            blocks.map((b, idx) => (
              <div
                key={b.id || idx}
                className={`p-4 rounded-xl border transition-all ${
                  b.activo
                    ? 'bg-rose-50/50 border-rose-200 shadow-xs'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      b.activo
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {b.activo ? (
                      <>
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        Bloqueo Activo
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Resuelto / Desbloqueado
                      </>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(b.fecha_bloqueo).toLocaleString('es-CO')}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-medium text-slate-800 mb-2.5">
                  &ldquo;{b.comentario}&rdquo;
                </p>

                <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Reportado por:</span>
                    <strong className="text-slate-700">{b.bloqueado_por}</strong>
                  </div>
                  {!b.activo && b.fecha_desbloqueo && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <CheckCircle className="w-3 h-3" />
                      <span>
                        Desbloqueado el{' '}
                        {new Date(b.fecha_desbloqueo).toLocaleString('es-CO')}
                        {b.desbloqueado_por ? ` por ${b.desbloqueado_por}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
