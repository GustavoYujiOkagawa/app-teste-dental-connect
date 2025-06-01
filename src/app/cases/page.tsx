
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Case, Profile } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import Image from 'next/image';

// --- Components (Placeholders - Implement these separately) ---

// Modal for Adding/Editing Cases
interface CaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (caseData: Partial<Case>) => Promise<void>;
  initialData?: Case | null;
  isLoading: boolean;
}

const CaseModal: React.FC<CaseModalProps> = ({ isOpen, onClose, onSave, initialData, isLoading }) => {
  const [patientName, setPatientName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Case['status']>('active');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setPatientName(initialData.patient_name || '');
      setDescription(initialData.description || '');
      setStatus(initialData.status || 'active');
    } else {
      // Reset form for new case
      setPatientName('');
      setDescription('');
      setStatus('active');
    }
    setError(null); // Clear error when modal opens or data changes
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!patientName.trim()) {
      setError('Nome do paciente é obrigatório.');
      return;
    }
    try {
      await onSave({
        id: initialData?.id, // Pass ID for updates
        patient_name: patientName.trim(),
        description: description.trim() || null,
        status: status,
      });
      // onClose(); // Let parent handle close on success
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar o caso.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {initialData ? 'Editar Caso' : 'Adicionar Novo Caso'}
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Paciente <span className="text-red-500">*</span>
              </label>
              <input
                id="patientName"
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Nome completo do paciente"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição (Opcional)
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Detalhes sobre o caso, tratamento, etc."
              />
            </div>
            {initialData && (
                 <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status do Caso
                    </label>
                    <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as Case['status'])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                    >
                        <option value="active">Ativo</option>
                        <option value="completed">Concluído</option>
                        <option value="archived">Arquivado</option>
                    </select>
                 </div>
            )}
          </div>
          <div className="px-5 py-3 bg-gray-50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Salvando...
                </div>
              ) : (
                initialData ? 'Salvar Alterações' : 'Adicionar Caso'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Page Component ---

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const router = useRouter();

  // Fetch user profile and cases
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        router.push('/login');
        return;
      }
      const userId = session.user.id;

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      setProfile(profileData);

      // Fetch cases using API route
      const response = await fetch('/api/cases');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao buscar casos.');
      }
      const casesData: Case[] = await response.json();
      setCases(casesData);

    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      setError(err.message || "Falha ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- CRUD Operations ---

  const handleAddCase = () => {
    setEditingCase(null); // Ensure we are adding, not editing
    setIsModalOpen(true);
  };

  const handleEditCase = (caseItem: Case) => {
    setEditingCase(caseItem);
    setIsModalOpen(true);
  };

  const handleSaveCase = async (caseData: Partial<Case>) => {
    setSaving(true);
    const isEditing = !!caseData.id;
    const url = isEditing ? `/api/cases/${caseData.id}` : '/api/cases';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao ${isEditing ? 'atualizar' : 'adicionar'} caso.`);
      }

      const savedCase: Case = await response.json();

      // Update local state
      if (isEditing) {
        setCases(prevCases => prevCases.map(c => c.id === savedCase.id ? savedCase : c));
      } else {
        setCases(prevCases => [savedCase, ...prevCases]);
        // Optionally create feed post here or trigger another action
        await createCaseFeedPost(savedCase);
      }

      setIsModalOpen(false);
      setEditingCase(null);

    } catch (err: any) {
      console.error("Erro ao salvar caso:", err);
      // Display error within the modal instead of page-level
      // setError(err.message || "Falha ao salvar caso.");
      throw err; // Re-throw to be caught by modal's handler
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!confirm("Tem certeza que deseja excluir este caso? Esta ação não pode ser desfeita.")) {
      return;
    }
    setLoading(true); // Use loading state for delete indication
    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao excluir caso.');
      }

      setCases(prevCases => prevCases.filter(c => c.id !== caseId));

    } catch (err: any) {
      console.error("Erro ao excluir caso:", err);
      setError(err.message || "Falha ao excluir caso.");
    } finally {
      setLoading(false);
    }
  };

  // Function to create a feed post when a new case is added
  const createCaseFeedPost = async (newCase: Case) => {
    if (!profile) return; // Need profile info

    try {
      const description = `Novo caso iniciado para ${newCase.patient_name}. ${newCase.description || ''}`.trim();

      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: newCase.user_id,
          post_type: 'case',
          case_id: newCase.id,
          description: description,
          // image_url: null // No image initially for case posts
        });

      if (postError) {
        console.warn('Erro ao criar post no feed para o novo caso:', postError);
        // Don't show this error to the user, just log it
      }
    } catch (err) {
      console.error('Erro inesperado ao criar post no feed:', err);
    }
  };

  // --- Render Logic ---

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Gerenciamento de Casos</h1>
          <div className="flex items-center space-x-3">
             <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-800 p-1"
                title="Dashboard"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                 </svg>
              </button>
              <button
                onClick={handleAddCase}
                className="bg-blue-600 text-white py-1.5 px-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Novo Caso
              </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Erro: </strong>
            <span className="block sm:inline">{error}</span>
            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Fechar erro">
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Fechar</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : cases.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400">
               <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
            </svg>
            <h3 className="mt-2 text-base sm:text-lg font-medium text-gray-900">Nenhum Caso Encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Você ainda não adicionou nenhum caso. Clique em "Novo Caso" para começar.
            </p>
            <button
                onClick={handleAddCase}
                className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 text-sm"
            >
                Adicionar Novo Caso
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <ul role="list" className="divide-y divide-gray-200">
              {cases.map((caseItem) => (
                <li key={caseItem.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-blue-600 truncate">{caseItem.patient_name}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {caseItem.description || 'Sem descrição'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Criado em: {new Date(caseItem.created_at).toLocaleDateString('pt-BR')}
                        {' • '} Status: <span className={`font-medium ${caseItem.status === 'active' ? 'text-green-600' : caseItem.status === 'completed' ? 'text-blue-600' : 'text-gray-500'}`}>{caseItem.status === 'active' ? 'Ativo' : caseItem.status === 'completed' ? 'Concluído' : 'Arquivado'}</span>
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                      <button
                        onClick={() => handleEditCase(caseItem)}
                        className="p-1 text-gray-500 hover:text-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        title="Editar Caso"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteCase(caseItem.id)}
                        className="p-1 text-gray-500 hover:text-red-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                        title="Excluir Caso"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Modal for Adding/Editing Cases */}
      <CaseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCase(null);
        }}
        onSave={handleSaveCase}
        initialData={editingCase}
        isLoading={saving}
      />
    </div>
  );
}

