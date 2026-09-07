'use client';

import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { PhaseStatus } from '@/lib/types';

interface NewPhaseModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function NewPhaseModal({
  projectId,
  isOpen,
  onClose,
  onCreated,
}: NewPhaseModalProps) {
  const [nombre, setNombre] = useState('');
  const [estimacionHoras, setEstimacionHoras] = useState('40');
  const [estimacionDias, setEstimacionDias] = useState('5');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState('');
  const [estado, setEstado] = useState<PhaseStatus>('Sin iniciar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleHorasChange = (val: string) => {
    setEstimacionHoras(val);
    const num = parseInt(val);
    if (!isNaN(num) && num > 0) {
      setEstimacionDias(String(Math.max(1, Math.round(num / 8))));
    }
  };

  const handleDiasChange = (val: string) => {
    setEstimacionDias(val);
    const num = parseInt(val);
    if (!isNaN(num) && num > 0) {
      setEstimacionHoras(String(num * 8));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre de la tarea es obligatorio.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/phases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          nombre: nombre.trim(),
          estimacion_horas: parseInt(estimacionHoras) || 40,
          estimacion_dias: parseInt(estimacionDias) || 5,
          fecha_inicio_estimada: fechaInicio || null,
          fecha_fin_estimada: fechaFin || null,
          estado,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear la tarea');
      }

      setNombre('');
      setEstimacionHoras('40');
      setEstimacionDias('5');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900">Agregar Nueva Tarea / Etapa</h3>
              <p className="text-xs text-slate-500">Define una nueva tarea para medir el avance del proyecto</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre de la tarea <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Levantamiento de requerimientos, Pruebas QA, Despliegue..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tiempo en horas <span className="text-blue-600 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="3000"
                  required
                  value={estimacionHoras}
                  onChange={(e) => handleHorasChange(e.target.value)}
                  placeholder="40"
                  className="w-full px-3 py-2 pr-11 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all font-semibold"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  hrs
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Equivalente en días
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="365"
                  required
                  value={estimacionDias}
                  onChange={(e) => handleDiasChange(e.target.value)}
                  placeholder="5"
                  className="w-full px-3 py-2 pr-11 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
                />
                <span className="absolute right-3 top-2.5 text-xs font-medium text-slate-400">
                  días
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inicio estimado
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fin estimado
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estado inicial de la tarea
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as PhaseStatus)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all text-slate-700 font-medium"
            >
              <option value="Sin iniciar">1. Sin iniciar (Pendiente)</option>
              <option value="En proceso">2. En proceso</option>
              <option value="Terminado">3. Terminado (Completado)</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
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
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              {loading ? 'Creando...' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
