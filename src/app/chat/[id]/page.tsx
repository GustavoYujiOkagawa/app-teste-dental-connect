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
    try {
      // 1. Get current user session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        router.push("/login");
        return;
      }
      const user = session.user;
      setCurrentUser(user);

      // 2. Fetch current user's profile
      const { data: userProfile, error: userProfileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      // Allow profile to be null initially, handle creation/update elsewhere (e.g., settings)
      if (userProfileError && userProfileError.code !== "PGRST116")
        throw userProfileError;
      setCurrentUserProfile(userProfile);

      // 3. Fetch recipient's profile
      const { data: recipientData, error: recipientError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", recipientUserId)
        .single();
      if (recipientError) {
        if (recipientError.code === "PGRST116")
          throw new Error("Destinatário não encontrado.");
        throw recipientError;
      }
      setRecipientProfile(recipientData);

      // 4. Find or create conversation
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

  // Find or create a conversation between two users
  const getOrCreateConversation = async (
    userId1: string,
    userId2: string,
    recipientName: string
  ) => {
    try {
      // Check if a conversation already exists (more efficient query)
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
          .insert({ title: `Chat com ${recipientName}` })
          .select("id")
          .single();

        if (createError || !newConversation)
          throw createError || new Error("Falha ao criar conversa.");
        convId = newConversation.id;

        // Add participants
        const { error: partError } = await supabase
          .from("conversation_participants")
          .insert([
            { conversation_id: convId, user_id: userId1 },
            { conversation_id: convId, user_id: userId2 },
          ]);
        if (partError) {
          // Attempt to clean up if participant insert fails
          await supabase.from("conversations").delete().eq("id", convId);
          throw partError;
        }
      }

      setConversationId(convId);
      await loadMessages(convId); // Load initial messages
    } catch (error: any) {
      console.error("Erro ao buscar/criar conversa:", error);
      setError(error.message || "Não foi possível iniciar a conversa.");
      setLoading(false);
    }
  };

  // Load messages for a given conversation ID
  const loadMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`*, profiles:user_id(*)`)
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data as MessageWithSender[]) || []); // Cast to the correct type
      scrollToBottom(true); // Instant scroll on load
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
        }
      });

    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // --- User Actions ---

  // Send new message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageContent = newMessage.trim();
    if (!messageContent || !conversationId || !currentUser) return;

    setSending(true);
    setError(null);

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        user_id: currentUser.id,
        content: messageContent,
        type: "text", // Assuming only text messages for now
      });

      if (error) throw error;
      setNewMessage(""); // Clear input after successful send
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      setError(error.message || "Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  };

  // --- UI Effects ---

  // Scroll to bottom effect
  const scrollToBottom = (instant = false) => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: instant ? "instant" : "smooth",
      });
    }, 100); // Delay slightly to allow DOM update
  };

  // Initial data load
  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  // --- Render Logic ---

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Cabeçalho Fixo */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center">
          <button
            onClick={() => router.back()} // Go back to previous page (e.g., feed)
            className="mr-3 text-gray-600 hover:text-gray-800 p-1"
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
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden mr-2 sm:mr-3 flex-shrink-0 bg-gray-200">
                <Image
                  src={recipientProfile.avatar_url || "/default-avatar.png"}
                  alt={recipientProfile.name || "Destinatário"}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.currentTarget.src = "/default-avatar.png";
                  }}
                />
              </div>
              <div className="min-w-0">
                <h1 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                  {recipientProfile.name || "Destinatário"}
                </h1>
                <p className="text-xs text-gray-500 capitalize">
                  {recipientProfile.type === "dentist"
                    ? "Dentista"
                    : recipientProfile.type === "technician"
                    ? "Protético"
                    : ""}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-grow h-10"></div> // Placeholder while loading recipient
          )}
        </div>
      </header>

      {/* Corpo do Chat */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-0 sm:px-4 lg:px-8 pb-4 pt-4 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md text-center"
              role="alert"
            >
              <strong className="font-bold">Erro: </strong>
              <span className="block sm:inline">{error}</span>
              <button
                onClick={initializeChat} // Retry initialization
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-white sm:rounded-lg shadow overflow-hidden">
            {/* Área das Mensagens */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 px-4">
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
                  <p className="text-sm sm:text-base">
                    Nenhuma mensagem ainda.
                  </p>
                  <p className="text-xs sm:text-sm">
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
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden ml-2 flex-shrink-0 bg-gray-200">
                          {message.profiles?.avatar_url && (
                            <Image
                              src={message.profiles.avatar_url}
                              alt={message.profiles.name || "Avatar"}
                              width={32}
                              height={32}
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                e.currentTarget.src = "/default-avatar.png";
                              }}
                            />
                          )}
                          {!message.profiles?.avatar_url && (
                            <Image
                              src="/default-avatar.png"
                              alt="Avatar padrão"
                              width={32}
                              height={32}
                              className="object-cover w-full h-full"
                            />
                          )}
                        </div>
                      )}
                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-2 shadow-sm ${
                          message.user_id === currentUser?.id
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-gray-100 text-gray-800 rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm sm:text-base break-words">
                          {message.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            message.user_id === currentUser?.id
                              ? "text-blue-100"
                              : "text-gray-500"
                          } text-right`}
                        >
                          {new Date(message.created_at).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} /> {/* Element to scroll to */}
            </div>

            {/* Input de Mensagem Fixo */}
            <div className="border-t border-gray-200 p-2 sm:p-4 bg-gray-50">
              <form
                onSubmit={sendMessage}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-full focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  aria-label="Mensagem"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  aria-label="Enviar mensagem"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
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
                        d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                      />
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
