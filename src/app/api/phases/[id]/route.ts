import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentSession } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden editar fases' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      nombre,
      estado,
      orden,
      estimacion_dias,
      estimacion_horas,
      fecha_inicio_estimada,
      fecha_fin_estimada,
    } = body;

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (nombre !== undefined) updatePayload.nombre = nombre.trim();
    if (estado !== undefined) updatePayload.estado = estado;
    if (orden !== undefined) updatePayload.orden = orden;
    if (estimacion_horas !== undefined) {
      updatePayload.estimacion_horas = parseInt(estimacion_horas);
      if (estimacion_dias === undefined) {
        updatePayload.estimacion_dias = Math.max(1, Math.ceil(parseInt(estimacion_horas) / 8));
      }
    }
    if (estimacion_dias !== undefined) {
      updatePayload.estimacion_dias = parseInt(estimacion_dias);
      if (estimacion_horas === undefined) {
        updatePayload.estimacion_horas = parseInt(estimacion_dias) * 8;
      }
    }
    if (fecha_inicio_estimada !== undefined) updatePayload.fecha_inicio_estimada = fecha_inicio_estimada;
    if (fecha_fin_estimada !== undefined) updatePayload.fecha_fin_estimada = fecha_fin_estimada;

    const { data: updated, error } = await supabaseAdmin
      .from('phases')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, phase: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al actualizar fase' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden eliminar fases' }, { status: 403 });
    }

    const { id } = await params;

    const { error } = await supabaseAdmin.from('phases').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al eliminar fase' }, { status: 500 });
  }
}
