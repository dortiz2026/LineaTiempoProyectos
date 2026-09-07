'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FolderPlus,
  Info,
  Users,
  UserPlus,
  Plus,
  Settings2,
  Trash2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Project, ProjectStatus } from '@/lib/types';
import {
  getStoredResponsables,
  addStoredResponsable,
  removeStoredResponsable,
  resetStoredResponsables,
} from '@/lib/responsables';

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
  const [selectedResponsables, setSelectedResponsables] = useState<string[]>([]);
  const [responsableInput, setResponsableInput] = useState('');
  const [frequentSuggestions, setFrequentSuggestions] = useState<string[]>([]);
  const [isConfiguringSuggestions, setIsConfiguringSuggestions] = useState(false);
  const [newSuggestionInput, setNewSuggestionInput] = useState('');

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFinEstimada, setFechaFinEstimada] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState<ProjectStatus>('En entendimiento');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tagInputRef = useRef<HTMLInputElement>(null);

  // Cargar sugerencias frecuentes almacenadas
  useEffect(() => {
    setFrequentSuggestions(getStoredResponsables());

    const handleUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setFrequentSuggestions(e.detail);
      } else {
        setFrequentSuggestions(getStoredResponsables());
      }
    };

    window.addEventListener('responsables-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('responsables-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (projectToEdit) {
      setNombre(projectToEdit.nombre || '');
      setCliente(projectToEdit.cliente || '');
      const list = projectToEdit.responsable
        ? projectToEdit.responsable
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      setSelectedResponsables(list);
      setResponsableInput('');
      setFechaInicio(projectToEdit.fecha_inicio || '');
      setFechaFinEstimada(projectToEdit.fecha_fin_estimada || '');
      setDescripcion(projectToEdit.descripcion || '');
      setEstado(projectToEdit.estado || 'En entendimiento');
    } else {
      setNombre('');
      setCliente('');
      setSelectedResponsables([]);
      setResponsableInput('');
      setFechaInicio(new Date().toISOString().split('T')[0]);
      setFechaFinEstimada('');
      setDescripcion('');
      setEstado('En entendimiento');
    }
    setIsConfiguringSuggestions(false);
    setNewSuggestionInput('');
    setError(null);
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  // Agregar persona(s) a los seleccionados
  const handleAddPerson = (name: string) => {
    const clean = name.trim();
    if (!clean) return;

    // Soporte para pegar varios separados por coma
    const parts = clean
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    setSelectedResponsables((prev) => {
      const existingLower = new Set(prev.map((p) => p.toLowerCase()));
      const toAdd = parts.filter((p) => !existingLower.has(p.toLowerCase()));
      return [...prev, ...toAdd];
    });
    setResponsableInput('');
  };

  const handleRemovePerson = (personToRemove: string) => {
    setSelectedResponsables((prev) =>
      prev.filter((p) => p.toLowerCase() !== personToRemove.toLowerCase())
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddPerson(responsableInput);
    } else if (e.key === 'Backspace' && !responsableInput && selectedResponsables.length > 0) {
      e.preventDefault();
      handleRemovePerson(selectedResponsables[selectedResponsables.length - 1]);
    }
  };

  const handleToggleSuggestion = (name: string) => {
    const isSelected = selectedResponsables.some(
      (p) => p.toLowerCase() === name.toLowerCase()
    );
    if (isSelected) {
      handleRemovePerson(name);
    } else {
      handleAddPerson(name);
    }
  };

  const handleSaveNewSuggestion = () => {
    if (!newSuggestionInput.trim()) return;
    const clean = newSuggestionInput.trim();
    const updated = addStoredResponsable(clean);
    setFrequentSuggestions(updated);
    handleAddPerson(clean);
    setNewSuggestionInput('');
  };

  const handleDeleteSuggestion = (name: string) => {
    const updated = removeStoredResponsable(name);
    setFrequentSuggestions(updated);
  };

  const handleResetSuggestions = () => {
    const updated = resetStoredResponsables();
    setFrequentSuggestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del proyecto es obligatorio.');
      return;
    }

    // Incluir cualquier nombre que esté a medio escribir en el input
    const finalResponsables = [...selectedResponsables];
    if (responsableInput.trim()) {
      const parts = responsableInput
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      for (const p of parts) {
        if (!finalResponsables.some((x) => x.toLowerCase() === p.toLowerCase())) {
          finalResponsables.push(p);
        }
      }
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
          responsable: finalResponsables.join(', ') || null,
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  Responsables del proyecto
                </label>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                  {selectedResponsables.length} {selectedResponsables.length === 1 ? 'asignado' : 'asignados'}
                </span>
              </div>

              {/* Tag/Chip Multi-assignee Input Container */}
              <div
                onClick={() => tagInputRef.current?.focus()}
                className="w-full min-h-[44px] p-2 bg-white border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all flex flex-wrap items-center gap-1.5 cursor-text"
              >
                {selectedResponsables.map((person) => (
                  <span
                    key={person}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs"
                  >
                    <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                      {person.charAt(0).toUpperCase()}
                    </span>
                    <span>{person}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePerson(person);
                      }}
                      className="text-blue-400 hover:text-rose-600 hover:bg-blue-100 rounded-xs p-0.5 transition-colors"
                      title={`Remover ${person}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <input
                  ref={tagInputRef}
                  type="text"
                  value={responsableInput}
                  onChange={(e) => setResponsableInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedResponsables.length === 0
                      ? 'Escribe un nombre y pulsa Enter o coma...'
                      : 'Añadir otro...'
                  }
                  className="flex-1 min-w-[130px] text-xs sm:text-sm bg-transparent outline-none py-1 text-slate-800 placeholder:text-slate-400"
                />

                {responsableInput.trim() && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddPerson(responsableInput);
                    }}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    Añadir
                  </button>
                )}
              </div>

              {/* Tips for adding multiple assignees */}
              <p className="mt-1 text-[11px] text-slate-500">
                💡 Escribe el nombre y presiona <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Enter</kbd> o <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">,</kbd> para agregar varias personas a cargo.
              </p>

              {/* Quick suggestions bar with configuration toggle */}
              <div className="mt-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    Sugerencias rápidas:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsConfiguringSuggestions((prev) => !prev)}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    {isConfiguringSuggestions ? 'Ocultar configuración' : 'Configurar sugerencias'}
                  </button>
                </div>

                {/* Suggestions pill list */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {frequentSuggestions.map((adm) => {
                    const isIncluded = selectedResponsables.some(
                      (p) => p.toLowerCase() === adm.toLowerCase()
                    );
                    return (
                      <div key={adm} className="inline-flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleToggleSuggestion(adm)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                            isIncluded
                              ? 'bg-blue-100 text-blue-800 border-blue-300 font-semibold shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isIncluded ? (
                            <Check className="w-3 h-3 text-blue-700" />
                          ) : (
                            <Plus className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{adm}</span>
                        </button>
                        {isConfiguringSuggestions && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSuggestion(adm)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title={`Eliminar "${adm}" de las sugerencias rápidas`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Inline configuration panel */}
                {isConfiguringSuggestions && (
                  <div className="mt-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                        Agregar nueva persona a las sugerencias rápidas:
                      </span>
                      <button
                        type="button"
                        onClick={handleResetSuggestions}
                        className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        title="Restablecer sugerencias predeterminadas"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restablecer
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSuggestionInput}
                        onChange={(e) => setNewSuggestionInput(e.target.value)}
                        placeholder="Nombre completo (ej: Carlos Gómez)"
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveNewSuggestion();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveNewSuggestion}
                        disabled={!newSuggestionInput.trim()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Guardar
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Estas personas quedarán disponibles con un solo clic cada vez que crees o edites un proyecto.
                    </p>
                  </div>
                )}
              </div>
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
