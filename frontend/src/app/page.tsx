'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';

export default function Home() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/pos');
    } else {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    </Layout>
  );
}
