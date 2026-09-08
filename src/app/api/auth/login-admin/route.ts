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

    const { data: user, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error) {
      console.error('Error al consultar admin_users en Supabase:', error);
      return NextResponse.json(
        { error: `Error de conexión con Supabase: ${error.message || 'Verifica las variables de entorno en Vercel'}` },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: 'Este usuario no tiene permisos de administrador o no está registrado en el sistema' }, { status: 401 });
    }

    if (user.activo === false) {
      return NextResponse.json(
        { error: 'Tu usuario se encuentra inactivo o desautorizado por el administrador para gestionar proyectos' },
        { status: 403 }
      );
    }

    const isMatch = verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const session = {
      email: user.email,
      nombre: user.nombre || 'Administrador',
      role: 'admin' as const,
      teamRole: (user.rol as any) || 'admin',
      activo: true,
    };

    await setSessionCookie(session);

    return NextResponse.json({ ok: true, user: session });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
