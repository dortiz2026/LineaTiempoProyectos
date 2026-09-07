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
      return NextResponse.json({ error: 'Solo los administradores pueden registrar bloqueos' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { comentario } = body;

    if (!comentario || !comentario.trim()) {
      return NextResponse.json({ error: 'El comentario del motivo del bloqueo es obligatorio' }, { status: 400 });
    }

    // Insert block record
    const { data: block, error: blockError } = await supabaseAdmin
      .from('phase_blocks')
      .insert({
        phase_id: id,
        comentario: comentario.trim(),
        bloqueado_por: session.email,
        fecha_bloqueo: new Date().toISOString(),
        activo: true,
      })
      .select()
      .single();

    if (blockError) {
      return NextResponse.json({ error: blockError.message }, { status: 500 });
    }

    // Update phase status to Bloqueado
    const { data: phase, error: phaseError } = await supabaseAdmin
      .from('phases')
      .update({
        estado: 'Bloqueado',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (phaseError) {
      return NextResponse.json({ error: phaseError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, block, phase });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al bloquear fase' }, { status: 500 });
  }
}
