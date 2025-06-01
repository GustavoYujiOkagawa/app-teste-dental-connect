"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { FaHeart } from "react-icons/fa";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
// import { supabase } from "@/lib/supabase"; // <-- 🔥 Descomente isso quando quiser ativar o banco

// import type { Post, Profile, DentalAnalysis } from "@/lib/supabase"; // <-- 🔥 Descomente para usar os tipos do Supabase
// import type { User } from "@supabase/supabase-js"; // <-- 🔥 Descomente para o usuário

// Tipagem fake para funcionar enquanto o banco estiver comentado
type PostWithDetails = {
  id: string;
  user_id: string;
  created_at: string;
  image_url: string;
  description: string;
  likes_count?: number;
  profiles?: {
    name: string;
    avatar_url?: string;
    type?: string;
  } | null;
  dental_analyses?: {
    tooth: string;
    material: string;
    color: string;
    observation: string;
  } | null;
};

// 🔥 Dados fake temporários (REMOVER quando for usar o banco)
const FAKE_POSTS: PostWithDetails[] = [
  {
    id: "1",
    user_id: "user1",
    created_at: new Date().toISOString(),
    image_url: "/imagem-fake1.jpg",
    description: "Análise de cor para prótese anterior.",
    likes_count: 5,
    profiles: {
      name: "Dr. Fabinho",
      avatar_url: "/default-avatar.png",
      type: "dentist",
    },
    dental_analyses: {
      tooth: "11",
      material: "Zircônia",
      color: "A2",
      observation: "Paciente deseja aspecto natural.",
    },
  },
  {
    id: "2",
    user_id: "user2",
    created_at: new Date().toISOString(),
    image_url: "/imagem-scaneer-fake.jpg",
    description: "Escaneamento para prótese total.",
    likes_count: 3,
    profiles: {
      name: "Lab Dental Pro",
      avatar_url: "/default-avatar.png",
      type: "technician",
    },
    dental_analyses: {
      tooth: "24",
      material: "Cerâmica",
      color: "B1",
      observation: "Atenção à translucidez.",
    },
  },
];

export default function Feed() {
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null); // <-- Trocar para User quando ativar Supabase

  const router = useRouter();

  // 🔥 Descomente isso para pegar o usuário logado do Supabase
  /*
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
      } else {
        router.push("/login");
      }
    };
    getCurrentUser();
  }, [router]);
  */

  // 🔥 Dados fake temporários (REMOVER quando for usar o banco)
  useEffect(() => {
    setTimeout(() => {
      setPosts(FAKE_POSTS);
      setLoading(false);
    }, 1000);
  }, []);

  // 🔥 Função real para buscar do banco (ATIVAR quando for usar Supabase)
  /*
  const fetchPosts = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("posts")
        .select(`*, profiles(*), dental_analyses(*)`)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setPosts((data as PostWithDetails[]) || []);
    } catch (error: any) {
      console.error("Erro ao carregar posts:", error);
      setError("Não foi possível carregar o feed.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchPosts();
    }
  }, [currentUser, fetchPosts]);
  */

  // Curtir post (fake por enquanto)
  const handleLike = (postId: string) => {
    setPosts((currentPosts) =>
      currentPosts.map((p) =>
        p.id === postId ? { ...p, likes_count: (p.likes_count ?? 0) + 1 } : p
      )
    );
  };

  const handleChat = (postAuthorId: string) => {
    if (!currentUser || currentUser.id === postAuthorId) {
      console.log("Não pode iniciar chat consigo mesmo ou não logado.");
      return;
    }
    router.push(`/chat/${postAuthorId}`);
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
          <div className="flex justify-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-700">Nenhuma postagem encontrada.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow">
                <div className="p-4 flex items-center gap-3">
                  <Image
                    src={post.profiles?.avatar_url || "/default-avatar.png"}
                    alt="Avatar"
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {post.profiles?.name || "Usuário"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {post.profiles?.type === "dentist"
                        ? "Dentista"
                        : post.profiles?.type === "technician"
                        ? "Protético"
                        : ""}
                      {" • "}
                      {new Date(post.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={post.image_url}
                    alt="Imagem"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1 text-gray-500 hover:text-red-500"
                  >
                    <FaHeart color="red" size={16} />
                    {post.likes_count || 0}
                  </button>
                  {currentUser?.id !== post.user_id && (
                    <button
                      onClick={() => handleChat(post.user_id)}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <PaperAirplaneIcon className="w-4 h-4 text-blue-600" />
                    </button>
                  )}
                </div>
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">
                      {post.profiles?.name || "Usuário"}
                    </span>{" "}
                    {post.description}
                  </p>
                  {post.dental_analyses && (
                    <details className="mt-2 bg-gray-50 p-3 rounded-md border">
                      <summary className="cursor-pointer text-sm text-gray-600">
                        Detalhes da Análise
                      </summary>
                      <div className="mt-2 text-xs grid grid-cols-2 gap-2">
                        <p>
                          <span className="text-gray-500">Dente: </span>
                          {post.dental_analyses.tooth}
                        </p>
                        <p>
                          <span className="text-gray-500">Material: </span>
                          {post.dental_analyses.material}
                        </p>
                        <p>
                          <span className="text-gray-500">Cor: </span>
                          {post.dental_analyses.color}
                        </p>
                        <p className="col-span-2">
                          <span className="text-gray-500">Observações: </span>
                          {post.dental_analyses.observation}
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
    </div>
  );
}
