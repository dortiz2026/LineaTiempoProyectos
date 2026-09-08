'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Briefcase,
  Code,
  CheckCircle2,
  Clock,
  UserPlus,
  Trash2,
  ShieldAlert,
  Search,
  Check,
  X,
  RotateCcw,
  Sparkles,
  KeyRound,
  Mail,
  UserCheck,
  UserX,
  Building2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { AdminUser, GerenciaAccess, TeamRole } from '@/lib/types';
import {
  getStoredResponsables,
  addStoredResponsable,
  removeStoredResponsable,
  resetStoredResponsables,
} from '@/lib/responsables';

export default function UsersManager() {
  const [activeSubTab, setActiveSubTab] = useState<'equipo' | 'gerencia' | 'sugerencias'>('equipo');

  // ==========================================
  // ESTADO: USUARIOS DEL EQUIPO (ADMIN, PM, DEV)
  // ==========================================
  const [teamUsers, setTeamUsers] = useState<AdminUser[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [teamSearch, setTeamSearch] = useState('');
  const [teamRoleFilter, setTeamRoleFilter] = useState<'all' | TeamRole>('all');
  const [currentSessionEmail, setCurrentSessionEmail] = useState<string>('');

  // Modal: Nuevo Miembro del Equipo
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamRole>('pm');
  const [newMemberPassword, setNewMemberPassword] = useState('Carrito.54321@$');
  const [newMemberActive, setNewMemberActive] = useState(true);
  const [creatingMember, setCreatingMember] = useState(false);

  // Modal: Cambiar Contraseña
  const [passwordModalUser, setPasswordModalUser] = useState<AdminUser | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('Carrito.54321@$');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // ==========================================
  // ESTADO: ACCESO GERENCIA
  // ==========================================
  const [gerenciaUsers, setGerenciaUsers] = useState<GerenciaAccess[]>([]);
  const [loadingGerencia, setLoadingGerencia] = useState(true);
  const [gerenciaSearch, setGerenciaSearch] = useState('');
  const [newGerenciaEmail, setNewGerenciaEmail] = useState('');
  const [addingGerencia, setAddingGerencia] = useState(false);

  // ==========================================
  // ESTADO: SUGERENCIAS RÁPIDAS (RESPONSABLES)
  // ==========================================
  const [frequentLeads, setFrequentLeads] = useState<string[]>([]);
  const [newLeadName, setNewLeadName] = useState('');

  // Feedback Notification Toast
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4500);
  };

  // Fetch Current Session User
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.session?.email) {
          setCurrentSessionEmail(data.session.email.toLowerCase());
        }
      } catch {
        // ignore
      }
    };
    fetchSession();
  }, []);

  // Fetch Team Users
  const fetchTeamUsers = async () => {
    try {
      setLoadingTeam(true);
      const res = await fetch('/api/admin-users');
      const data = await res.json();
      if (res.ok) {
        setTeamUsers(data.users || []);
      }
    } catch {
      showToast('Error al conectar con el servidor para obtener el equipo', 'error');
    } finally {
      setLoadingTeam(false);
    }
  };

  // Fetch Gerencia Users
  const fetchGerenciaUsers = async () => {
    try {
      setLoadingGerencia(true);
      const res = await fetch('/api/gerencia-users');
      const data = await res.json();
      if (res.ok) {
        setGerenciaUsers(data.users || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingGerencia(false);
    }
  };

  // Load frequent leads & setup listeners
  useEffect(() => {
    fetchTeamUsers();
    fetchGerenciaUsers();
    setFrequentLeads(getStoredResponsables());

    const handleUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setFrequentLeads(e.detail);
      } else {
        setFrequentLeads(getStoredResponsables());
      }
    };

    window.addEventListener('responsables-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('responsables-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // ==========================================
  // HANDLERS: EQUIPO (ADMIN / PM / DEV)
  // ==========================================
  const handleCreateTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newMemberEmail.trim().toLowerCase();
    const cleanName = newMemberName.trim();

    if (!cleanEmail.endsWith('@patprimo.com.co') && !cleanEmail.endsWith('@pash.com.co')) {
      showToast('Solo se permiten correos corporativos @patprimo.com.co o @pash.com.co', 'error');
      return;
    }

    try {
      setCreatingMember(true);
      const res = await fetch('/api/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          nombre: cleanName,
          rol: newMemberRole,
          password: newMemberPassword || 'Carrito.54321@$',
          activo: newMemberActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al autorizar integrante');
      }

      setTeamUsers((prev) => [...prev, data.user]);
      setIsNewMemberModalOpen(false);
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPassword('Carrito.54321@$');
      setNewMemberActive(true);
      showToast(`Usuario ${cleanName} (${getRoleLabel(newMemberRole)}) registrado y autorizado exitosamente.`);
    } catch (err: any) {
      showToast(err.message || 'Error al guardar integrante', 'error');
    } finally {
      setCreatingMember(false);
    }
  };

  const handleToggleTeamActive = async (user: AdminUser) => {
    if (user.email.toLowerCase() === currentSessionEmail) {
      showToast('No puedes desactivar tu propia cuenta activa de administrador', 'error');
      return;
    }

    const nextActive = !user.activo;
    try {
      const res = await fetch('/api/admin-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, activo: nextActive }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al cambiar estado');
      }

      setTeamUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, activo: nextActive } : u))
      );
      showToast(
        `Usuario ${user.nombre || user.email} ${nextActive ? 'autorizado y activado' : 'desactivado'} correctamente.`
      );
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar usuario', 'error');
    }
  };

  const handleChangeRole = async (user: AdminUser, newRole: TeamRole) => {
    try {
      const res = await fetch('/api/admin-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, rol: newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al cambiar rol');
      }

      setTeamUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, rol: newRole } : u))
      );
      showToast(`Rol de ${user.nombre || user.email} actualizado a ${getRoleLabel(newRole)}.`);
    } catch (err: any) {
      showToast(err.message || 'Error al cambiar rol', 'error');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !newPasswordValue.trim()) return;

    try {
      setUpdatingPassword(true);
      const res = await fetch('/api/admin-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: passwordModalUser.id, password: newPasswordValue.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar contraseña');
      }

      setPasswordModalUser(null);
      setNewPasswordValue('Carrito.54321@$');
      showToast(`Contraseña de ${passwordModalUser.nombre || passwordModalUser.email} actualizada con éxito.`);
    } catch (err: any) {
      showToast(err.message || 'Error al cambiar contraseña', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteTeamUser = async (user: AdminUser) => {
    if (user.email.toLowerCase() === currentSessionEmail) {
      showToast('No puedes eliminar tu propia cuenta mientras estás conectado', 'error');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar permanentemente a "${user.nombre || user.email}" del equipo de proyectos?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin-users?id=${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar');
      }

      setTeamUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast(`Usuario ${user.nombre || user.email} eliminado del equipo.`);
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar integrante', 'error');
    }
  };

  // ==========================================
  // HANDLERS: GERENCIA ACCESS
  // ==========================================
  const handleToggleGerenciaActive = async (user: GerenciaAccess) => {
    const nextActive = !user.activo;
    try {
      const res = await fetch('/api/gerencia-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, activo: nextActive }),
      });

      if (res.ok) {
        setGerenciaUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, activo: nextActive } : u))
        );
        showToast(`Acceso de Gerencia para ${user.email} ${nextActive ? 'activado' : 'desactivado'}.`);
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al actualizar', 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar', 'error');
    }
  };

  const handleAddGerenciaEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newGerenciaEmail.trim().toLowerCase();
    if (!clean.endsWith('@patprimo.com.co') && !clean.endsWith('@pash.com.co')) {
      showToast('El correo debe ser de dominio @patprimo.com.co o @pash.com.co', 'error');
      return;
    }

    try {
      setAddingGerencia(true);
      const res = await fetch('/api/auth/login-gerencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      });
      setNewGerenciaEmail('');
      await fetchGerenciaUsers();
      showToast(`Solicitud para ${clean} registrada. Puedes activarla a continuación.`);
    } catch {
      showToast('Error al registrar el correo', 'error');
    } finally {
      setAddingGerencia(false);
    }
  };

  const handleDeleteGerencia = async (id: string, email: string) => {
    if (!confirm(`¿Eliminar la solicitud de ${email}?`)) return;

    try {
      const res = await fetch(`/api/gerencia-users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGerenciaUsers((prev) => prev.filter((u) => u.id !== id));
        showToast(`Solicitud de ${email} eliminada.`);
      }
    } catch {
      showToast('Error al eliminar', 'error');
    }
  };

  // ==========================================
  // HANDLERS: SUGERENCIAS RÁPIDAS
  // ==========================================
  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim()) return;
    const clean = newLeadName.trim();
    const updated = addStoredResponsable(clean);
    setFrequentLeads(updated);
    setNewLeadName('');
    showToast(`"${clean}" agregado a las sugerencias rápidas.`);
  };

  const handleDeleteLead = (name: string) => {
    const updated = removeStoredResponsable(name);
    setFrequentLeads(updated);
    showToast(`"${name}" removido de sugerencias rápidas.`);
  };

  const handleResetLeads = () => {
    const updated = resetStoredResponsables();
    setFrequentLeads(updated);
    showToast('Sugerencias rápidas restablecidas.');
  };

  // Helper Labels & Styles
  const getRoleLabel = (role?: TeamRole) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'pm':
        return 'Project Manager';
      case 'developer':
        return 'Desarrollador';
      default:
        return 'Project Manager';
    }
  };

  const getRoleBadge = (role?: TeamRole) => {
    switch (role) {
      case 'admin':
        return {
          icon: Shield,
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          label: 'Administrador',
          desc: 'Control Total',
        };
      case 'developer':
        return {
          icon: Code,
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Desarrollador',
          desc: 'Tareas & Kanban',
        };
      case 'pm':
      default:
        return {
          icon: Briefcase,
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Project Manager',
          desc: 'Gestión Proyectos',
        };
    }
  };

  // Filtered Team
  const filteredTeam = teamUsers.filter((u) => {
    const matchesSearch =
      (u.nombre && u.nombre.toLowerCase().includes(teamSearch.toLowerCase())) ||
      u.email.toLowerCase().includes(teamSearch.toLowerCase());
    const matchesRole = teamRoleFilter === 'all' || (u.rol || 'pm') === teamRoleFilter;
    return matchesSearch && matchesRole;
  });

  const pendingGerenciaCount = gerenciaUsers.filter((u) => !u.activo).length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {message && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-3 transition-all animate-in fade-in slide-in-from-bottom-5 ${
            message.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-100 border-emerald-700 backdrop-blur-md'
              : 'bg-rose-950/90 text-rose-100 border-rose-700 backdrop-blur-md'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="ml-2 text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Sub-Navigation Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
                <Users className="w-5 h-5" />
              </div>
              Centro de Gestión de Usuarios y Accesos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Autoriza y asigna roles a los <strong>Project Managers (PM)</strong>, <strong>Desarrolladores</strong> y <strong>Administradores</strong> para gestionar proyectos, y aprueba solicitudes de lectura gerencial.
            </p>
          </div>

          {activeSubTab === 'equipo' && (
            <button
              type="button"
              onClick={() => setIsNewMemberModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              + Autorizar Nuevo Integrante
            </button>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 pt-4">
          <button
            type="button"
            onClick={() => setActiveSubTab('equipo')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all ${
              activeSubTab === 'equipo'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Equipo de Proyectos (Admin, PM, Dev)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                activeSubTab === 'equipo' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {teamUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('gerencia')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all ${
              activeSubTab === 'gerencia'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Solicitudes de Gerencia</span>
            {pendingGerenciaCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-white animate-pulse">
                {pendingGerenciaCount} pendientes
              </span>
            ) : (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  activeSubTab === 'gerencia' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {gerenciaUsers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('sugerencias')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all ${
              activeSubTab === 'sugerencias'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Sugerencias Rápidas de Responsables</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                activeSubTab === 'sugerencias' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {frequentLeads.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: EQUIPO DE PROYECTOS (ADMIN, PM, DEVELOPER)                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'equipo' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Equipo</p>
                <h4 className="text-xl font-black text-slate-900">{teamUsers.length}</h4>
                <p className="text-[11px] text-slate-500">Miembros registrados</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Administradores</p>
                <h4 className="text-xl font-black text-purple-900">
                  {teamUsers.filter((u) => u.rol === 'admin').length}
                </h4>
                <p className="text-[11px] text-purple-700 font-medium">Control total</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Project Managers</p>
                <h4 className="text-xl font-black text-sky-900">
                  {teamUsers.filter((u) => (u.rol || 'pm') === 'pm').length}
                </h4>
                <p className="text-[11px] text-sky-700 font-medium">Liderazgo & fases</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Desarrolladores</p>
                <h4 className="text-xl font-black text-emerald-900">
                  {teamUsers.filter((u) => u.rol === 'developer').length}
                </h4>
                <p className="text-[11px] text-emerald-700 font-medium">Ejecución Kanban</p>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder="Buscar por nombre o correo corporativo..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setTeamRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  teamRoleFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({teamUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setTeamRoleFilter('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  teamRoleFilter === 'admin'
                    ? 'bg-purple-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Admins ({teamUsers.filter((u) => u.rol === 'admin').length})
              </button>
              <button
                type="button"
                onClick={() => setTeamRoleFilter('pm')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  teamRoleFilter === 'pm'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                PMs ({teamUsers.filter((u) => (u.rol || 'pm') === 'pm').length})
              </button>
              <button
                type="button"
                onClick={() => setTeamRoleFilter('developer')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  teamRoleFilter === 'developer'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Devs ({teamUsers.filter((u) => u.rol === 'developer').length})
              </button>
            </div>
          </div>

          {/* Users Table / Cards */}
          {loadingTeam ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs font-medium">
              Cargando integrantes del equipo...
            </div>
          ) : filteredTeam.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No se encontraron usuarios</h3>
              <p className="text-xs text-slate-500 mt-1">
                {teamSearch || teamRoleFilter !== 'all'
                  ? 'Intenta con otros términos de búsqueda.'
                  : 'Autoriza al primer PM o desarrollador para comenzar.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-5">Integrante</th>
                      <th className="py-3.5 px-4">Rol en la Plataforma</th>
                      <th className="py-3.5 px-4">Estado de Autorización</th>
                      <th className="py-3.5 px-4">Fecha de Alta</th>
                      <th className="py-3.5 px-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {filteredTeam.map((member) => {
                      const roleInfo = getRoleBadge(member.rol);
                      const RoleIcon = roleInfo.icon;
                      const isSelf = member.email.toLowerCase() === currentSessionEmail;
                      const isActive = member.activo !== false;

                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* User Name & Email */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-xs shrink-0 ${
                                  member.rol === 'admin'
                                    ? 'bg-gradient-to-br from-purple-600 to-indigo-700'
                                    : member.rol === 'developer'
                                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                                    : 'bg-gradient-to-br from-blue-600 to-cyan-700'
                                }`}
                              >
                                {(member.nombre || member.email)
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 truncate">
                                    {member.nombre || 'Sin nombre'}
                                  </span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold border border-blue-200">
                                      Tú (Sesión actual)
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500 block truncate">
                                  {member.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role Selector */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${roleInfo.color}`}
                              >
                                <RoleIcon className="w-3.5 h-3.5" />
                                <span>{roleInfo.label}</span>
                              </span>

                              {/* Dropdown to change role quickly */}
                              <select
                                value={member.rol || 'pm'}
                                onChange={(e) =>
                                  handleChangeRole(member, e.target.value as TeamRole)
                                }
                                title="Cambiar rol"
                                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg px-2 py-1 outline-hidden cursor-pointer"
                              >
                                <option value="admin">🛡️ Administrador</option>
                                <option value="pm">📋 Project Manager (PM)</option>
                                <option value="developer">💻 Desarrollador</option>
                              </select>
                            </div>
                          </td>

                          {/* Active / Authorization status */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2.5">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  Autorizado (Activo)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                                  Inactivo / Sin Acceso
                                </span>
                              )}

                              {/* Toggle switch */}
                              <button
                                type="button"
                                disabled={isSelf}
                                onClick={() => handleToggleTeamActive(member)}
                                title={
                                  isSelf
                                    ? 'No puedes desactivarte a ti mismo'
                                    : isActive
                                    ? 'Hacer clic para revocar autorización'
                                    : 'Hacer clic para autorizar ingreso'
                                }
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                  isSelf
                                    ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                                    : isActive
                                    ? 'bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 border-slate-300'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                }`}
                              >
                                {isActive ? 'Desautorizar' : 'Autorizar'}
                              </button>
                            </div>
                          </td>

                          {/* Created at */}
                          <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                            {new Date(member.created_at).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPasswordModalUser(member)}
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                title="Cambiar o restablecer contraseña"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                disabled={isSelf}
                                onClick={() => handleDeleteTeamUser(member)}
                                className={`p-2 rounded-xl transition-colors ${
                                  isSelf
                                    ? 'opacity-30 cursor-not-allowed text-slate-400'
                                    : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title={isSelf ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario del equipo'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: ACCESO GERENCIA (LECTURA / DASHBOARD EJECUTIVO)                */}
      {/* ========================================================================= */}
      {activeSubTab === 'gerencia' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Autorización de Acceso para Gerencia y Directores
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Los usuarios de Gerencia tienen acceso exclusivo de <strong>solo lectura</strong> a la vista ejecutiva de proyectos, cronogramas y bloqueos sin poder editar tareas.
                </p>
              </div>

              {/* Formulario para pre-autorizar correo de Gerencia */}
              <form onSubmit={handleAddGerenciaEmail} className="flex items-center gap-2">
                <input
                  type="email"
                  required
                  value={newGerenciaEmail}
                  onChange={(e) => setNewGerenciaEmail(e.target.value)}
                  placeholder="gerente@patprimo.com.co"
                  className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden w-64 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={addingGerencia}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {addingGerencia ? 'Registrando...' : 'Pre-autorizar'}
                </button>
              </form>
            </div>

            {/* Gerencia Table */}
            <div className="p-6">
              <div className="relative mb-4 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={gerenciaSearch}
                  onChange={(e) => setGerenciaSearch(e.target.value)}
                  placeholder="Buscar por correo de gerencia..."
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {loadingGerencia ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Cargando accesos de gerencia...
                </div>
              ) : gerenciaUsers.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-500">No hay solicitudes de acceso de gerencia registradas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Correo Corporativo</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4">Fecha Solicitud</th>
                        <th className="py-3 px-4">Fecha Activación</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                      {gerenciaUsers
                        .filter((u) => u.email.toLowerCase().includes(gerenciaSearch.toLowerCase()))
                        .map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-slate-900">{u.email}</td>
                            <td className="py-3.5 px-4">
                              {u.activo ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Autorizado / Activo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Pendiente Aprobación
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-500">
                              {new Date(u.fecha_solicitud).toLocaleDateString('es-CO', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-500">
                              {u.fecha_activacion
                                ? new Date(u.fecha_activacion).toLocaleDateString('es-CO', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleGerenciaActive(u)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                    u.activo
                                      ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                  }`}
                                >
                                  {u.activo ? 'Desactivar' : 'Aprobar Acceso'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGerencia(u.id, u.email)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                  title="Eliminar solicitud"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: SUGERENCIAS RÁPIDAS (RESPONSABLES)                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'sugerencias' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Líderes y Personas a Cargo de Proyectos
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Configura los nombres que aparecen como botones de <strong>Sugerencias Rápidas</strong> al crear o editar proyectos. Agrega a tu equipo para asignarlos con 1 solo clic.
              </p>
            </div>

            <form onSubmit={handleAddLead} className="flex items-center gap-2">
              <input
                type="text"
                required
                value={newLeadName}
                onChange={(e) => setNewLeadName(e.target.value)}
                placeholder="Nombre completo (ej: Juan Pérez)"
                className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden w-64 placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Agregar a Sugerencias
              </button>
            </form>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Sugerencias Rápidas Activas ({frequentLeads.length})
              </span>
              <button
                type="button"
                onClick={handleResetLeads}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restablecer predeterminados
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {frequentLeads.map((lead) => (
                <div
                  key={lead}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {lead[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate">{lead}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteLead(lead)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                    title="Eliminar de sugerencias rápidas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AUTORIZAR / CREAR INTEGRANTE DE EQUIPO (ADMIN, PM, DEV)             */}
      {/* ========================================================================= */}
      {isNewMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Autorizar Nuevo Integrante</h3>
                  <p className="text-xs text-slate-300">
                    Registra a un Project Manager, Desarrollador o Administrador
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewMemberModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeamMember} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Ej: Diana Rodríguez"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico Corporativo *
                </label>
                <input
                  type="email"
                  required
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="usuario@patprimo.com.co o @pash.com.co"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Debe pertenecer a los dominios @patprimo.com.co o @pash.com.co
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Rol y Nivel de Acceso *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Rol PM */}
                  <label
                    className={`p-3 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                      newMemberRole === 'pm'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="teamRole"
                      value="pm"
                      checked={newMemberRole === 'pm'}
                      onChange={() => setNewMemberRole('pm')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      {newMemberRole === 'pm' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold">Project Manager</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Crea proyectos y cronograma</p>
                    </div>
                  </label>

                  {/* Rol Developer */}
                  <label
                    className={`p-3 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                      newMemberRole === 'developer'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="teamRole"
                      value="developer"
                      checked={newMemberRole === 'developer'}
                      onChange={() => setNewMemberRole('developer')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <Code className="w-4 h-4 text-emerald-600" />
                      {newMemberRole === 'developer' && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold">Desarrollador</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Mueve tareas en Kanban</p>
                    </div>
                  </label>

                  {/* Rol Admin */}
                  <label
                    className={`p-3 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                      newMemberRole === 'admin'
                        ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="teamRole"
                      value="admin"
                      checked={newMemberRole === 'admin'}
                      onChange={() => setNewMemberRole('admin')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      {newMemberRole === 'admin' && <Check className="w-4 h-4 text-purple-600" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold">Administrador</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Control y usuarios</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contraseña Inicial de Acceso
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setNewMemberPassword('Carrito.54321@$')}
                    className="absolute right-2 top-2 text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-50 rounded-lg"
                  >
                    Predeterminada
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Contraseña corporativa estándar: <code className="text-slate-600">Carrito.54321@$</code>
                </span>
              </div>

              {/* Checkbox de autorización inmediata */}
              <div className="pt-2">
                <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMemberActive}
                    onChange={(e) => setNewMemberActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Autorizar inmediatamente</p>
                    <p className="text-[11px] text-slate-500">
                      El usuario podrá ingresar de inmediato a gestionar proyectos.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewMemberModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingMember}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  {creatingMember ? 'Autorizando...' : 'Guardar y Autorizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CAMBIAR / RESETEAR CONTRASEÑA                                     */}
      {/* ========================================================================= */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Cambiar Contraseña</h3>
                  <p className="text-xs text-slate-300">{passwordModalUser.nombre || passwordModalUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPasswordValue('Carrito.54321@$')}
                    className="absolute right-2 top-2 text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-50 rounded-lg"
                  >
                    Predeterminada
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {updatingPassword ? 'Guardando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
