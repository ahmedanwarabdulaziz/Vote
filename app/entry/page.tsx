'use client';

import { useRouter } from 'next/navigation';

export default function EntryPage() {
  const router = useRouter();
  
  // Redirect to home page since entry page is hidden
  router.push('/');
  
  return null;
}
