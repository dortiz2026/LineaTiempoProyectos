import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;

    const { data: project, error: projError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (projError || !project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    const { data: phases, error: phasesError } = await supabaseAdmin
      .from('phases')
      .select('*')
      .eq('project_id', id)
      .order('orden', { ascending: true });

    if (phasesError) {
      return NextResponse.json({ error: phasesError.message }, { status: 500 });
    }

    const phaseIds = (phases || []).map((p) => p.id);
    let blocks: any[] = [];
    if (phaseIds.length > 0) {
      const { data: bData } = await supabaseAdmin
        .from('phase_blocks')
        .select('*')
        .in('phase_id', phaseIds)
        .order('fecha_bloqueo', { ascending: false });
      blocks = bData || [];
    }

    const enrichedPhases = (phases || []).map((p) => {
      const phBlocks = blocks.filter((b) => b.phase_id === p.id);
      const activeBlock = phBlocks.find((b) => b.activo) || phBlocks[0] || null;
      return {
        ...p,
        blocks: phBlocks,
        ultimo_bloqueo: activeBlock,
      };
    });

    const totalPhases = enrichedPhases.length;
    const completedPhases = enrichedPhases.filter((p) => p.estado === 'Terminado').length;
    const avance_porcentaje = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;
    const duracionTotalHoras = enrichedPhases.reduce((acc, ph) => {
      const h = ph.estimacion_horas ?? (ph.estimacion_dias ? ph.estimacion_dias * 8 : 40);
      return acc + Number(h);
    }, 0);
    const duracionTotalDias = Math.ceil(duracionTotalHoras / 8);

    const responsablesLista = (project.responsable || '')
      .split(',')
      .map((r: string) => r.trim())
      .filter(Boolean);

    return NextResponse.json({
      project: {
        ...project,
        phases: enrichedPhases,
        avance_porcentaje,
        duracion_total_dias: duracionTotalDias,
        duracion_total_horas: duracionTotalHoras,
        bloqueos_activos: enrichedPhases.filter((p) => p.estado === 'Bloqueado').length,
        responsables_lista: responsablesLista,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener proyecto' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden editar proyectos' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { nombre, cliente, responsable, fecha_inicio, fecha_fin_estimada, descripcion, estado } = body;

    const { data: updated, error } = await supabaseAdmin
      .from('projects')
      .update({
        nombre: nombre?.trim(),
        cliente: cliente ? cliente.trim() : null,
        responsable: responsable ? responsable.trim() : null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin_estimada: fecha_fin_estimada || null,
        descripcion: descripcion ? descripcion.trim() : null,
        estado: estado || 'En entendimiento',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, project: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al actualizar proyecto' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden eliminar proyectos' }, { status: 403 });
    }

    const { id } = await params;

    const { error } = await supabaseAdmin.from('projects').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al eliminar proyecto' }, { status: 500 });
  }
}
