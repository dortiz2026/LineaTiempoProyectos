'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Eye,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'admin' | 'gerencia'>('gerencia');

  // Admin form
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Gerencia form
  const [gerenciaEmail, setGerenciaEmail] = useState('');
  const [gerenciaLoading, setGerenciaLoading] = useState(false);
  const [gerenciaError, setGerenciaError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminLoading(true);

    try {
      const res = await fetch('/api/auth/login-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setAdminError(err.message || 'Error al iniciar sesión');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleGerenciaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGerenciaError(null);
    setPendingMessage(null);
    setGerenciaLoading(true);

    try {
      const res = await fetch('/api/auth/login-gerencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: gerenciaEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al validar acceso');
      }

      if (data.status === 'pending') {
        router.push(`/pendiente?email=${encodeURIComponent(data.email || gerenciaEmail)}`);
        return;
      }

      router.push('/gerencia');
      router.refresh();
    } catch (err: any) {
      setGerenciaError(err.message || 'Error al iniciar sesión');
    } finally {
      setGerenciaLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-radial from-slate-100 via-slate-50 to-slate-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Branding Header */}
        <div className="p-6 sm:p-8 text-center bg-gradient-to-b from-slate-900 to-slate-800 text-white relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-xl font-bold tracking-widest text-white shadow-inner mb-3">
            PP
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            PATPRIMO <span className="text-slate-400 font-light">|</span> PASH
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Línea de Tiempo y Avance de Proyectos
          </p>
        </div>

        {/* Tab Selection */}
        <div className="p-6">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setTab('gerencia');
                setGerenciaError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tab === 'gerencia'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              Vista Gerencia
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('admin');
                setAdminError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tab === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Administración
            </button>
          </div>

          {/* Gerencia Login (No password, whitelist verification) */}
          {tab === 'gerencia' && (
            <form onSubmit={handleGerenciaSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Acceso Ejecutivo (Solo Lectura)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ingresa tu correo corporativo <strong>@patprimo.com.co</strong> o{' '}
                  <strong>@pash.com.co</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={gerenciaEmail}
                    onChange={(e) => setGerenciaEmail(e.target.value)}
                    placeholder="usuario@patprimo.com.co"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {gerenciaError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{gerenciaError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={gerenciaLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                {gerenciaLoading ? 'Verificando acceso...' : 'Ingresar a Vista Gerencia'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-center text-slate-400 pt-2">
                El acceso para gerencia es validado y activado por el administrador del sistema.
              </p>
            </form>
          )}

          {/* Admin Login (Password required) */}
          {tab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Acceso Administrador
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gestión total de proyectos, fases y control de bloqueos
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Administrador
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="dortiz@patprimo.com.co"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {adminError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{adminError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                {adminLoading ? 'Validando...' : 'Iniciar Sesión Admin'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Usuarios autorizados:</p>
                <p>• dortiz@patprimo.com.co</p>
                <p>• lsabogal@patprimo.com.co</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
