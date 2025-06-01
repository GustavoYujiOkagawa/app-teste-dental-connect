
'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface SplashScreenProps {
  onComplete: () => void; // Callback when splash is done
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Wait for animation duration (e.g., 2.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Check auth status
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // If logged in, redirect to dashboard (or intended page)
        router.replace('/dashboard');
      } else {
        // If not logged in, signal completion to show login/main page
        onComplete();
      }
    };

    checkAuthAndRedirect();
  }, [onComplete, router]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      >
        {/* Using globe.svg as placeholder logo */}
        <Image
          src="/globe.svg" // Replace with actual logo path if available
          alt="Dental Connect Logo"
          width={100} // Adjust size as needed
          height={100}
          priority // Load logo quickly
        />
        {/* Optional: Add App Name Text */}
        {/* <h1 className="text-2xl font-bold text-blue-700 mt-4">DentalConnect</h1> */}
      </motion.div>
    </div>
  );
};

export default SplashScreen;

