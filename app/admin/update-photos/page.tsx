'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateCandidatePhotos } from '@/lib/database';

export default function UpdatePhotosPage() {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async () => {
    setIsUpdating(true);
    setMessage('جاري تحديث الصور...');
    try {
      await updateCandidatePhotos();
      setMessage('✓ تم تحديث الصور بنجاح!');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error updating photos:', error);
      setMessage('حدث خطأ أثناء تحديث الصور');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4 text-center">تحديث صور المرشحين</h1>
        <p className="text-white/80 mb-6 text-center">سيتم تحديث صور المرشحين من ملف التكوين</p>
        
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-center ${
            message.includes('✓') ? 'bg-green-500/30 text-green-200' : 
            message.includes('خطأ') ? 'bg-red-500/30 text-red-200' :
            'bg-blue-500/30 text-blue-200'
          }`}>
            {message}
          </div>
        )}
        
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          {isUpdating ? 'جاري التحديث...' : 'تحديث الصور'}
        </button>
        
        <button
          onClick={() => router.push('/')}
          className="w-full mt-3 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}




