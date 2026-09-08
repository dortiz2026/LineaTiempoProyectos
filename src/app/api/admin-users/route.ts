import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentSession, hashPassword, isAllowedDomain } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    const { data: users, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, nombre, rol, activo, created_at, autorizado_por')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al listar usuarios del equipo' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { email, nombre, rol = 'pm', password = 'Carrito.54321@$', activo = true } = body;

    if (!email || !nombre) {
      return NextResponse.json(
        { error: 'El correo electrónico y el nombre completo son obligatorios' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isAllowedDomain(cleanEmail)) {
      return NextResponse.json(
        { error: 'Solo se permiten correos corporativos @patprimo.com.co o @pash.com.co' },
        { status: 400 }
      );
    }

    const validRoles = ['admin', 'pm', 'developer'];
    const assignedRole = validRoles.includes(rol) ? rol : 'pm';
    const passwordHash = hashPassword(password);

    const { data: created, error } = await supabaseAdmin
      .from('admin_users')
      .insert({
        email: cleanEmail,
        nombre: nombre.trim(),
        rol: assignedRole,
        activo: Boolean(activo),
        password_hash: passwordHash,
        autorizado_por: session.email,
      })
      .select('id, email, nombre, rol, activo, created_at, autorizado_por')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Este correo ya se encuentra registrado en el equipo' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, user: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al crear usuario' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { id, activo, rol, nombre, password } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    const updates: Record<string, any> = {};

    if (typeof activo === 'boolean') {
      updates.activo = activo;
      if (activo) {
        updates.autorizado_por = session.email;
      }
    }

    if (rol && ['admin', 'pm', 'developer'].includes(rol)) {
      updates.rol = rol;
    }

    if (nombre && typeof nombre === 'string' && nombre.trim()) {
      updates.nombre = nombre.trim();
    }

    if (password && typeof password === 'string' && password.trim()) {
      updates.password_hash = hashPassword(password.trim());
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No se enviaron campos válidos para actualizar' }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('admin_users')
      .update(updates)
      .eq('id', id)
      .select('id, email, nombre, rol, activo, created_at, autorizado_por')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    // Verify user is not deleting self
    const { data: targetUser } = await supabaseAdmin
      .from('admin_users')
      .select('email')
      .eq('id', id)
      .maybeSingle();

    if (targetUser && targetUser.email.toLowerCase() === session.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta de administrador mientras tienes sesión activa' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from('admin_users').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al eliminar usuario' }, { status: 500 });
  }
}
