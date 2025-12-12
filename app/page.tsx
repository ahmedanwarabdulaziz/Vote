'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          نظام انتخابات النادي
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={() => router.push('/results')}
            className="w-full py-4 px-6 rounded-lg text-lg font-semibold transition-all bg-green-600 text-white hover:bg-green-700 shadow-lg"
          >
            عرض النتائج
          </button>
          
          <button
            onClick={() => router.push('/topvote')}
            className="w-full py-4 px-6 rounded-lg text-lg font-semibold transition-all bg-purple-600 text-white hover:bg-purple-700 shadow-lg"
          >
            التصويت للمناصب العليا (الرئيس - النائب - أمين الصندوق)
          </button>
          
          <button
            onClick={() => router.push('/other')}
            className="w-full py-4 px-6 rounded-lg text-lg font-semibold transition-all bg-orange-600 text-white hover:bg-orange-700 shadow-lg"
          >
            التصويت للأعضاء (أعضاء مجلس الإدارة - تحت السن)
          </button>
        </div>
      </div>
    </div>
  );
}

