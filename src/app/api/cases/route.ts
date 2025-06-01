import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // Use server client

export async function POST(req: NextRequest) {
  const supabaseClient = supabase;
  try {
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("Erro de autenticação:", userError);
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const { patient_name, description } = await req.json();

    if (!patient_name) {
      return NextResponse.json(
        { error: "Nome do paciente é obrigatório." },
        { status: 400 }
      );
    }

    // Insert the new case
    const { data: newCase, error: insertError } = await supabaseClient
      .from("cases")
      .insert({
        user_id: user.id,
        patient_name: patient_name,
        description: description || null,
        status: "active",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao inserir caso:", insertError);
      throw insertError;
    }

    // Optionally: Create a post in the feed immediately after case creation
    // (Consider if this should be a separate action triggered by the user)
    /*
    const { error: postError } = await supabaseClient
      .from('posts')
      .insert({
        user_id: user.id,
        post_type: 'case',
        case_id: newCase.id,
        description: `Novo caso iniciado para ${patient_name}. ${description || ''}`.trim(),
        // image_url: null // No image initially for case posts
      });

    if (postError) {
      console.warn('Erro ao criar post no feed para o novo caso:', postError);
      // Don't fail the whole request, just log the warning
    }
    */

    return NextResponse.json(newCase, { status: 201 });
  } catch (error: any) {
    console.error("Erro na API de criação de caso:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor ao criar caso." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const supabaseClient = supabase;
  try {
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("Erro de autenticação:", userError);
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    // Fetch cases for the logged-in user
    const { data: cases, error: fetchError } = await supabaseClient
      .from("cases")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Erro ao buscar casos:", fetchError);
      throw fetchError;
    }

    return NextResponse.json(cases || [], { status: 200 });
  } catch (error: any) {
    console.error("Erro na API de busca de casos:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor ao buscar casos." },
      { status: 500 }
    );
  }
}
