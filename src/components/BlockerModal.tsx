'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { Phase } from '@/lib/types';

interface BlockerModalProps {
  phase: Phase | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => Promise<void>;
}

export default function BlockerModal({
  phase,
  isOpen,
  onClose,
  onConfirm,
}: BlockerModalProps) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !phase) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('El comentario del motivo del bloqueo es obligatorio.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm(comment.trim());
      setComment('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el bloqueo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden">
        {/* Header */}
        <div className="bg-rose-50/80 px-6 py-4 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-800">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-rose-950">
                Bloqueo de Fase
              </h3>
              <p className="text-xs text-rose-700">Se requiere registrar el motivo</p>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Fase a bloquear
            </span>
            <span className="text-sm font-bold text-slate-800 mt-0.5 block">
              {phase.nombre}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo del bloqueo <span className="text-rose-600">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Explica detalladamente la razón por la cual esta fase se encuentra bloqueada (ej. Esperando respuesta de cliente, falta de insumos, aprobación pendiente)..."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all placeholder:text-slate-400"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
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
              disabled={loading || !comment.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors"
            >
              {loading ? 'Guardando...' : 'Confirmar Bloqueo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
