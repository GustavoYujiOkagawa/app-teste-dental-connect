"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  BellIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

// Define Notification type based on schema
interface Notification {
  id: string;
  user_id: string;
  type: "new_post" | "new_message" | "post_like" | "post_comment";
  content: string;
  related_entity_id?: string | null;
  related_entity_type?: string | null;
  sender_id?: string | null;
  is_read: boolean;
  created_at: string;
  // Optional: Add sender profile info if fetched
  sender_profile?: { name: string; avatar_url: string } | null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [clearing, setClearing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          router.push("/login");
          return;
        }
        setCurrentUser(session.user);

        // Fetch notifications for the current user
        // Optional: Fetch sender profile info as well
        const { data, error: fetchError } = await supabase
          .from("notifications")
          .select(
            "*" /* Add sender profile if needed: ", sender_profile:profiles!sender_id(name, avatar_url)" */
          )
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        setNotifications((data as Notification[]) || []);
      } catch (err: any) {
        console.error("Erro ao buscar notificações:", err);
        setError("Não foi possível carregar as notificações. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndNotifications();
  }, [router]);

  const handleClearAll = async () => {
    if (!currentUser) return;
    const confirmClear = window.confirm(
      "Tem certeza que deseja limpar TODAS as suas notificações?"
    );
    if (!confirmClear) return;

    setClearing(true);
    setError(null);
    try {
      // Call the Supabase function to clear all notifications for the user
      const { error: clearError } = await supabase.rpc(
        "clear_all_notifications"
      );
      if (clearError) throw clearError;

      setNotifications([]); // Clear local state
      alert("Notificações limpas com sucesso!");
    } catch (err: any) {
      console.error("Erro ao limpar notificações:", err);
      setError("Não foi possível limpar as notificações. Tente novamente.");
    } finally {
      setClearing(false);
    }
  };

  // Optional: Function to mark a single notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .match({ id: notificationId, user_id: currentUser?.id });

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Erro ao marcar notificação como lida:", err);
      // Optionally show an error to the user
    }
  };

  // Optional: Function to delete a single notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .match({ id: notificationId, user_id: currentUser?.id });

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error("Erro ao deletar notificação:", err);
      // Optionally show an error to the user
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Simple Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 text-gray-600 hover:text-gray-800"
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
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Notificações</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando notificações...</p>
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
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Suas Notificações
              </h2>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={clearing}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded shadow-sm text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {clearing ? (
                    <svg
                      className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-red-700"
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
                    <TrashIcon
                      className="-ml-0.5 mr-2 h-4 w-4"
                      aria-hidden="true"
                    />
                  )}
                  Limpar Tudo
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <BellIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                Você não tem nenhuma notificação no momento.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`p-4 flex items-start justify-between gap-3 ${
                      notification.is_read
                        ? "bg-gray-50"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-grow">
                      {/* Icon based on type - enhance later if needed */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          notification.is_read ? "bg-gray-300" : "bg-blue-100"
                        }`}
                      >
                        <BellIcon
                          className={`w-5 h-5 ${
                            notification.is_read
                              ? "text-gray-500"
                              : "text-blue-600"
                          }`}
                        />
                      </div>
                      <div className="flex-grow">
                        <p
                          className={`text-sm ${
                            notification.is_read
                              ? "text-gray-600"
                              : "text-gray-800 font-medium"
                          }`}
                        >
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleString(
                            "pt-BR",
                            {
                              dateStyle: "short",
                              timeStyle: "short",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex-shrink-0 flex flex-col sm:flex-row gap-1 items-end">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-100"
                          title="Marcar como lida"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleDeleteNotification(notification.id)
                        }
                        className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100"
                        title="Excluir notificação"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
