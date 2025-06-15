"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { Message, Profile } from "@/lib/supabase"; // Assuming these types exist and are correct
import type { User } from "@supabase/supabase-js";

interface ChatPageProps {
  params: {
    id: string; // This ID should be the user_id of the recipient
  };
}

// Define a combined type for messages with sender profile
type MessageWithSender = Message & { profiles: Profile | null };

export default function ChatPage({ params }: ChatPageProps) {
  const recipientUserId = params.id;
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<Profile | null>(
    null
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(
    null
  );
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // --- Data Fetching and Initialization ---

  // Fetch current user and recipient profile
  const initializeChat = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log("Initializing chat...");
    try {
      // 1. Get current user session
      console.log("Fetching user session...");
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error("Session error or no session:", sessionError);
        router.push("/login");
        return;
      }
      const user = session.user;
      console.log("User session found:", user.id);
      setCurrentUser(user);

      // 2. Fetch current user's profile
      console.log("Fetching current user profile...");
      const { data: userProfile, error: userProfileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      // Allow profile to be null initially, handle creation/update elsewhere (e.g., settings)
      if (userProfileError && userProfileError.code !== "PGRST116") {
        console.error("Error fetching user profile:", userProfileError);
        throw userProfileError;
      }
      console.log("Current user profile:", userProfile);
      setCurrentUserProfile(userProfile);

      // 3. Fetch recipient's profile
      console.log("Fetching recipient profile:", recipientUserId);
      const { data: recipientData, error: recipientError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", recipientUserId)
        .single();
      if (recipientError) {
        console.error("Error fetching recipient profile:", recipientError);
        if (recipientError.code === "PGRST116")
          throw new Error("Destinatário não encontrado.");
        throw recipientError;
      }
      console.log("Recipient profile found:", recipientData);
      setRecipientProfile(recipientData);

      // 4. Find or create conversation
      console.log("Finding or creating conversation...");
      await getOrCreateConversation(
        user.id,
        recipientUserId,
        recipientData.name || "Destinatário"
      );
    } catch (error: any) {
      console.error("Erro ao inicializar chat:", error);
      setError(
        error.message ||
          "Não foi possível carregar o chat. Tente recarregar a página."
      );
      setLoading(false);
    }
  }, [recipientUserId, router]);

  const getOrCreateConversation = async (
    userId1: string,
    userId2: string,
    recipientName: string
  ) => {
    try {
      // Check if a conversation already exists
      const { data: existingConv, error: existingConvError } =
        await supabase.rpc("get_conversation_between_users", {
          user_id_1: userId1,
          user_id_2: userId2,
        });

      if (existingConvError) throw existingConvError;

      let convId: string;
      if (existingConv && existingConv.length > 0) {
        convId = existingConv[0].id;
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from("conversations")
          .insert({
            title: `Chat com ${recipientName}`,
            created_by: userId1, // Campo importante para RLS
          })
          .select("id")
          .single();

        if (createError || !newConversation)
          throw createError || new Error("Falha ao criar conversa.");

        convId = newConversation.id;

        // Add participants - agora com tratamento de erro mais detalhado
        const { error: partError } = await supabase
          .from("conversation_participants")
          .insert([
            { conversation_id: convId, user_id: userId1 },
            { conversation_id: convId, user_id: userId2 },
          ]);

        if (partError) {
          console.error("Erro ao adicionar participantes:", partError);
          // Tenta limpar a conversa criada se falhar ao adicionar participantes
          await supabase.from("conversations").delete().eq("id", convId);
          throw new Error(
            `Erro ao adicionar participantes: ${partError.message}`
          );
        }
      }

      setConversationId(convId);
      await loadMessages(convId);
    } catch (error: any) {
      console.error("Erro ao buscar/criar conversa:", error);
      setError(error.message || "Não foi possível iniciar a conversa.");
      setLoading(false);
    }
  };

  // Load messages for a given conversation ID
  const loadMessages = async (convId: string) => {
    try {
      // Buscar mensagens sem JOIN
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      // Array para armazenar mensagens com perfis
      const messagesWithProfiles: MessageWithSender[] = [];

      // Para cada mensagem, buscar o perfil do remetente
      for (const message of messagesData || []) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", message.user_id)
          .single();

        messagesWithProfiles.push({
          ...message,
          profiles: profileData || null,
        });
      }

      setMessages(messagesWithProfiles);
      scrollToBottom(true);
    } catch (error: any) {
      console.error("Erro ao carregar mensagens:", error);
      setError(error.message || "Não foi possível carregar as mensagens.");
    } finally {
      setLoading(false);
    }
  };

  // --- Real-time Subscription ---

  useEffect(() => {
    if (!conversationId) return;
    console.log(
      `Setting up real-time subscription for conversation: ${conversationId}`
    );

    console.log(`DEBUG: conversationId for filter: ${conversationId}`);

    const channel = supabase
      .channel(`public:messages:conversation_id=eq.${conversationId}`)
      .on<Message>( // Define the payload type based on your Message type
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log("New message received via subscription:", payload.new);
          // Fetch the sender's profile for the new message
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", payload.new.user_id)
            .single();

          if (profileError) {
            console.error(
              "Erro ao buscar perfil do remetente da nova mensagem:",
              profileError
            );
          }

          const newMessageWithSender: MessageWithSender = {
            ...(payload.new as Message),
            profiles: profileData,
          };

          // Add message only if it's not already present (optional safety check)
          setMessages((prevMessages) =>
            prevMessages.some((msg) => msg.id === newMessageWithSender.id)
              ? prevMessages
              : [...prevMessages, newMessageWithSender]
          );
          scrollToBottom(); // Smooth scroll for new messages
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("Conectado ao canal de mensagens!");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Erro no canal de mensagens:", status, err);
          setError("Erro na conexão em tempo real. Tente recarregar.");
        } else {
          console.log("Message channel status:", status);
        }
      });

    // Cleanup function
    return () => {
      console.log(
        `Removing real-time subscription for conversation: ${conversationId}`
      );
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // --- User Actions ---

  // Send new message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageContent = newMessage.trim();
    if (!messageContent || !conversationId || !currentUser) {
      console.warn(
        "Cannot send message: Missing content, conversationId, or currentUser."
      );
      return;
    }

    setSending(true);
    setError(null);
    console.log(`Sending message to conversation: ${conversationId}`);

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        user_id: currentUser.id,
        content: messageContent,
        type: "text", // Assuming only text messages for now
      });

      if (error) {
        console.error("Error sending message:", error);
        if (error?.message.includes("violates row-level security policy")) {
          console.error("RLS policy violation confirmed for messages insert.");
          setError(
            "Erro de permissão ao enviar mensagem. Verifique as políticas de segurança (RLS)."
          );
        } else {
          setError(error?.message || "Não foi possível enviar a mensagem.");
        }
        throw error;
      }
      console.log("Message sent successfully.");
      setNewMessage(""); // Clear input after successful send
    } catch (error: any) {
      // Error already logged and state set in the if(error) block
      // console.error("Erro ao enviar mensagem:", error);
      // setError(error.message || "Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  };

  // --- UI Effects ---

  // Scroll to bottom effect
  const scrollToBottom = (instant = false) => {
    // Use setTimeout to ensure DOM is updated before scrolling
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: instant ? "instant" : "smooth",
      });
    }, 50); // Reduced delay slightly
  };

  // Initial data load
  useEffect(() => {
    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientUserId]); // Depend only on recipientUserId to avoid re-running initializeChat unnecessarily

  // --- Render Logic ---

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Cabeçalho Fixo */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center">
          <button
            onClick={() => router.back()} // Go back to previous page (e.g., feed)
            className="mr-3 text-gray-600 hover:text-gray-800 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Voltar"
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
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
          </button>

          {recipientProfile ? (
            <div className="flex items-center flex-grow min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden mr-2 sm:mr-3 flex-shrink-0 bg-gray-200 border border-gray-300">
                <Image
                  src={recipientProfile.avatar_url || "/default-avatar.png"}
                  alt={recipientProfile.name || "Destinatário"}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.currentTarget.src = "/default-avatar.png";
                  }}
                  priority // Prioritize loading recipient avatar
                />
              </div>
              <div className="min-w-0">
                <h1 className="font-medium text-gray-900 truncate text-sm sm:text-base leading-tight">
                  {recipientProfile.name || "Destinatário"}
                </h1>
                <p className="text-xs text-gray-500 capitalize leading-tight">
                  {recipientProfile.type === "dentist"
                    ? "Dentista"
                    : recipientProfile.type === "technician"
                    ? "Protético"
                    : ""}
                </p>
              </div>
            </div>
          ) : (
            // Placeholder with shimmer effect while loading recipient
            <div className="flex items-center flex-grow min-w-0 animate-pulse">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3 flex-shrink-0 bg-gray-300"></div>
              <div className="min-w-0 space-y-1.5">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
                <div className="h-3 bg-gray-300 rounded w-20"></div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Corpo do Chat */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-0 sm:px-4 lg:px-8 pb-4 pt-4 flex flex-col overflow-hidden">
        {/* Error Display */}
        {error && (
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-2">
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm"
              role="alert"
            >
              <strong className="font-bold">Erro: </strong>
              <span className="block sm:inline">{error}</span>
              {/* Optional: Add a retry button if applicable */}
              {/* <button
                    onClick={initializeChat} // Retry initialization
                    className="ml-4 text-blue-600 hover:text-blue-800 font-medium text-sm underline"
                >
                    Tentar novamente
                </button> */}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          /* Chat Content Area */
          <div className="flex-1 flex flex-col bg-white sm:rounded-lg shadow overflow-hidden">
            {/* Área das Mensagens */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 scroll-smooth">
              {messages.length === 0 && !error ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 px-4 py-10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-10 h-10 sm:w-12 sm:h-12 mb-2 text-gray-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                    />
                  </svg>
                  <p className="text-sm sm:text-base mt-1">
                    Nenhuma mensagem ainda.
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Envie a primeira mensagem para iniciar a conversa!
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.user_id === currentUser?.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex items-end max-w-[85%] sm:max-w-[75%] ${
                        message.user_id === currentUser?.id
                          ? ""
                          : "flex-row-reverse"
                      }`}
                    >
                      {/* Avatar (only for recipient messages) */}
                      {message.user_id !== currentUser?.id && (
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden ml-2 flex-shrink-0 bg-gray-200 border border-gray-300 self-end mb-1">
                          {message.profiles?.avatar_url ? (
                            <Image
                              src={message.profiles.avatar_url}
                              alt={message.profiles.name || "Avatar"}
                              width={28}
                              height={28}
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                e.currentTarget.src = "/default-avatar.png";
                              }}
                            />
                          ) : (
                            <Image
                              src="/default-avatar.png"
                              alt="Avatar padrão"
                              width={28}
                              height={28}
                              className="object-cover w-full h-full"
                            />
                          )}
                        </div>
                      )}
                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-sm text-sm sm:text-base leading-relaxed break-words ${
                          message.user_id === currentUser?.id
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-gray-200 text-gray-800 rounded-bl-none"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {/* Element to scroll to */}
              <div ref={messagesEndRef} />
            </div>

            {/* Área de Input */}
            <div className="border-t border-gray-200 bg-gray-50 p-2 sm:p-3">
              <form
                onSubmit={sendMessage}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base disabled:bg-gray-100"
                  disabled={sending || loading || !!error} // Disable if sending, loading, or error exists
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending || loading || !!error}
                  className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  aria-label="Enviar mensagem"
                >
                  {sending ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 transform rotate-45"
                    >
                      <path d="M3.105 3.105a1.5 1.5 0 0 1 2.121 0L10 7.779l4.774-4.674a1.5 1.5 0 1 1 2.121 2.121L12.221 10l4.674 4.774a1.5 1.5 0 1 1-2.121 2.121L10 12.221l-4.774 4.674a1.5 1.5 0 1 1-2.121-2.121L7.779 10 3.105 5.226a1.5 1.5 0 0 1 0-2.121Z" />
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
