
// Configuração do cliente Supabase com suporte para análise de mordida, casos, etc.

import { createClient } from '@supabase/supabase-js';

// Inicializar cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para análise de mordida (se usado)
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
  notes?: string | null; // Allow null
  created_at: string;
  updated_at: string;
};

// Tipos para perfil de usuário
export type Profile = {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string | null; // Allow null
  type: 'dentist' | 'technician';
  specialty?: string | null; // Allow null
  clinic_name?: string | null; // Allow null
  created_at: string;
  updated_at: string;
};

// Tipos para Casos (Pacientes)
export type Case = {
  id: string;
  user_id: string;
  patient_name: string;
  description?: string | null; // Allow null
  status: 'active' | 'archived' | 'completed';
  created_at: string;
  updated_at: string;
};

// Tipos para posts no feed
export type Post = {
  id: string;
  user_id: string;
  post_type: 'analysis' | 'case';
  dental_analysis_id?: string | null; // Allow null
  case_id?: string | null; // Allow null
  image_url?: string | null; // Allow null for case posts
  description: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
};

// Tipos para conversas e mensagens
export type Conversation = {
  id: string;
  title?: string | null; // Allow null
  created_at: string;
  updated_at: string;
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
  type: 'text' | 'image' | 'analysis' | 'case_link';
  read: boolean;
  created_at: string;
};

// Exportar cliente
export default supabase;

