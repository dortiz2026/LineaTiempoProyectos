import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAllowedDomain, setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Debes ingresar un correo electrónico' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isAllowedDomain(cleanEmail)) {
      return NextResponse.json(
        { error: 'Acceso restringido: solo se permiten correos corporativos @patprimo.com.co o @pash.com.co' },
        { status: 403 }
      );
    }

    // Check if user already exists in gerencia_access
    const { data: existing, error } = await supabaseAdmin
      .from('gerencia_access')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Error al consultar permisos de acceso' }, { status: 500 });
    }

    if (!existing) {
      // Automatically register the request with activo = false
      const { data: created, error: insertError } = await supabaseAdmin
        .from('gerencia_access')
        .insert({
          email: cleanEmail,
          activo: false,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: 'Error al registrar solicitud de acceso' }, { status: 500 });
      }

      return NextResponse.json({
        ok: false,
        status: 'pending',
        message: 'Tu acceso está pendiente de activación por el administrador',
        email: cleanEmail,
      });
    }

    // If exists but not active
    if (!existing.activo) {
      return NextResponse.json({
        ok: false,
        status: 'pending',
        message: 'Tu acceso está pendiente de activación por el administrador',
        email: cleanEmail,
      });
    }

    // User is active! Grant gerencia session
    const session = {
      email: existing.email,
      nombre: existing.email.split('@')[0].replace('.', ' '),
      role: 'gerencia' as const,
      activo: true,
    };

    await setSessionCookie(session);

    return NextResponse.json({
      ok: true,
      status: 'active',
      user: session,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
