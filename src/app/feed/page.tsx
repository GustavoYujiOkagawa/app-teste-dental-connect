"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { FaHeart, FaTrash } from "react-icons/fa";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";

// Tipos (mantidos como antes, baseados no schema)
interface Post {
  id: string;
  user_id: string;
  created_at: string;
  image_url?: string | null;
  description: string;
  likes_count?: number;
  dental_analysis_id?: string | null;
  post_type: string;
}

interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string | null;
  type?: string;
}

interface DentalAnalysis {
  id: string;
  user_id: string;
  image_url: string;
  tooth_color_code: string;
  gum_color_code: string;
  notes?: string | null;
  created_at: string;
}

type PostWithDetails = Post & {
  profiles?: Profile | null; // Agora será preenchido manualmente
  dental_analyses?: DentalAnalysis | null;
};

import type { User } from "@supabase/supabase-js";

export default function Feed() {
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null); // ID do post sendo excluído
  const router = useRouter();

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Erro ao buscar sessão:", sessionError);
        setError("Erro ao verificar autenticação.");
        router.push("/login");
        return;
      }
      if (session) {
        setCurrentUser(session.user);
      } else {
        router.push("/login");
      }
    };
    getCurrentUser();
  }, [router]);

  const fetchPosts = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      // --- ABORDAGEM DE BUSCA EM DUAS ETAPAS ---

      // 1. Buscar posts e detalhes da análise (se houver)
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(
          `
          *,
          dental_analyses!left ( * )
        `
        )
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Supabase fetch posts error:", postsError);
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // 2. Coletar IDs únicos dos autores dos posts
      const authorIds = [...new Set(postsData.map((p) => p.user_id))];

      // 3. Buscar os perfis correspondentes a esses autores
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", authorIds); // Busca perfis pelos user_id coletados

      if (profilesError) {
        console.error("Supabase fetch profiles error:", profilesError);
        // Poderíamos continuar sem os perfis, mas é melhor indicar o erro
        throw profilesError;
      }

      // 4. Combinar os dados: Mapear perfis por user_id para fácil acesso
      const profilesMap = new Map<string, Profile>();
      profilesData?.forEach((profile) => {
        profilesMap.set(profile.user_id, profile as Profile);
      });

      // 5. Formatar os posts finais, adicionando o perfil correspondente
      const formattedPosts = postsData.map((p) => {
        const profile = profilesMap.get(p.user_id);
        const imageUrl = p.image_url || p.dental_analyses?.image_url || null;
        return {
          ...p,
          profiles: profile || null, // Adiciona o perfil encontrado
          image_url: imageUrl,
          likes_count: p.likes_count || 0,
          dental_analyses: p.dental_analyses || null,
        };
      });

      setPosts(formattedPosts as PostWithDetails[]);
    } catch (error: any) {
      console.error("Erro ao carregar posts:", error);
      let userErrorMessage =
        "Não foi possível carregar o feed. Verifique sua conexão ou tente mais tarde.";
      if (error.code) {
        userErrorMessage = `Erro ao carregar feed (${error.code}). Verifique as permissões (RLS) e a conexão.`;
      }
      setError(userErrorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchPosts();
    }
  }, [currentUser, fetchPosts]);

  // Funções handleLike e handleChat (sem alterações)
  const handleLike = async (postId: string) => {
    if (!currentUser) return;
    console.log(`Curtir post ${postId}`);
    setPosts((currentPosts) =>
      currentPosts.map((p) =>
        p.id === postId ? { ...p, likes_count: (p.likes_count ?? 0) + 1 } : p
      )
    );
    // Adicionar lógica Supabase aqui
  };

  const handleChat = (postAuthorId: string) => {
    if (!currentUser || currentUser.id === postAuthorId) {
      console.log("Não pode iniciar chat consigo mesmo ou não logado.");
      return;
    }
    router.push(`/chat/${postAuthorId}`);
  };

  // Nova função para excluir post
  const handleDeletePost = async (postId: string, userId: string) => {
    // Verificar se o usuário atual é o autor do post
    if (!currentUser || currentUser.id !== userId) {
      alert("Você só pode excluir seus próprios posts.");
      return;
    }

    // Confirmar exclusão
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita."
    );

    if (!confirmDelete) return;

    setDeleting(postId);
    setError(null);

    try {
      // Excluir o post do Supabase
      const { error: deleteError } = await supabase
        .from("posts")
        .delete()
        .match({ id: postId });

      if (deleteError) throw deleteError;

      // Atualizar a lista de posts localmente (remover o post excluído)
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== postId)
      );

      // Opcional: Mostrar mensagem de sucesso
      console.log("Post excluído com sucesso!");
    } catch (error: any) {
      console.error("Erro ao excluir post:", error);
      setError(
        `Não foi possível excluir o post. ${
          error.message || "Tente novamente mais tarde."
        }`
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-900">Feed</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/analyze")}
              className="text-blue-600 hover:text-blue-700 text-xs"
            >
              Nova Análise
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-600 hover:text-gray-800 text-xs"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center pt-10">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded text-center">
            <p className="font-semibold">Ocorreu um erro ao carregar o feed:</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchPosts}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-700">
              Nenhuma postagem encontrada no feed.
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Compartilhe suas análises para vê-las aqui!
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post, index) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                {/* Cabeçalho do Post */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image
                      src={post.profiles?.avatar_url || "/default-avatar.png"}
                      alt={`Avatar de ${post.profiles?.name || "Usuário"}`}
                      width={40}
                      height={40}
                      className="rounded-full object-cover border border-gray-200"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {post.profiles?.name || "Usuário Anônimo"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {post.profiles?.type === "dentist"
                          ? "Dentista"
                          : post.profiles?.type === "technician"
                          ? "Protético"
                          : "Usuário"}
                        {" • "}
                        {new Date(post.created_at).toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Botão de exclusão (apenas para o autor do post) */}
                  {currentUser?.id === post.user_id && (
                    <button
                      onClick={() => handleDeletePost(post.id, post.user_id)}
                      disabled={deleting === post.id}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-full transition-colors"
                      title="Excluir post"
                    >
                      {deleting === post.id ? (
                        <span className="inline-block w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <FaTrash className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Imagem do Post (com lógica de fallback para imagem da análise) */}
                {post.image_url ? (
                  <div className="relative aspect-square bg-gray-200">
                    <Image
                      src={post.image_url}
                      alt={`Postagem ${post.id}`}
                      fill
                      className="object-cover"
                      priority={index < 2}
                      sizes="(max-width: 640px) 100vw, 640px"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-400 text-sm">Sem imagem</p>
                  </div>
                )}

                {/* Ações e Descrição */}
                <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <FaHeart className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {post.likes_count || 0}
                    </span>
                  </button>
                  {currentUser?.id !== post.user_id && (
                    <button
                      onClick={() => handleChat(post.user_id)}
                      className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
                      title={`Enviar mensagem para ${
                        post.profiles?.name || "usuário"
                      }`}
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                      <span>Mensagem</span>
                    </button>
                  )}
                </div>

                {/* Descrição e Detalhes da Análise */}
                <div className="px-4 pb-4">
                  {post.description && (
                    <p className="text-sm text-gray-800 mb-2">
                      <span className="font-medium text-gray-900">
                        {post.profiles?.name || "Usuário"}
                      </span>{" "}
                      {post.description}
                    </p>
                  )}
                  {/* Detalhes da Análise associada */}
                  {post.dental_analyses && (
                    <details className="mt-2 bg-gray-50 p-3 rounded-md border border-gray-200">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                        Detalhes da Análise Vinculada
                      </summary>
                      <div className="mt-2 text-xs grid grid-cols-2 gap-x-4 gap-y-1 text-gray-600">
                        <p>
                          <span className="font-semibold text-gray-800">
                            Cor Dente:
                          </span>{" "}
                          {post.dental_analyses.tooth_color_code || "N/I"}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-800">
                            Cor Gengiva:
                          </span>{" "}
                          {post.dental_analyses.gum_color_code || "N/I"}
                        </p>
                        <p className="col-span-2">
                          <span className="font-semibold text-gray-800">
                            Notas:
                          </span>{" "}
                          {post.dental_analyses.notes || "Nenhuma"}
                        </p>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Barra de Navegação Inferior Mobile (sem alterações) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 md:hidden z-20">
        {/* ... botões da nav ... */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex flex-col items-center text-gray-600 hover:text-blue-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5"
            />
          </svg>
          <span className="text-xs">Início</span>
        </button>
        <button
          onClick={() => router.push("/analyze")}
          className="flex flex-col items-center text-gray-600 hover:text-blue-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
            />
          </svg>
          <span className="text-xs">Analisar</span>
        </button>
        <button
          onClick={() => router.push("/feed")}
          className="flex flex-col items-center text-blue-600"
        >
          {" "}
          {/* Feed ativo */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z"
            />
          </svg>
          <span className="text-xs">Feed</span>
        </button>
        <button
          onClick={() => router.push("/chat")}
          className="flex flex-col items-center text-gray-600 hover:text-blue-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
            />
          </svg>
          <span className="text-xs">Chat</span>
        </button>
      </nav>
    </div>
  );
}
