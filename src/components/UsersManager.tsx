'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  UserPlus,
  Trash2,
  ShieldAlert,
  Search,
  Check,
  X,
} from 'lucide-react';
import { GerenciaAccess } from '@/lib/types';

export default function UsersManager() {
  const [users, setUsers] = useState<GerenciaAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/gerencia-users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (user: GerenciaAccess) => {
    try {
      const nextActive = !user.activo;
      const res = await fetch('/api/gerencia-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, activo: nextActive }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, activo: nextActive } : u))
        );
        setMessage({
          text: `Usuario ${user.email} ${nextActive ? 'activado' : 'desactivado'} con éxito.`,
          type: 'success',
        });
        setTimeout(() => setMessage(null), 4000);
      } else {
        const err = await res.json();
        alert(err.error || 'Error al actualizar usuario');
      }
    } catch {
      alert('Error de conexión al actualizar');
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newEmail.trim().toLowerCase();
    if (!clean.endsWith('@patprimo.com.co') && !clean.endsWith('@pash.com.co')) {
      alert('El correo debe ser de dominio @patprimo.com.co o @pash.com.co');
      return;
    }

    try {
      setAdding(true);
      const res = await fetch('/api/auth/login-gerencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      });
      const data = await res.json();
      setNewEmail('');
      await fetchUsers();
      setMessage({
        text: `Solicitud para ${clean} registrada correctamente. Puedes activarla a continuación.`,
        type: 'success',
      });
      setTimeout(() => setMessage(null), 4000);
    } catch {
      alert('Error al agregar el correo');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`¿Eliminar la solicitud de ${email}?`)) return;

    try {
      const res = await fetch(`/api/gerencia-users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } catch {
      alert('Error al eliminar');
    }
  };

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Control de Accesos para Gerencia
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Solo usuarios aprobados con dominios <strong>@patprimo.com.co</strong> o{' '}
            <strong>@pash.com.co</strong> pueden ingresar a la vista de visualización.
          </p>
        </div>

        {/* Add pre-approved email */}
        <form onSubmit={handleAddEmail} className="flex items-center gap-2">
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="correo@patprimo.com.co"
            className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden w-64 placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={adding}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Registrar
          </button>
        </form>
      </div>

      {message && (
        <div
          className={`mx-6 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {message.text}
        </div>
      )}

      {/* Search filter */}
      <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por correo..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total solicitudes: <strong>{users.length}</strong> (
          <span className="text-emerald-700 font-semibold">
            {users.filter((u) => u.activo).length} activas
          </span>
          ,{' '}
          <span className="text-amber-700 font-semibold">
            {users.filter((u) => !u.activo).length} pendientes
          </span>
          )
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Correo Electrónico</th>
              <th className="px-6 py-3">Dominio</th>
              <th className="px-6 py-3">Estado de Acceso</th>
              <th className="px-6 py-3">Fecha Solicitud</th>
              <th className="px-6 py-3">Activación / Desactivación</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  Cargando usuarios...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  No se encontraron solicitudes registradas.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const domain = u.email.split('@')[1] || '';
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px]">
                        @{domain}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.activo ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Pendiente de Activación
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(u.fecha_solicitud).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          u.activo
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-2xs'
                        }`}
                      >
                        {u.activo ? (
                          <>
                            <X className="w-3.5 h-3.5" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Aprobar y Activar
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(u.id, u.email)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
