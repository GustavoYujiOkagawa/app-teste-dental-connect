'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ConfirmIdentity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleBiometricAuth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Em um cenário real, aqui seria integrada a autenticação biométrica
      // Para esta demonstração, apenas simulamos o sucesso após um breve delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error: any) {
      setError('Falha na autenticação biométrica. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Cabeçalho */}
      <div className="p-4 text-center">
        <h1 className="text-xl font-medium">Tela login - 2</h1>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-gradient-to-b from-pink-200 to-pink-100 rounded-lg overflow-hidden">
          {/* Imagem de perfil */}
          <div className="flex justify-center pt-8 pb-4">
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white">
              <Image
                src="/profile-example.jpg"
                alt="Foto de perfil"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>

          {/* Texto de confirmação */}
          <div className="text-center px-6 pb-4">
            <h2 className="text-xl font-bold text-gray-800">Confirme que é você</h2>
            <p className="text-sm text-gray-600 mt-2">
              Verifique sua identidade digitalmente para continuar
            </p>
          </div>

          {/* Botão de impressão digital */}
          <div className="flex justify-center pb-8">
            <button
              onClick={handleBiometricAuth}
              disabled={loading}
              className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-teal-300 hover:bg-teal-600 transition-colors"
            >
              {loading ? (
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 0 1.242 4.136m6.758 1.364a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <div className="mx-6 mb-6 p-3 bg-red-100 text-red-700 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          {/* Texto de ajuda */}
          <div className="text-center px-6 pb-8">
            <p className="text-xs text-gray-500">
              Toque no sensor de impressão digital
            </p>
          </div>

          {/* Rodapé com link para empresa */}
          <div className="bg-white p-4 flex justify-center">
            <div className="bg-gray-200 rounded-md px-4 py-2 flex items-center space-x-2">
              <span className="text-xs text-gray-600">COMPANY</span>
              <span className="text-xs text-gray-400">|</span>
              <span className="text-xs text-gray-600">MODERN BANNER</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
