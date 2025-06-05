"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// Tipos para os dados que vamos usar
interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string | null;
  type?: string;
  created_at?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  last_message?: string;
  last_message_time?: string;
  participants: Profile[];
}

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"conversations" | "users">(
    "conversations"
  );

  const router = useRouter();

  // Buscar usuário atual e suas conversas
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Verificar sessão
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          router.push("/login");
          return;
        }
        setCurrentUser(session.user);

        // Buscar conversas do usuário
        const { data: conversationsData, error: conversationsError } =
          await supabase.rpc("get_user_conversations", {
            user_id_param: session.user.id,
          });

        if (conversationsError) {
          console.error("Erro ao buscar conversas:", conversationsError);
          // Se o erro for porque a função RPC não existe, podemos mostrar uma mensagem mais amigável
          if (
            conversationsError.message.includes("function") &&
            conversationsError.message.includes("does not exist")
          ) {
            setConversations([]);
          } else {
            throw conversationsError;
          }
        } else {
          setConversations(conversationsData || []);
        }
      } catch (error: any) {
        console.error("Erro ao carregar dados do chat:", error);
        setError(
          error.message ||
            "Não foi possível carregar suas conversas. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Buscar usuários para adicionar como amigos
  const searchUsers = async () => {
    if (!currentUser || !searchTerm.trim()) return;

    setLoadingUsers(true);
    setError(null);

    try {
      // Buscar perfis que correspondam ao termo de busca
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("user_id", currentUser.id) // Excluir o usuário atual
        .ilike("name", `%${searchTerm}%`) // Busca case-insensitive
        .limit(10);

      if (error) throw error;
      setUsers(data || []);
      setActiveTab("users"); // Mudar para a aba de usuários após a busca
    } catch (error: any) {
      console.error("Erro ao buscar usuários:", error);
      setError(
        error.message || "Não foi possível buscar usuários. Tente novamente."
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  // Iniciar uma conversa com um usuário
  const startConversation = (userId: string) => {
    router.push(`/chat/${userId}`);
  };

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Ontem";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("pt-BR", { weekday: "short" });
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-900">Chat</h1>
          <div className="flex items-center gap-3">
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
        {/* Barra de pesquisa */}
        <div className="bg-white rounded-lg shadow-sm mb-4 p-3">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={searchUsers}
              disabled={loadingUsers || !searchTerm.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingUsers ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Buscar"
              )}
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="bg-white rounded-t-lg shadow-sm mb-0">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("conversations")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "conversations"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Conversas
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "users"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Usuários
            </button>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="bg-white rounded-b-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-red-600 mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Tentar novamente
              </button>
            </div>
          ) : activeTab === "conversations" ? (
            // Lista de conversas
            conversations.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-12 h-12 mx-auto mb-3 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
                <p className="text-gray-600 mb-1">
                  Nenhuma conversa encontrada
                </p>
                <p className="text-gray-500 text-sm">
                  Busque por usuários para iniciar uma conversa
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {conversations.map((conversation) => {
                  // Encontrar o outro participante (não o usuário atual)
                  const otherParticipant = conversation.participants?.find(
                    (p) => p.user_id !== currentUser?.id
                  );

                  return (
                    <li key={conversation.id}>
                      <button
                        onClick={() =>
                          startConversation(otherParticipant?.user_id || "")
                        }
                        className="w-full px-4 py-3 flex items-center hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          <Image
                            src={
                              otherParticipant?.avatar_url ||
                              "/default-avatar.png"
                            }
                            alt={otherParticipant?.name || "Usuário"}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="ml-3 flex-1 text-left min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-medium text-gray-900 truncate">
                              {otherParticipant?.name || "Usuário"}
                            </h3>
                            {conversation.last_message_time && (
                              <span className="text-xs text-gray-500">
                                {formatDate(conversation.last_message_time)}
                              </span>
                            )}
                          </div>
                          {conversation.last_message && (
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.last_message}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )
          ) : // Lista de usuários
          users.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 mx-auto mb-3 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                />
              </svg>
              {searchTerm ? (
                <p className="text-gray-600">
                  Nenhum usuário encontrado para "{searchTerm}"
                </p>
              ) : (
                <p className="text-gray-600">
                  Digite um nome para buscar usuários
                </p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.id}>
                  <button
                    onClick={() => startConversation(user.user_id)}
                    className="w-full px-4 py-3 flex items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      <Image
                        src={user.avatar_url || "/default-avatar.png"}
                        alt={user.name || "Usuário"}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="ml-3 flex-1 text-left">
                      <h3 className="font-medium text-gray-900">
                        {user.name || "Usuário"}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {user.type === "dentist"
                          ? "Dentista"
                          : user.type === "technician"
                          ? "Protético"
                          : "Usuário"}
                      </p>
                    </div>
                    <div className="ml-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                          />
                        </svg>
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Barra de Navegação Inferior Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 md:hidden z-20">
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
              d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z"
            />
          </svg>
          <span className="text-xs">Feed</span>
        </button>
        <button
          onClick={() => router.push("/chat")}
          className="flex flex-col items-center text-blue-600"
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
