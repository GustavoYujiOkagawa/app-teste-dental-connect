'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import type { Message, Profile } from '@/lib/supabase';

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  const { id: recipientId } = params;
  const [messages, setMessages] = useState<(Message & { sender: Profile })[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; profile: Profile | null }>({ id: '', profile: null });
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Verificar autenticação e carregar dados do usuário
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const userId = session.user.id;
        setCurrentUser(prev => ({ ...prev, id: userId }));

        // Carregar perfil do usuário atual
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileError) throw profileError;
        setCurrentUser(prev => ({ ...prev, profile: profileData }));

        // Carregar perfil do destinatário
        const { data: recipientData, error: recipientError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', recipientId)
          .single();

        if (recipientError) throw recipientError;
        setRecipient(recipientData);

        // Buscar ou criar conversa
        await getOrCreateConversation(userId, recipientId);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError('Não foi possível carregar o chat. Tente novamente mais tarde.');
        setLoading(false);
      }
    };

    checkAuth();
  }, [recipientId, router]);

  // Buscar ou criar conversa
  const getOrCreateConversation = async (userId: string, recipientId: string) => {
    try {
      // Verificar se já existe uma conversa entre os usuários
      const { data: existingConversations, error: queryError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations:conversation_id(*)
        `)
        .eq('user_id', userId);

      if (queryError) throw queryError;

      // Filtrar conversas que incluem o destinatário
      let conversation = null;
      
      if (existingConversations && existingConversations.length > 0) {
        for (const conv of existingConversations) {
          const { data: participants, error: partError } = await supabase
            .from('conversation_participants')
            .select('*')
            .eq('conversation_id', conv.conversation_id)
            .eq('user_id', recipientId);
          
          if (partError) throw partError;
          
          if (participants && participants.length > 0) {
            conversation = conv.conversations;
            break;
          }
        }
      }

      // Se não existir conversa, criar uma nova
      if (!conversation) {
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            title: `Chat com ${recipient?.name || 'usuário'}`
          })
          .select()
          .single();

        if (createError) throw createError;
        
        // Adicionar participantes
        const participantsToAdd = [
          { conversation_id: newConversation.id, user_id: userId },
          { conversation_id: newConversation.id, user_id: recipientId }
        ];
        
        const { error: partError } = await supabase
          .from('conversation_participants')
          .insert(participantsToAdd);
          
        if (partError) throw partError;
        
        conversation = newConversation;
      }

      setConversationId(conversation.id);
      
      // Carregar mensagens
      await loadMessages(conversation.id);
      
      // Configurar subscription para novas mensagens
      setupMessageSubscription(conversation.id);
      
    } catch (error) {
      console.error('Erro ao buscar/criar conversa:', error);
      setError('Não foi possível carregar a conversa. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  // Carregar mensagens
  const loadMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(*)
        `)
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages(data || []);
      setLoading(false);
      
      // Rolar para a última mensagem
      scrollToBottom();
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setError('Não foi possível carregar as mensagens. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  // Configurar subscription para novas mensagens
  const setupMessageSubscription = (convId: string) => {
    const subscription = supabase
      .channel(`messages:${convId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${convId}`
      }, async (payload) => {
        // Buscar detalhes completos da mensagem com o perfil do remetente
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles(*)
          `)
          .eq('id', payload.new.id)
          .single();
          
        if (!error && data) {
          setMessages(prev => [...prev, data]);
          scrollToBottom();
        }
      })
      .subscribe();
      
    // Limpar subscription ao desmontar
    return () => {
      subscription.unsubscribe();
    };
  };

  // Enviar nova mensagem
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversationId || !currentUser.id) return;
    
    setSending(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          user_id: currentUser.id,
          content: newMessage.trim(),
          type: 'text',
          read: false
        });
        
      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setError('Não foi possível enviar a mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  // Rolar para a última mensagem
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <button 
            onClick={() => router.push('/feed')}
            className="mr-4 text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          
          {recipient && (
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                <Image
                  src={recipient.avatar_url || "/default-avatar.png"}
                  alt={recipient.name}
                  width={40}
                  height={40}
                />
              </div>
              <div>
                <h1 className="font-medium text-gray-900">{recipient.name}</h1>
                <p className="text-xs text-gray-500">
                  {recipient.type === 'dentist' ? 'Dentista' : 'Protético'}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-red-100 text-red-700 p-4 rounded-md max-w-md text-center">
              {error}
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-white rounded-lg shadow overflow-hidden">
            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                  <p>Nenhuma mensagem ainda. Comece a conversa!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.user_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex max-w-[80%]">
                      {message.user_id !== currentUser.id && (
                        <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                          <Image
                            src={message.sender?.avatar_url || "/default-avatar.png"}
                            alt={message.sender?.name || "Usuário"}
                            width={32}
                            height={32}
                          />
                        </div>
                      )}
                      <div>
                        <div 
                          className={`rounded-lg px-4 py-2 ${
                            message.user_id === currentUser.id 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {message.content}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Formulário de envio */}
            <form onSubmit={sendMessage} className="border-t border-gray-200 p-4 flex items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
