import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentSession } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden desbloquear fases' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const nuevo_estado = body.nuevo_estado || 'En progreso';

    // Update active blocks for this phase
    const { error: blockError } = await supabaseAdmin
      .from('phase_blocks')
      .update({
        activo: false,
        fecha_desbloqueo: new Date().toISOString(),
        desbloqueado_por: session.email,
      })
      .eq('phase_id', id)
      .eq('activo', true);

    if (blockError) {
      return NextResponse.json({ error: blockError.message }, { status: 500 });
    }

    // Update phase status
    const { data: phase, error: phaseError } = await supabaseAdmin
      .from('phases')
      .update({
        estado: nuevo_estado,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (phaseError) {
      return NextResponse.json({ error: phaseError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, phase });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al desbloquear fase' }, { status: 500 });
  }
}
