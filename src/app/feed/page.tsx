'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import type { Post, Profile, DentalAnalysis } from '@/lib/supabase';

export default function Feed() {
  const [posts, setPosts] = useState<(Post & { profile: Profile; dental_analysis?: DentalAnalysis })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Verificar se o usuário está autenticado
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        // Buscar posts com informações do perfil do autor e análises dentais
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profile:profiles(*),
            dental_analysis:dental_analyses(*)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setPosts(data || []);
      } catch (error: any) {
        console.error('Erro ao carregar posts:', error);
        setError('Não foi possível carregar o feed. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [router]);

  const handleLike = async (postId: string) => {
    try {
      // Implementação simplificada de "curtir"
      // Em uma implementação completa, isso seria uma tabela separada de likes
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Encontrar o post e obter o contador de likes atual com fallback seguro
      const post = posts.find(p => p.id === postId);
      const currentLikes = post?.likes_count ?? 0;
      
      const { error } = await supabase
        .from('posts')
        .update({ likes_count: currentLikes + 1 })
        .eq('id', postId);

      if (error) throw error;

      // Atualizar estado local
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, likes_count: post.likes_count + 1 } 
          : post
      ));
    } catch (error) {
      console.error('Erro ao curtir post:', error);
    }
  };

  const handleChat = (dentistId: string) => {
    // Navegar para a tela de chat com o dentista
    router.push(`/chat/${dentistId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">DentalConnect</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/analyze')}
              className="text-blue-600 hover:text-blue-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
            </button>
            <button 
              onClick={() => router.push('/profile')}
              className="w-8 h-8 rounded-full overflow-hidden border border-gray-300"
            >
              <Image
                src="/profile-example.jpg"
                alt="Perfil"
                width={32}
                height={32}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-md">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma postagem encontrada</h3>
            <p className="mt-1 text-gray-500">
              Comece seguindo dentistas ou protéticos para ver suas postagens aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Cabeçalho do post */}
                <div className="p-4 flex items-center">
                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                    <Image
                      src={post.profile.avatar_url || "/default-avatar.png"}
                      alt={post.profile.name}
                      width={40}
                      height={40}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{post.profile.name}</h3>
                    <p className="text-xs text-gray-500">
                      {post.profile.type === 'dentist' ? 'Dentista' : 'Protético'} • {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Imagem do post */}
                <div className="relative aspect-square">
                  <Image
                    src={post.image_url}
                    alt="Imagem do caso dental"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                {/* Ações do post */}
                <div className="p-4 flex items-center space-x-4 border-b border-gray-100">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className="flex items-center text-gray-600 hover:text-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                    <span>{post.likes_count || 0}</span>
                  </button>
                  <button 
                    onClick={() => handleChat(post.user_id)}
                    className="flex items-center text-gray-600 hover:text-blue-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                    <span>Chat</span>
                  </button>
                </div>

                {/* Conteúdo do post */}
                <div className="p-4">
                  <p className="text-gray-900 mb-2">{post.description}</p>
                  
                  {/* Informações técnicas */}
                  <div className="mt-4 bg-gray-50 p-3 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Informações técnicas:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Cor do dente:</span>
                        <div className="flex items-center mt-1">
                          <div 
                            className="w-4 h-4 rounded-full mr-1" 
                            style={{ backgroundColor: post.dental_analysis?.tooth_color_hex || '#cccccc' }}
                          ></div>
                          <span>{post.dental_analysis?.tooth_color_code || 'N/A'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Cor da gengiva:</span>
                        <div className="flex items-center mt-1">
                          <div 
                            className="w-4 h-4 rounded-full mr-1" 
                            style={{ backgroundColor: post.dental_analysis?.gum_color_hex || '#cccccc' }}
                          ></div>
                          <span>{post.dental_analysis?.gum_color_code || 'N/A'}</span>
                        </div>
                      </div>
                      {post.dental_analysis?.notes && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Observações:</span>
                          <p className="mt-1">{post.dental_analysis.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Botão flutuante para nova análise/post */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => router.push('/analyze')}
          className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
