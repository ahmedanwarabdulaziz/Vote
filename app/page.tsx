'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VOTE_ENTRY_PASSWORD, RESULTS_VIEW_PASSWORD } from '@/lib/electionData';

export default function Home() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<'entry' | 'results' | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (selectedMode === 'entry') {
      // Password check for vote entry
      if (password === VOTE_ENTRY_PASSWORD) {
        router.push('/entry');
      } else {
        setError('كلمة المرور غير صحيحة');
      }
    } else if (selectedMode === 'results') {
      // Password check for results view
      if (password === RESULTS_VIEW_PASSWORD) {
        router.push('/results');
      } else {
        setError('كلمة المرور غير صحيحة');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          نظام انتخابات النادي
        </h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={() => {
              setSelectedMode('entry');
              setPassword('');
              setError('');
            }}
            className={`w-full py-4 px-6 rounded-lg text-lg font-semibold transition-all ${
              selectedMode === 'entry'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            إدخال الأصوات (الأجهزة اللوحية)
          </button>
          
          <button
            onClick={() => {
              setSelectedMode('results');
              setPassword('');
              setError('');
            }}
            className={`w-full py-4 px-6 rounded-lg text-lg font-semibold transition-all ${
              selectedMode === 'results'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            عرض النتائج
          </button>
        </div>

        {selectedMode && (
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="أدخل كلمة المرور"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              autoFocus
            />
            
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              دخول
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

