'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetAllVotes } from '@/lib/database';

export default function ResetVotesPage() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const handleReset = async () => {
    if (confirmText !== 'RESET') {
      setMessage('يرجى كتابة "RESET" للتأكيد');
      return;
    }

    setIsResetting(true);
    setMessage('جاري إعادة تعيين جميع الأصوات...');
    
    try {
      await resetAllVotes();
      setMessage('✓ تم إعادة تعيين جميع الأصوات بنجاح!');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error resetting votes:', error);
      setMessage('حدث خطأ أثناء إعادة تعيين الأصوات');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-orange-800 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4 text-center">إعادة تعيين الأصوات</h1>
        <p className="text-white/80 mb-6 text-center">
          سيتم إعادة تعيين جميع الأصوات إلى الصفر ومسح سجل التصويت
        </p>
        
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-center ${
            message.includes('✓') ? 'bg-green-500/30 text-green-200' : 
            message.includes('خطأ') ? 'bg-red-500/30 text-red-200' :
            'bg-blue-500/30 text-blue-200'
          }`}>
            {message}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-white mb-2">
            اكتب "RESET" للتأكيد:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white/50"
            placeholder="RESET"
            disabled={isResetting}
          />
        </div>
        
        <button
          onClick={handleReset}
          disabled={isResetting || confirmText !== 'RESET'}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors mb-3"
        >
          {isResetting ? 'جاري إعادة التعيين...' : 'إعادة تعيين جميع الأصوات'}
        </button>
        
        <button
          onClick={() => router.push('/')}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}

