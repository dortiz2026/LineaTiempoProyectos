'use client';

import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Info } from 'lucide-react';
import { Project, ProjectStatus } from '@/lib/types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  projectToEdit?: Project | null;
}

export default function ProjectModal({
  isOpen,
  onClose,
  onSaved,
  projectToEdit,
}: ProjectModalProps) {
  const isEditing = Boolean(projectToEdit);

  const [nombre, setNombre] = useState('');
  const [cliente, setCliente] = useState('');
  const [responsable, setResponsable] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFinEstimada, setFechaFinEstimada] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState<ProjectStatus>('En entendimiento');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectToEdit) {
      setNombre(projectToEdit.nombre || '');
      setCliente(projectToEdit.cliente || '');
      setResponsable(projectToEdit.responsable || '');
      setFechaInicio(projectToEdit.fecha_inicio || '');
      setFechaFinEstimada(projectToEdit.fecha_fin_estimada || '');
      setDescripcion(projectToEdit.descripcion || '');
      setEstado(projectToEdit.estado || 'En entendimiento');
    } else {
      setNombre('');
      setCliente('');
      setResponsable('');
      setFechaInicio(new Date().toISOString().split('T')[0]);
      setFechaFinEstimada('');
      setDescripcion('');
      setEstado('En entendimiento');
    }
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del proyecto es obligatorio.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = isEditing ? `/api/projects/${projectToEdit!.id}` : '/api/projects';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          cliente: cliente.trim() || null,
          responsable: responsable.trim() || null,
          fecha_inicio: fechaInicio || null,
          fecha_fin_estimada: fechaFinEstimada || null,
          descripcion: descripcion.trim() || null,
          estado,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar proyecto');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900">
                {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Actualiza los datos generales del proyecto'
                  : 'Registra un nuevo proyecto con fase obligatoria de Levantamiento'}
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {!isEditing && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-800">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Fase obligatoria inicial:</strong> Al crear este proyecto se añadirá
                automáticamente la fase fija <em>&ldquo;Levantamiento de información&rdquo;</em>.
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre del proyecto <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Migración E-Commerce Patprimo 2026"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cliente / Marca
              </label>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Ej: Patprimo / Pash"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all placeholder:text-slate-400"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Responsables <span className="text-slate-400 font-normal">(más de 1 persona)</span>
                </label>
              </div>
              <input
                type="text"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                placeholder="Ej: Daniel Ortiz, Lorena Sabogal..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all placeholder:text-slate-400"
              />

              {/* Quick suggestions & parsed chips */}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Sugerencias rápidas:</span>
                {['Daniel Ortiz', 'Lorena Sabogal'].map((adm) => {
                  const currentList = responsable
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const isIncluded = currentList.includes(adm);

                  return (
                    <button
                      key={adm}
                      type="button"
                      onClick={() => {
                        if (isIncluded) {
                          setResponsable(currentList.filter((s) => s !== adm).join(', '));
                        } else {
                          setResponsable(currentList.concat(adm).join(', '));
                        }
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                        isIncluded
                          ? 'bg-blue-100 text-blue-800 border-blue-300 font-semibold'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {isIncluded ? '✓ ' : '+ '}
                      {adm}
                    </button>
                  );
                })}
              </div>

              {/* Parsed chips preview if multiple */}
              {responsable.includes(',') && (
                <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-slate-400 font-medium">Asignados:</span>
                  {responsable
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((person, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-slate-300 text-slate-700 shadow-2xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {person}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de inicio
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
                Fecha fin estimada
              </label>
              <input
                type="date"
                value={fechaFinEstimada}
                onChange={(e) => setFechaFinEstimada(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Estado General del Proyecto <span className="text-blue-600 font-normal">(Software Tendency)</span>
              </label>
              <span className="text-[10px] text-slate-400">Estándar corporativo</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(
                [
                  'En entendimiento',
                  'Levantamiento',
                  'En tendency',
                  'Análisis TI',
                  'Desarrollo',
                  'Pruebas unitarias',
                  'Pruebas funcionales',
                  'Productivo',
                  'Pausado',
                  'Cerrado',
                ] as ProjectStatus[]
              ).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setEstado(st)}
                  className={`py-2 px-2 text-[11px] font-semibold rounded-xl border transition-all text-center ${
                    estado === st
                      ? st === 'Productivo'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : st === 'Desarrollo'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : st === 'Análisis TI'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : st === 'En tendency'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : st === 'Levantamiento'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : st === 'Pruebas funcionales' || st === 'Pruebas unitarias'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-800 text-white border-slate-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descripción del proyecto
            </label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Objetivos clave y alcance del proyecto..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all placeholder:text-slate-400"
            />
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
              {loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
