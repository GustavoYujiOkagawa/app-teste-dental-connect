// Configuração do cliente Supabase com suporte para análise de mordida

import { createClient } from '@supabase/supabase-js';

// Inicializar cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para análise de mordida
export type BiteAnalysis = {
  id: string;
  user_id: string;
  image_url: string;
  midline_angle: number;
  midline_confidence: number;
  face_shape: string;
  face_shape_confidence: number;
  central_incisors_width: number;
  lateral_incisors_width: number;
  canines_width: number;
  proportions_confidence: number;
  recommendations: string[];
  created_at: string;
};

// Tipos para análise dental
export type DentalAnalysis = {
  id: string;
  user_id: string;
  image_url: string;
  tooth_color_code: string;
  tooth_color_hex: string;
  gum_color_code: string;
  gum_color_hex: string;
  notes: string;
  created_at: string;
  bite_analysis_id?: string;
};

// Tipos para perfil de usuário
export type Profile = {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string;
  type: 'dentist' | 'technician';
  specialty?: string;
  clinic_name?: string;
  created_at: string;
};

// Tipos para posts no feed
export type Post = {
  id: string;
  user_id: string;
  dental_analysis_id?: string;
  bite_analysis_id?: string;
  image_url: string;
  description: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
};

// Tipos para conversas e mensagens
export type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

export type ConversationParticipant = {
  id: string;
  conversation_id: string;
  user_id: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  type: 'text' | 'image' | 'analysis';
  read: boolean;
  created_at: string;
};

// Funções auxiliares para autenticação
export const authHelpers = {
  // Registrar novo usuário
  async signUp(email: string, password: string, userData: Partial<Profile>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    
    if (data.user) {
      // Criar perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          name: userData.name,
          avatar_url: userData.avatar_url || '',
          type: userData.type || 'dentist',
          specialty: userData.specialty || '',
          clinic_name: userData.clinic_name || '',
        });
      
      if (profileError) throw profileError;
    }
    
    return data;
  },
  
  // Login de usuário
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },
  
  // Logout
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  // Verificar sessão atual
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },
};

// Funções para gerenciar análises dentais e de mordida
export const analysisHelpers = {
  // Salvar análise dental
  async saveDentalAnalysis(analysis: Partial<DentalAnalysis>) {
    const { data, error } = await supabase
      .from('dental_analyses')
      .insert(analysis)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Salvar análise de mordida
  async saveBiteAnalysis(analysis: Partial<BiteAnalysis>) {
    const { data, error } = await supabase
      .from('bite_analyses')
      .insert(analysis)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Vincular análise dental com análise de mordida
  async linkAnalyses(dentalAnalysisId: string, biteAnalysisId: string) {
    const { error } = await supabase
      .from('dental_analyses')
      .update({ bite_analysis_id: biteAnalysisId })
      .eq('id', dentalAnalysisId);
    
    if (error) throw error;
    return true;
  },
  
  // Obter análises do usuário
  async getUserAnalyses(userId: string) {
    const { data, error } = await supabase
      .from('dental_analyses')
      .select(`
        *,
        bite_analysis:bite_analyses(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
};

// Funções para gerenciar posts no feed
export const postHelpers = {
  // Criar novo post
  async createPost(post: Partial<Post>) {
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Obter feed de posts
  async getFeed() {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profile:profiles(*),
        dental_analysis:dental_analyses(*),
        bite_analysis:bite_analyses(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
};

// Funções para gerenciar mensagens e conversas
export const chatHelpers = {
  // Criar nova conversa
  async createConversation(title: string, participantIds: string[]) {
    // Criar conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({ title })
      .select()
      .single();
    
    if (convError) throw convError;
    
    // Adicionar participantes
    const participants = participantIds.map(userId => ({
      conversation_id: conversation.id,
      user_id: userId
    }));
    
    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert(participants);
    
    if (partError) throw partError;
    
    return conversation;
  },
  
  // Enviar mensagem
  async sendMessage(message: Partial<Message>) {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Obter conversas do usuário
  async getUserConversations(userId: string) {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation:conversations(*),
        other_participants:conversation_participants!inner(
          user:profiles(*)
        )
      `)
      .eq('user_id', userId)
      .neq('other_participants.user_id', userId);
    
    if (error) throw error;
    return data;
  },
};

// Exportar cliente e helpers
export default supabase;
