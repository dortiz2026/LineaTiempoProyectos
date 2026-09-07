'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, ShieldCheck, Eye, Layers, Users, Clock } from 'lucide-react';
import { UserSession } from '@/lib/types';

interface NavbarProps {
  user: UserSession;
  activeTab?: 'proyectos' | 'usuarios';
  onTabChange?: (tab: 'proyectos' | 'usuarios') => void;
}

export default function Navbar({ user, activeTab = 'proyectos', onTabChange }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const isAdmin = user.role === 'admin';

  return (
    <header className="no-print sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <Link href={isAdmin ? '/admin' : '/gerencia'} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-blue-900 flex items-center justify-center text-white font-bold tracking-wider shadow-sm group-hover:scale-105 transition-transform">
              PP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">PATPRIMO</span>
                <span className="text-xs font-semibold text-slate-400">|</span>
                <span className="font-semibold text-slate-600 tracking-tight text-sm">PASH</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Línea de Tiempo de Proyectos</p>
            </div>
          </Link>

          {/* Admin Tab Switcher if on admin main page */}
          {isAdmin && pathname === '/admin' && onTabChange && (
            <div className="hidden md:flex items-center ml-8 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => onTabChange('proyectos')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'proyectos'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Proyectos y Fases
              </button>
              <button
                type="button"
                onClick={() => onTabChange('usuarios')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'usuarios'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Acceso Gerencia
              </button>
            </div>
          )}
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
            {isAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                Administrador
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <Eye className="w-3.5 h-3.5 text-emerald-700" />
                Gerencia
              </span>
            )}
            <span className="text-xs font-medium text-slate-700 hidden sm:inline truncate max-w-[200px]">
              {user.email}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
