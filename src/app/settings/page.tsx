"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"dentist" | "technician">("dentist");
  const [specialty, setSpecialty] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user and profile data
  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError; // Throw error only if it's not 'profile not found'
      }

      if (data) {
        setProfile(data);
        setName(data.name || "");
        setType(data.type || "dentist");
        setSpecialty(data.specialty || "");
        setClinicName(data.clinic_name || "");
        setAvatarPreview(data.avatar_url); // Set initial preview
      } else {
        // Handle case where profile doesn't exist yet (optional: pre-fill some fields?)
        console.log("Perfil ainda não criado para este usuário.");
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      setError(err.message || "Falha ao carregar dados do perfil.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Handle avatar file selection
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        setError("Arquivo muito grande. O limite é 2MB.");
        return;
      }
      if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
        setError("Formato de arquivo inválido. Use JPG, PNG ou GIF.");
        return;
      }
      setError(null);
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Handle form submission
  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let avatarUrl = profile?.avatar_url; // Keep existing URL by default

      // 1. Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("profiles-avatars") // Ensure this bucket exists and has correct policies
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError)
          throw new Error(`Erro no upload: ${uploadError.message}`);

        // Get public URL (add timestamp to prevent caching issues)
        const { data: urlData } = supabase.storage
          .from("profiles_avatars")
          .getPublicUrl(filePath);

        if (!urlData?.publicUrl)
          throw new Error("Não foi possível obter a URL pública do avatar.");
        avatarUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
      }

      // 2. Prepare profile data for update/insert
      const profileDataToSave = {
        user_id: user.id,
        name: name.trim(),
        type: type,
        specialty: specialty.trim() || null, // Store empty string as null
        clinic_name: clinicName.trim() || null, // Store empty string as null
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      // 3. Upsert profile data (update if exists, insert if not)
      const { data: savedProfile, error: saveError } = await supabase
        .from("profiles")
        .upsert(profileDataToSave, { onConflict: "user_id" })
        .select()
        .single();

      if (saveError) throw saveError;

      // 4. Update local state and show success
      setProfile(savedProfile);
      setAvatarFile(null); // Clear the file input state
      setAvatarPreview(savedProfile.avatar_url); // Update preview with saved URL
      setSuccess("Perfil atualizado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar perfil:", err);
      setError(err.message || "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">
            Configurações
          </h1>
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-gray-800 p-1"
            aria-label="Voltar para o Dashboard"
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
          </Link>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mensagens de Erro/Sucesso */}
        {error && (
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
        )}
        {success && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6"
            role="alert"
          >
            <strong className="font-bold">Sucesso: </strong>
            <span className="block sm:inline">{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              aria-label="Fechar sucesso"
            >
              <svg
                className="fill-current h-6 w-6 text-green-500"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <title>Fechar</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Navegação de configurações (Simplificada por enquanto) */}
          <div className="border-b border-gray-200">
            <div className="px-4 sm:px-6 py-3">
              <h2 className="text-base sm:text-lg font-medium text-gray-900">
                Editar Perfil
              </h2>
            </div>
            {/* <div className="flex border-b border-gray-200">
              <button className="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                Perfil
              </button>
              <button className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">
                Conta
              </button>
              {/* Add other tabs later */}
            {/* </div> */}
          </div>

          {/* Formulário de perfil */}
          <form onSubmit={handleSaveProfile} className="p-4 sm:p-6">
            <div className="space-y-5 sm:space-y-6">
              {/* Foto de perfil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto de Perfil
                </label>
                <div className="flex items-center space-x-4 sm:space-x-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center ring-1 ring-gray-300">
                    <Image
                      src={avatarPreview || "/default-avatar.png"} // Show preview or default
                      alt="Avatar"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      key={avatarPreview} // Force re-render when preview changes
                      onError={(e) => {
                        e.currentTarget.src = "/default-avatar.png";
                      }} // Fallback
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white py-1.5 px-3 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Alterar foto
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/png, image/jpeg, image/gif"
                      className="hidden"
                      aria-label="Selecionar foto de perfil"
                    />
                    <p className="text-xs text-gray-500">
                      JPG, PNG, GIF (Max 2MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nome completo
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  placeholder="Seu nome"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed text-sm sm:text-base"
                  aria-label="Email (não editável)"
                />
                {/* <p className="mt-1 text-xs text-gray-500">Para alterar seu email, acesse as configurações de conta.</p> */}
              </div>

              {/* Tipo de perfil */}
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tipo de perfil
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as "dentist" | "technician")
                  }
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                >
                  <option value="dentist">Dentista</option>
                  <option value="technician">Protético</option>
                </select>
              </div>

              {/* Especialidade */}
              <div>
                <label
                  htmlFor="specialty"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Especialidade{" "}
                  <span className="text-gray-500">(Opcional)</span>
                </label>
                <input
                  id="specialty"
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  placeholder="Ex: Ortodontia, Prótese"
                />
              </div>

              {/* Nome da clínica/laboratório */}
              <div>
                <label
                  htmlFor="clinic_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nome da {type === "technician" ? "Laboratório" : "Clínica"}{" "}
                  <span className="text-gray-500">(Opcional)</span>
                </label>
                <input
                  id="clinic_name"
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  placeholder={`Nome ${
                    type === "technician"
                      ? "do seu laboratório"
                      : "da sua clínica"
                  }`}
                />
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end space-x-3 pt-6 sm:pt-8 border-t border-gray-200 mt-6 sm:mt-8">
              <button
                type="button"
                onClick={() => router.back()} // Go back or reset form?
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Salvando...
                  </div>
                ) : (
                  "Salvar Alterações"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
