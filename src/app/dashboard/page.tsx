"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { Profile, DentalAnalysis } from "@/lib/supabase"; // Assumindo que estes tipos existem

// Componente para o Sidebar Mobile
function MobileSidebar({
  isOpen,
  onClose,
  router,
}: {
  isOpen: boolean;
  onClose: () => void;
  router: any;
}) {
  if (!isOpen) return null;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erro ao fazer logout:", error);
      // Adicionar feedback ao usuário se necessário
    } else {
      router.push("/login"); // Redirecionar para login após logout
    }
    onClose(); // Fechar o menu
  };

  const menuItems = [
    {
      path: "/settings",
      title: "Configurações",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 text-gray-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      ),
    },
    {
      path: "/notifications",
      title: "Notificações",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 text-gray-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
      ),
    },
    {
      path: "/cases",
      title: "Casos",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 text-gray-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776"
          />
        </svg>
      ),
    },
    {
      path: "/help",
      title: "Ajuda",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 text-gray-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
          />
        </svg>
      ),
    },
    {
      path: "/about",
      title: "Sobre",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 text-gray-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      onClick={onClose}
    >
      <div
        className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50 p-4 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col"
        onClick={(e) => e.stopPropagation()} // Impede que o clique dentro do sidebar o feche
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-700">Menu</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
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
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <nav className="flex-grow flex flex-col space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                router.push(item.path);
                onClose();
              }}
              className="flex items-center p-2 hover:bg-gray-100 rounded-md text-gray-700"
            >
              {item.icon}
              <span className="ml-3">{item.title}</span>
            </button>
          ))}
        </nav>
        {/* Botão de Logout no final do menu */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-2 hover:bg-red-50 rounded-md text-red-600"
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
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
              />
            </svg>
            <span className="ml-3">Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [analyses, setAnalyses] = useState<DentalAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Estado para o menu mobile
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }
        const userId = session.user.id;
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();
        // Não lançar erro se perfil não existir, apenas definir como null
        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }
        setProfile(profileData);

        const { data: analysesData, error: analysesError } = await supabase
          .from("dental_analyses")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (analysesError) throw analysesError;
        setAnalyses(analysesData || []);
      } catch (error: any) {
        console.error("Erro ao carregar dados do usuário:", error);
        // Verificar se o erro é de perfil não encontrado e não mostrar ao usuário
        if (error.code !== "PGRST116") {
          setError(
            "Não foi possível carregar seus dados. Tente novamente mais tarde."
          );
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erro ao fazer logout:", error);
      setError("Erro ao sair. Tente novamente.");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-0">
      {" "}
      {/* Adiciona padding-bottom em mobile */}
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">DentalConnect</h1>
          <div className="flex items-center space-x-4">
            {/* Botão Feed (visível em todos os tamanhos) */}
            <button
              onClick={() => router.push("/feed")}
              className="text-blue-600 hover:text-blue-800"
              title="Feed"
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
            </button>
            {/* Avatar (visível em todos os tamanhos) */}
            {profile && (
              <button
                onClick={() => router.push("/settings")}
                className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title="Configurações"
              >
                <Image
                  src={profile.avatar_url || "/default-avatar.png"} // Usar uma imagem padrão
                  alt="Perfil"
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </button>
            )}
            {/* Botão Menu Hamburguer (apenas mobile) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-gray-600 hover:text-gray-800"
              title="Menu"
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
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>
      {/* Conteúdo principal */}
      <div className="flex">
        {/* Menu de navegação lateral (Desktop) */}
        <aside className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-lg shadow-lg p-2 hidden md:flex flex-col space-y-2 z-10">
          {/* Ícones do menu lateral desktop */}
          <button
            onClick={() => router.push("/settings")}
            className="p-2 hover:bg-gray-100 rounded-md"
            title="Configurações"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-gray-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </button>
          <button
            onClick={() => router.push("/notifications")}
            className="p-2 hover:bg-gray-100 rounded-md"
            title="Notificações"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-gray-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
          </button>
          <button
            onClick={() => router.push("/cases")}
            className="p-2 hover:bg-gray-100 rounded-md"
            title="Casos"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-gray-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776"
              />
            </svg>
          </button>
          <button
            onClick={() => router.push("/help")}
            className="p-2 hover:bg-gray-100 rounded-md"
            title="Ajuda"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-gray-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
              />
            </svg>
          </button>
          <button
            onClick={() => router.push("/about")}
            className="p-2 hover:bg-gray-100 rounded-md"
            title="Sobre"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-gray-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
              />
            </svg>
          </button>
          {/* Botão Logout Desktop */}
          <div className="mt-auto pt-2 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-2 hover:bg-red-50 rounded-md text-red-600"
              title="Sair"
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
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                />
              </svg>
            </button>
          </div>
        </aside>

        {/* Conteúdo Principal da Página */}
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:ml-20">
          {" "}
          {/* Adiciona margin-left em desktop */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
              role="alert"
            >
              <strong className="font-bold">Erro: </strong>
              <span className="block sm:inline">{error}</span>
              <button
                onClick={() => setError(null)}
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                aria-label="Fechar erro"
              >
                <svg
                  className="fill-current h-6 w-6 text-red-500"
                  role="button"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <title>Fechar</title>
                  <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              {/* Perfil do usuário */}
              <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden mr-4 flex-shrink-0 bg-gray-200">
                      {profile?.avatar_url && (
                        <Image
                          src={profile.avatar_url}
                          alt={profile.name || "Usuário"}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.currentTarget.src = "/default-avatar.png";
                          }} // Fallback
                        />
                      )}
                      {!profile?.avatar_url && (
                        <Image
                          src="/default-avatar.png"
                          alt="Avatar padrão"
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                        {profile?.name || "Usuário"}
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600 truncate">
                        {profile?.type === "dentist"
                          ? "Dentista"
                          : profile?.type === "technician"
                          ? "Protético"
                          : "Tipo não definido"}
                        {profile?.specialty && ` • ${profile.specialty}`}
                      </p>
                      {profile?.clinic_name && (
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {profile.clinic_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg md:text-2xl font-bold text-gray-900">
                        {analyses.length}
                      </p>
                      <p className="text-xs md:text-sm text-gray-600">
                        Análises
                      </p>
                    </div>
                    <div>
                      <p className="text-lg md:text-2xl font-bold text-gray-900">
                        0
                      </p>
                      <p className="text-xs md:text-sm text-gray-600">
                        Conexões
                      </p>
                    </div>
                    <div>
                      <p className="text-lg md:text-2xl font-bold text-gray-900">
                        0
                      </p>
                      <p className="text-xs md:text-sm text-gray-600">
                        Mensagens
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => router.push("/settings")} // Redireciona para settings que deve conter a edição
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Editar Perfil
                    </button>
                  </div>
                </div>
              </div>

              {/* Histórico de análises */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      Histórico
                    </h3>
                    <button
                      onClick={() => router.push("/analyze")}
                      className="bg-blue-600 text-white py-1.5 px-3 rounded-md hover:bg-blue-700 flex items-center text-sm font-medium transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 mr-1"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                      Nova Análise
                    </button>
                  </div>

                  {analyses.length === 0 ? (
                    <div className="text-center py-8">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-12 h-12 mx-auto text-gray-400"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21a48.25 48.25 0 0 1-8.135-.687c-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                        />
                      </svg>
                      <h4 className="mt-2 text-gray-600">
                        Nenhuma análise encontrada
                      </h4>
                      <p className="text-gray-500 text-sm mt-1">
                        Comece uma nova análise para ver seu histórico aqui.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {analyses.map((analysis) => (
                        <div
                          key={analysis.id}
                          className="border border-gray-200 rounded-lg overflow-hidden flex flex-col"
                        >
                          <div className="aspect-square relative bg-gray-200 w-full">
                            <Image
                              src={analysis.image_url}
                              alt="Análise dental"
                              fill
                              sizes="(max-width: 640px) 100vw, 50vw"
                              className="object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder-image.png";
                              }} // Placeholder
                            />
                          </div>
                          <div className="p-3 sm:p-4 flex-grow flex flex-col justify-between">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-500 mb-2">
                                {new Date(
                                  analysis.created_at
                                ).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-2">
                                <div>
                                  <span className="text-gray-500">Dente:</span>
                                  <div className="flex items-center mt-0.5">
                                    <div
                                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-1 border border-gray-300"
                                      style={{
                                        backgroundColor:
                                          analysis.tooth_color_hex,
                                      }}
                                    ></div>
                                    <span className="font-medium">
                                      {analysis.tooth_color_code}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Gengiva:
                                  </span>
                                  <div className="flex items-center mt-0.5">
                                    <div
                                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-1 border border-gray-300"
                                      style={{
                                        backgroundColor: analysis.gum_color_hex,
                                      }}
                                    ></div>
                                    <span className="font-medium">
                                      {analysis.gum_color_code}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {analysis.notes && (
                                <p className="mt-1 text-xs sm:text-sm text-gray-700 line-clamp-2">
                                  {analysis.notes}
                                </p>
                              )}
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button
                                // onClick={() => router.push(`/analysis/${analysis.id}`)} // Link para detalhes da análise (a implementar)
                                className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium"
                              >
                                Ver detalhes
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      {/* Navegação inferior (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-1 md:hidden z-10">
        <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 flex justify-around">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex flex-col items-center text-blue-600 p-1 w-1/4"
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
                d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
            <span className="text-xs mt-0.5">Início</span>
          </button>
          <button
            onClick={() => router.push("/feed")}
            className="flex flex-col items-center text-gray-500 p-1 w-1/4"
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
            <span className="text-xs mt-0.5">Feed</span>
          </button>
          <button
            onClick={() => router.push("/analyze")}
            className="flex flex-col items-center text-gray-500 p-1 w-1/4"
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
            <span className="text-xs mt-0.5">Analisar</span>
          </button>
          <button
            onClick={() => router.push("/chat")}
            className="flex flex-col items-center text-gray-500 p-1 w-1/4"
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
            <span className="text-xs mt-0.5">Chat</span>
          </button>
        </div>
      </nav>
      {/* Renderiza o Sidebar Mobile */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        router={router}
      />
    </div>
  );
}
