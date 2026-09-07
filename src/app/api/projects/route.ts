import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentSession } from '@/lib/auth';
import { Project, Phase } from '@/lib/types';

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Fetch projects ordered by created_at desc
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) {
      return NextResponse.json({ error: projectsError.message }, { status: 500 });
    }

    // Fetch phases for all projects
    const { data: phases, error: phasesError } = await supabaseAdmin
      .from('phases')
      .select('*')
      .order('orden', { ascending: true });

    if (phasesError) {
      return NextResponse.json({ error: phasesError.message }, { status: 500 });
    }

    // Fetch active blocks
    const { data: blocks, error: blocksError } = await supabaseAdmin
      .from('phase_blocks')
      .select('*')
      .order('fecha_bloqueo', { ascending: false });

    if (blocksError) {
      return NextResponse.json({ error: blocksError.message }, { status: 500 });
    }

    // Map phases and calculate progress
    const enrichedProjects: Project[] = (projects || []).map((project) => {
      const projPhases = (phases || [])
        .filter((ph) => ph.project_id === project.id)
        .map((ph) => {
          const phBlocks = (blocks || []).filter((b) => b.phase_id === ph.id);
          const activeBlock = phBlocks.find((b) => b.activo) || phBlocks[0] || null;
          return {
            ...ph,
            blocks: phBlocks,
            ultimo_bloqueo: activeBlock,
          };
        });

      const totalPhases = projPhases.length;
      const completedPhases = projPhases.filter((ph) => ph.estado === 'Terminado').length;
      const avance_porcentaje = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

      // Determine current active phase
      const currentPhaseObj =
        projPhases.find((ph) => ph.estado === 'Bloqueado') ||
        projPhases.find((ph) => ph.estado === 'En proceso') ||
        projPhases.find((ph) => ph.estado === 'Sin iniciar') ||
        projPhases[projPhases.length - 1];

      const activeBlocksCount = projPhases.filter((ph) => ph.estado === 'Bloqueado').length;
      const duracionTotalHoras = projPhases.reduce((acc, ph) => {
        const h = ph.estimacion_horas ?? (ph.estimacion_dias ? ph.estimacion_dias * 8 : 40);
        return acc + Number(h);
      }, 0);
      const duracionTotalDias = Math.ceil(duracionTotalHoras / 8);

      const responsablesLista = (project.responsable || '')
        .split(',')
        .map((r: string) => r.trim())
        .filter(Boolean);

      return {
        ...project,
        phases: projPhases,
        avance_porcentaje,
        duracion_total_dias: duracionTotalDias,
        duracion_total_horas: duracionTotalHoras,
        fase_actual: currentPhaseObj ? currentPhaseObj.nombre : 'Sin fases',
        bloqueos_activos: activeBlocksCount,
        responsables_lista: responsablesLista,
      };
    });

    return NextResponse.json({ projects: enrichedProjects });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener proyectos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden crear proyectos' }, { status: 403 });
    }

    const body = await request.json();
    const { nombre, cliente, responsable, fecha_inicio, fecha_fin_estimada, descripcion, estado } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ error: 'El nombre del proyecto es obligatorio' }, { status: 400 });
    }

    // Insert project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        nombre: nombre.trim(),
        cliente: cliente ? cliente.trim() : null,
        responsable: responsable ? responsable.trim() : null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin_estimada: fecha_fin_estimada || null,
        descripcion: descripcion ? descripcion.trim() : null,
        estado: estado || 'En entendimiento',
      })
      .select()
      .single();

    if (projectError) {
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    // Mandatory initial phase: "Levantamiento de información"
    const { error: phaseError } = await supabaseAdmin.from('phases').insert({
      project_id: project.id,
      nombre: 'Levantamiento de información',
      orden: 1,
      es_levantamiento: true,
      estimacion_dias: 5,
      estimacion_horas: 40,
      fecha_inicio_estimada: fecha_inicio || new Date().toISOString().split('T')[0],
      fecha_fin_estimada: fecha_fin_estimada || null,
      estado: 'Sin iniciar',
    });

    if (phaseError) {
      return NextResponse.json({ error: phaseError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, project });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al crear proyecto' }, { status: 500 });
  }
}
