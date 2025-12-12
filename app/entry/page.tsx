'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EntryPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to home page since entry page is hidden
    router.push('/');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}
