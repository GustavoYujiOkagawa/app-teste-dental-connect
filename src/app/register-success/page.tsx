'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterSuccess() {
  const router = useRouter();

  // Redirecionar para login após 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {/* Ícone de sucesso */}
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Registro Concluído com Sucesso!
        </h1>

        <p className="text-gray-600 mb-6">
          Sua conta foi criada com sucesso. Você será redirecionado para a página de login em alguns segundos.
        </p>

        <div className="flex flex-col space-y-4">
          <Link 
            href="/login" 
            className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Ir para Login
          </Link>
          
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800"
          >
            Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
