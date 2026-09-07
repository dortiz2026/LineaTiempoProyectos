import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden gestionar usuarios de gerencia' }, { status: 403 });
    }

    const { data: users, error } = await supabaseAdmin
      .from('gerencia_access')
      .select('*')
      .order('fecha_solicitud', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden activar o desactivar usuarios' }, { status: 403 });
    }

    const body = await request.json();
    const { id, activo } = body;

    if (!id || typeof activo !== 'boolean') {
      return NextResponse.json({ error: 'ID y estado activo requeridos' }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('gerencia_access')
      .update({
        activo,
        fecha_activacion: activo ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
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
      return NextResponse.json({ error: 'Solo los administradores pueden remover solicitudes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('gerencia_access').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al eliminar solicitud' }, { status: 500 });
  }
}
