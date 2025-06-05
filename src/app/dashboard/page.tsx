"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { Profile, DentalAnalysis } from "@/lib/supabase";
import {
  TrashIcon,
  DocumentChartBarIcon,
  PlusCircleIcon,
  ChatBubbleLeftRightIcon,
  CameraIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// Componente MobileSidebar (sem alterações)
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
    } else {
      router.push("/login");
    }
    onClose();
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
        onClick={(e) => e.stopPropagation()}
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

// Componente para o gráfico de barras simples
function MonthlyAnalysisChart({ analyses }: { analyses: DentalAnalysis[] }) {
  // Agrupar análises por mês
  const monthlyData = useMemo(() => {
    const last6Months: { [key: string]: number } = {};

    // Inicializar os últimos 6 meses com zero
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      last6Months[monthKey] = 0;
    }

    // Contar análises por mês
    analyses.forEach((analysis) => {
      const date = new Date(analysis.created_at);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      // Só contar se estiver nos últimos 6 meses
      if (last6Months[monthKey] !== undefined) {
        last6Months[monthKey]++;
      }
    });

    // Converter para array para renderização
    return Object.entries(last6Months).map(([key, count]) => {
      const [year, month] = key.split("-");
      const monthNames = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];
      return {
        month: monthNames[parseInt(month) - 1],
        count,
      };
    });
  }, [analyses]);

  // Encontrar o valor máximo para escala
  const maxValue = Math.max(...monthlyData.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Análises por Mês
      </h3>
      <div className="flex items-end h-40 gap-2">
        {monthlyData.map((data, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-gray-100 rounded-t-sm relative"
              style={{
                height: `${(data.count / maxValue) * 100}%`,
                minHeight: "4px",
              }}
            >
              <div className="absolute inset-0 bg-blue-500 opacity-80 rounded-t-sm"></div>
              <div className="absolute top-0 left-0 right-0 -mt-6 text-center text-xs font-medium text-gray-700">
                {data.count > 0 && data.count}
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">{data.month}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente para os atalhos rápidos
function QuickActions({ router }: { router: any }) {
  const actions = [
    {
      title: "Nova Análise",
      icon: <CameraIcon className="w-6 h-6" />,
      color: "bg-blue-500 hover:bg-blue-600",
      path: "/analyze",
    },
    {
      title: "Ver Feed",
      icon: <DocumentChartBarIcon className="w-6 h-6" />,
      color: "bg-green-500 hover:bg-green-600",
      path: "/feed",
    },
    {
      title: "Chat",
      icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
      color: "bg-purple-500 hover:bg-purple-600",
      path: "/chat",
    },
    {
      title: "Perfil",
      icon: <ChartBarIcon className="w-6 h-6" />,
      color: "bg-amber-500 hover:bg-amber-600",
      path: "/settings",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Ações Rápidas
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => router.push(action.path)}
            className={`${action.color} text-white rounded-lg p-3 flex flex-col items-center justify-center transition-transform hover:scale-105`}
          >
            {action.icon}
            <span className="mt-2 text-sm font-medium">{action.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Componente para estatísticas resumidas
function StatsSummary({ analyses }: { analyses: DentalAnalysis[] }) {
  // Calcular estatísticas
  const stats = useMemo(() => {
    // Análises este mês
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const analysesThisMonth = analyses.filter(
      (a) => new Date(a.created_at) >= firstDayOfMonth
    ).length;

    // Cores de dente mais comuns
    const toothColors: { [key: string]: number } = {};
    analyses.forEach((a) => {
      if (a.tooth_color_code) {
        toothColors[a.tooth_color_code] =
          (toothColors[a.tooth_color_code] || 0) + 1;
      }
    });

    // Ordenar e pegar o mais comum
    const mostCommonToothColor =
      Object.entries(toothColors)
        .sort((a, b) => b[1] - a[1])
        .map(([color]) => color)[0] || "N/A";

    return {
      total: analyses.length,
      thisMonth: analysesThisMonth,
      mostCommonToothColor,
    };
  }, [analyses]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-500">Total de Análises</h3>
        <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-500">Análises este Mês</h3>
        <p className="text-2xl font-bold text-gray-800 mt-1">
          {stats.thisMonth}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-500">
          Cor de Dente Mais Comum
        </h3>
        <p className="text-2xl font-bold text-gray-800 mt-1">
          {stats.mostCommonToothColor}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [analyses, setAnalyses] = useState<DentalAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true); // Inicia loading
      setError(null);
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error("Erro de sessão ou sessão inexistente:", sessionError);
          router.push("/login");
          return;
        }
        const userId = session.user.id;

        // Buscar perfil
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();
        if (profileError && profileError.code !== "PGRST116") {
          // Ignora erro se perfil não existe
          throw profileError;
        }
        setProfile(profileData);

        // Buscar análises
        const { data: analysesData, error: analysesError } = await supabase
          .from("dental_analyses")
          .select("*") // Seleciona todas as colunas
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (analysesError) {
          throw analysesError;
        }
        setAnalyses(analysesData || []); // Garante que seja um array
      } catch (error: any) {
        console.error("Erro ao carregar dados do dashboard:", error);
        if (error.code !== "PGRST116") {
          // Não mostra erro se for apenas perfil não encontrado
          setError(
            "Não foi possível carregar seus dados. Tente recarregar a página."
          );
        }
      } finally {
        setLoading(false); // Finaliza loading
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

  const handleDeleteAnalysis = async (analysisId: string) => {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir esta análise? Esta ação não pode ser desfeita."
    );
    if (!confirmDelete) return;

    setError(null); // Limpa erros anteriores
    setDeleteLoading(analysisId); // Indica qual análise está sendo excluída

    try {
      const { error: deleteError } = await supabase
        .from("dental_analyses")
        .delete()
        .match({ id: analysisId });

      if (deleteError) throw deleteError;

      setAnalyses((currentAnalyses) =>
        currentAnalyses.filter((analysis) => analysis.id !== analysisId)
      );
      // Opcional: Mostrar notificação de sucesso
    } catch (error: any) {
      console.error("Erro ao excluir análise:", error);
      setError("Não foi possível excluir a análise. Tente novamente.");
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-0">
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">DentalConnect</h1>
          <div className="flex items-center space-x-4">
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
            {profile && (
              <button
                onClick={() => router.push("/settings")}
                className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title="Configurações"
              >
                <Image
                  src={profile.avatar_url || "/default-avatar.png"}
                  alt="Perfil"
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </button>
            )}
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
        {/* Menu Lateral Desktop (sem alterações) */}
        <aside className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-lg shadow-lg p-2 hidden md:flex flex-col space-y-2 z-10">
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
          <button
            onClick={handleLogout}
            className="p-2 mt-auto hover:bg-red-50 rounded-md"
            title="Sair"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-red-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
              />
            </svg>
          </button>
        </aside>

        {/* Área principal do Dashboard */}
        <main className="flex-1 max-w-4xl mx-auto px-4 py-8 md:pl-20">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
              <strong className="font-bold">Erro: </strong>
              <span className="block sm:inline">{error}</span>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              {/* Saudação e Contagem de Análises */}
              {profile && (
                <div className="mb-6 p-4 bg-white rounded-lg shadow">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Olá, {profile.name}!
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Você tem{" "}
                    <span className="font-bold text-blue-600">
                      {analyses.length}
                    </span>{" "}
                    análise{analyses.length !== 1 ? "s" : ""} registrada
                    {analyses.length !== 1 ? "s" : ""}.
                  </p>
                </div>
              )}

              {/* Atalhos Rápidos */}
              <QuickActions router={router} />

              {/* Estatísticas Resumidas */}
              <StatsSummary analyses={analyses} />

              {/* Gráfico de Análises por Mês */}
              <div className="mb-6">
                <MonthlyAnalysisChart analyses={analyses} />
              </div>

              {/* Histórico de Análises */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Histórico de Análises
                  </h2>
                </div>

                {analyses.length === 0 ? (
                  <div className="p-6 text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-12 h-12 mx-auto text-gray-400 mb-3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                      />
                    </svg>
                    <p className="text-gray-600 mb-2">
                      Nenhuma análise encontrada
                    </p>
                    <button
                      onClick={() => router.push("/analyze")}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
                    >
                      <PlusCircleIcon className="w-5 h-5 mr-2" />
                      Nova Análise
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {analyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                              {analysis.image_url ? (
                                <Image
                                  src={analysis.image_url}
                                  alt="Imagem da análise"
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-8 h-8"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                Análise de{" "}
                                {new Date(
                                  analysis.created_at
                                ).toLocaleDateString("pt-BR")}
                              </p>
                              <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                                <p>
                                  <span className="font-semibold text-gray-700">
                                    Cor Dente:
                                  </span>{" "}
                                  {analysis.tooth_color_code || "N/I"}
                                </p>
                                <p>
                                  <span className="font-semibold text-gray-700">
                                    Cor Gengiva:
                                  </span>{" "}
                                  {analysis.gum_color_code || "N/I"}
                                </p>
                                {analysis.notes && (
                                  <p className="col-span-2 mt-1">
                                    <span className="font-semibold text-gray-700">
                                      Notas:
                                    </span>{" "}
                                    {analysis.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                router.push(`/analyze/${analysis.id}`)
                              }
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Ver detalhes"
                            >
                              <DocumentChartBarIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAnalysis(analysis.id)}
                              disabled={deleteLoading === analysis.id}
                              className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                              title="Excluir análise"
                            >
                              {deleteLoading === analysis.id ? (
                                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <TrashIcon className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Menu Mobile */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        router={router}
      />

      {/* Barra de Navegação Inferior Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 md:hidden z-20">
        <button
          onClick={() => router.push("/dashboard")}
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
