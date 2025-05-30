'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Verificar se o usuário já está autenticado
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Após um breve delay para mostrar a splash screen
      setTimeout(() => {
        if (session) {
          router.push('/feed');
        } else {
          router.push('/login');
        }
      }, 2000);
    };
    
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-24 h-24 relative">
        <Image
          src="/logo-dental.svg"
          alt="DentalConnect Logo"
          fill
          priority
          className="animate-pulse"
        />
      </div>
    </div>
  );
}
