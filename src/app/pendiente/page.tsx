'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Clock, ShieldAlert, ArrowLeft, RefreshCw, Mail } from 'lucide-react';

function PendienteContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-amber-200/80 overflow-hidden text-center">
      {/* Header */}
      <div className="p-8 bg-gradient-to-b from-amber-500 to-amber-600 text-white">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center text-white shadow-inner mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Acceso en Revisión
        </h1>
        <p className="text-xs text-amber-100 mt-1 font-medium">
          Línea de Tiempo Patprimo & Pash
        </p>
      </div>

      {/* Body */}
      <div className="p-6 sm:p-8 space-y-5">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-sm font-semibold text-amber-900 leading-relaxed">
            Tu acceso está pendiente de activación por el administrador.
          </p>
          {email && (
            <p className="text-xs text-amber-700 mt-1.5 flex items-center justify-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              <span>{email}</span>
            </p>
          )}
        </div>

        <p className="text-xs text-slate-500 leading-relaxed text-left">
          Hemos recibido tu solicitud de acceso gerencial. El administrador principal{' '}
          (<strong>dortiz@patprimo.com.co</strong>) debe aprobar y activar tu cuenta desde el panel
          de administración antes de que puedas visualizar los proyectos.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reintentar Acceso
          </button>
          <Link
            href="/login"
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PendientePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Suspense fallback={<div className="text-xs text-slate-400">Cargando...</div>}>
        <PendienteContent />
      </Suspense>
    </main>
  );
}
