import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden gestionar fases' }, { status: 403 });
    }

    const body = await request.json();
    const {
      project_id,
      nombre,
      estimacion_dias,
      estimacion_horas,
      fecha_inicio_estimada,
      fecha_fin_estimada,
      estado,
    } = body;

    if (!project_id || !nombre || !nombre.trim()) {
      return NextResponse.json({ error: 'Proyecto y nombre de fase requeridos' }, { status: 400 });
    }

    // Get max order
    const { data: phases } = await supabaseAdmin
      .from('phases')
      .select('orden')
      .eq('project_id', project_id)
      .order('orden', { ascending: false })
      .limit(1);

    const nextOrder = phases && phases.length > 0 ? (phases[0].orden || 0) + 1 : 1;

    const parsedHoras = estimacion_horas !== undefined && estimacion_horas !== null
      ? parseInt(estimacion_horas)
      : (parseInt(estimacion_dias) || 5) * 8;
    const parsedDias = estimacion_dias !== undefined && estimacion_dias !== null
      ? parseInt(estimacion_dias)
      : Math.max(1, Math.ceil(parsedHoras / 8));

    const { data: phase, error } = await supabaseAdmin
      .from('phases')
      .insert({
        project_id,
        nombre: nombre.trim(),
        orden: nextOrder,
        es_levantamiento: false,
        estimacion_dias: parsedDias,
        estimacion_horas: parsedHoras,
        fecha_inicio_estimada: fecha_inicio_estimada || null,
        fecha_fin_estimada: fecha_fin_estimada || null,
        estado: estado || 'Sin iniciar',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, phase });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al crear fase' }, { status: 500 });
  }
}
