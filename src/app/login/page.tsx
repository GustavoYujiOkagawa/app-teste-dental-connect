"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // Keep if needed for other parts, but remove from login form area
import { supabase } from "@/lib/supabase";
import { Provider } from "@supabase/supabase-js"; // Import Provider type

// Import icons (assuming you'll add SVG components or use a library)
// Example placeholder icons
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);
const AppleIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 16 16">
    <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43Zm3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422.217-2.37-.025-4.147-.064-4.18-.04-.036-1.71-1.023-4.381 1.4-.28.2-.59.4-.943.4-.527 0-1.03-.288-1.485-.533-.456-.245-1.428-1.156-3.014-1.156-.824 0-1.612.456-2.08.881-.47.425-.885 1.052-.966 1.776-.078.724.166 1.483.484 2.096.318.613.676 1.178 1.075 1.68.403.506 1.037 1.218 1.879 1.218.582 0 1.414-.37 2.036-.498.623-.129 1.354-.196 2.056-.196.702 0 1.433.067 2.056.196.621.128 1.453.498 2.036.498.842 0 1.476-.712 1.879-1.218.4-.502.758-1.067 1.076-1.68.318-.613.563-1.372.484-2.096-.08-.724-.496-1.351-.966-1.776Z" />
    <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43Zm3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422.217-2.37-.025-4.147-.064-4.18-.04-.036-1.71-1.023-4.381 1.4-.28.2-.59.4-.943.4-.527 0-1.03-.288-1.485-.533-.456-.245-1.428-1.156-3.014-1.156-.824 0-1.612.456-2.08.881-.47.425-.885 1.052-.966 1.776-.078.724.166 1.483.484 2.096.318.613.676 1.178 1.075 1.68.403.506 1.037 1.218 1.879 1.218.582 0 1.414-.37 2.036-.498.623-.129 1.354-.196 2.056-.196.702 0 1.433.067 2.056.196.621.128 1.453.498 2.036.498.842 0 1.476-.712 1.879-1.218.4-.502.758-1.067 1.076-1.68.318-.613.563-1.372.484-2.096-.08-.724-.496-1.351-.966-1.776Z" />
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<Provider | null>(null); // Track which social login is loading
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Redirect to the dashboard after successful login
      // Supabase handles session management, redirect might happen automatically
      // depending on setup, but explicit push ensures navigation.
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Erro ao fazer login com email:", error);
      setError(
        error.message || "Falha ao fazer login. Verifique suas credenciais."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: Provider) => {
    setSocialLoading(provider);
    setError(null);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          // You might need to specify redirectTo based on your environment
          // redirectTo: `${window.location.origin}/auth/callback` // Example
        },
      });

      if (oauthError) throw oauthError;

      // Redirect happens automatically via Supabase
      // No need to router.push here usually
    } catch (error: any) {
      console.error(`Erro ao fazer login com ${provider}:`, error);
      setError(error.message || `Falha ao fazer login com ${provider}.`);
      setSocialLoading(null);
    }
    // Don't setSocialLoading(null) here, as redirect should occur
  };

  return (
    <div className="min-h-screen bg-white from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl p-6 sm:p-8">
        {/* Logo Removed as requested */}
        {/* <div className="mb-6 flex justify-center">
          <Image src="/logo-dental.svg" alt="DentalConnect Logo" width={64} height={64} priority />
        </div> */}

        <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-6">
          Acesse sua conta
        </h1>

        {/* Email/Password Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-800"
            >
              Esqueceu sua senha?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Entrando...
              </div>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">ou</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            disabled={!!socialLoading}
            className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {socialLoading === "google" ? (
              <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <GoogleIcon />
            )}
            Continuar com Google
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin("apple")}
            disabled={!!socialLoading}
            className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-black text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {socialLoading === "apple" ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <AppleIcon />
            )}
            Continuar com Apple
          </button>
        </div>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600">Não tem uma conta? </span>
          <Link
            href="/register"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
