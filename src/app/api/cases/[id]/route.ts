
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server'; // Use server client

// GET specific case by ID (for viewing/editing details)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const supabaseClient = supabase();
    const caseId = params.id;

    try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
        }

        if (!caseId) {
            return NextResponse.json({ error: 'ID do caso não fornecido.' }, { status: 400 });
        }

        const { data: caseData, error: fetchError } = await supabaseClient
            .from('cases')
            .select('*')
            .eq('id', caseId)
            .eq('user_id', user.id) // Ensure user owns the case
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') { // Not found
                return NextResponse.json({ error: 'Caso não encontrado ou não pertence a este usuário.' }, { status: 404 });
            }
            console.error('Erro ao buscar caso:', fetchError);
            throw fetchError;
        }

        return NextResponse.json(caseData, { status: 200 });

    } catch (error: any) {
        console.error('Erro na API de busca de caso específico:', error);
        return NextResponse.json({ error: error.message || 'Erro interno do servidor ao buscar caso.' }, { status: 500 });
    }
}

// UPDATE specific case by ID
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const supabaseClient = supabase();
    const caseId = params.id;

    try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
        }

        if (!caseId) {
            return NextResponse.json({ error: 'ID do caso não fornecido.' }, { status: 400 });
        }

        const { patient_name, description, status } = await req.json();

        if (!patient_name) {
            return NextResponse.json({ error: 'Nome do paciente é obrigatório.' }, { status: 400 });
        }

        const { data: updatedCase, error: updateError } = await supabaseClient
            .from('cases')
            .update({
                patient_name: patient_name,
                description: description || null,
                status: status || 'active', // Default to active if not provided
                updated_at: new Date().toISOString(),
            })
            .eq('id', caseId)
            .eq('user_id', user.id) // Ensure user owns the case
            .select()
            .single();

        if (updateError) {
             if (updateError.code === 'PGRST116') { // Not found / not owner
                return NextResponse.json({ error: 'Caso não encontrado ou não pertence a este usuário para atualização.' }, { status: 404 });
            }
            console.error('Erro ao atualizar caso:', updateError);
            throw updateError;
        }

        return NextResponse.json(updatedCase, { status: 200 });

    } catch (error: any) {
        console.error('Erro na API de atualização de caso:', error);
        return NextResponse.json({ error: error.message || 'Erro interno do servidor ao atualizar caso.' }, { status: 500 });
    }
}

// DELETE specific case by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const supabaseClient = supabase();
    const caseId = params.id;

    try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
        }

        if (!caseId) {
            return NextResponse.json({ error: 'ID do caso não fornecido.' }, { status: 400 });
        }

        // Optional: Check if case exists and belongs to user before deleting
        // (DELETE already checks ownership via RLS policy, but explicit check can give better error)

        const { error: deleteError } = await supabaseClient
            .from('cases')
            .delete()
            .eq('id', caseId)
            .eq('user_id', user.id); // RLS policy also enforces this

        if (deleteError) {
            // Note: DELETE might not return PGRST116 if RLS prevents finding the row
            console.error('Erro ao deletar caso:', deleteError);
            throw deleteError;
        }

        // Check if any rows were deleted (optional, requires count)
        // const { count } = await supabaseClient.from('cases').select('*', { count: 'exact', head: true }).eq('id', caseId);
        // if (count === 0) { // Or check the error message if possible
        //     return NextResponse.json({ error: 'Caso não encontrado ou não pertence a este usuário para exclusão.' }, { status: 404 });
        // }

        return NextResponse.json({ message: 'Caso excluído com sucesso.' }, { status: 200 }); // Or 204 No Content

    } catch (error: any) {
        console.error('Erro na API de exclusão de caso:', error);
        return NextResponse.json({ error: error.message || 'Erro interno do servidor ao excluir caso.' }, { status: 500 });
    }
}

