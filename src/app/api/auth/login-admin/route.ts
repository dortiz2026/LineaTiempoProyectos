import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPassword, setSessionCookie, isAdminEmail } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Correo y contraseña requeridos' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isAdminEmail(cleanEmail)) {
      return NextResponse.json({ error: 'Este usuario no tiene permisos de administrador' }, { status: 403 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const isMatch = verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const session = {
      email: user.email,
      nombre: user.nombre || 'Administrador',
      role: 'admin' as const,
      activo: true,
    };

    await setSessionCookie(session);

    return NextResponse.json({ ok: true, user: session });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
