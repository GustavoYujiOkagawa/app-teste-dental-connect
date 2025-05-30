'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Help() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Ajuda e Suporte</h1>
          <Link href="/dashboard" className="text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Seção de Perguntas Frequentes */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Perguntas Frequentes</h2>
                
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-md p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Como funciona a análise de cor dental?</h3>
                    <p className="text-gray-600 text-sm">
                      Nossa análise de cor dental utiliza tecnologia avançada para identificar a cor exata do dente na escala Vita e da gengiva na escala Thomas Gomes. Basta tirar uma foto ou fazer upload de uma imagem, e nosso sistema fará a análise automaticamente.
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Como funciona a análise de mordida?</h3>
                    <p className="text-gray-600 text-sm">
                      A análise de mordida utiliza inteligência artificial para detectar a linha média facial e calcular o tamanho ideal dos dentes com base no formato do rosto. Esta funcionalidade ajuda a determinar proporções dentárias harmônicas para cada paciente.
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Como compartilhar análises com colegas?</h3>
                    <p className="text-gray-600 text-sm">
                      Após realizar uma análise, você pode compartilhá-la no feed social ou diretamente com um colega específico através do chat. Isso facilita a comunicação entre dentistas e protéticos sobre casos específicos.
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Posso acessar minhas análises anteriores?</h3>
                    <p className="text-gray-600 text-sm">
                      Sim! Todas as suas análises ficam salvas no seu histórico, que pode ser acessado através do Dashboard. Você pode revisar, compartilhar novamente ou fazer referência a análises anteriores a qualquer momento.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Seção de Contato e Tutoriais */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Tutoriais e Contato</h2>
                
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-md p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Tutoriais em Vídeo</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                        <a href="#" className="text-blue-600 hover:underline">Como fazer sua primeira análise de cor</a>
                      </li>
                      <li className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                        <a href="#" className="text-blue-600 hover:underline">Guia de análise de mordida e linha média</a>
                      </li>
                      <li className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                        <a href="#" className="text-blue-600 hover:underline">Como usar o feed social e o chat</a>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Documentação</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <a href="#" className="text-blue-600 hover:underline">Manual do usuário completo</a>
                      </li>
                      <li className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <a href="#" className="text-blue-600 hover:underline">Guia de referência das escalas de cor</a>
                      </li>
                      <li className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <a href="#" className="text-blue-600 hover:underline">Melhores práticas para fotos dentais</a>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Entre em Contato</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Não encontrou o que procurava? Entre em contato com nossa equipe de suporte.
                    </p>
                    <a 
                      href="mailto:suporte@dentalconnect.com" 
                      className="inline-flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                      suporte@dentalconnect.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
