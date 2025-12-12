'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ELECTION_CONFIG, TOP_VOTE_PASSWORD } from '@/lib/electionData';
import { subscribeToElection, addVote, subtractVote, initializeElection, getElectionData } from '@/lib/database';
import { monitorConnectionStatus } from '@/lib/firebase';
import { ElectionGroup } from '@/lib/types';
import CandidateCard from '@/components/CandidateCard';

export default function TopVotePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<ElectionGroup[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);

  // Filter only top positions: head (President), head-assistant (Vice), finance
  // Order: President first, then Vice, then Finance
  const topPositions = ['head', 'head-assistant', 'finance'];
  const filteredGroups = topPositions
    .map(positionId => groups.find(group => group.id === positionId))
    .filter((group): group is ElectionGroup => group !== undefined);

  // Monitor connection status immediately (even before authentication)
  useEffect(() => {
    const unsubscribeConnection = monitorConnectionStatus((online, dbConnected) => {
      setIsOnline(online);
      setIsDatabaseConnected(dbConnected);
    });

    return () => {
      unsubscribeConnection();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Subscribe to election data
    const unsubscribeElection = subscribeToElection((updatedGroups) => {
      setGroups(updatedGroups);
    });

    // Check and initialize election if needed
    const checkAndInitialize = async () => {
      try {
        const currentGroups = await getElectionData();
        if (currentGroups.length === 0) {
          // Initialize with only top positions in correct order: President, Vice, Finance
          const topGroups = topPositions
            .map(positionId => ELECTION_CONFIG.find(group => group.id === positionId))
            .filter((group): group is ElectionGroup => group !== undefined);
          await initializeElection(topGroups);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing election:', error);
      }
    };
    checkAndInitialize();

    return () => {
      unsubscribeElection();
    };
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (password === TOP_VOTE_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('كلمة المرور غير صحيحة');
    }
  };

  const handleAddVote = async (groupId: string, candidateId: string) => {
    try {
      await addVote(groupId, candidateId);
    } catch (error) {
      console.error('Error adding vote:', error);
    }
  };

  const handleSubtractVote = async (groupId: string, candidateId: string) => {
    try {
      await subtractVote(groupId, candidateId);
    } catch (error) {
      console.error('Error subtracting vote:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-center flex-1 text-gray-800">
              التصويت للمناصب العليا
            </h1>
            {/* Connection Status */}
            <div className="flex items-center gap-2 ml-4">
              <div className={`w-3 h-3 rounded-full transition-colors ${
                isOnline && isDatabaseConnected 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-red-500'
              }`}></div>
            </div>
          </div>
          <p className="text-center text-gray-600 mb-6">
            الرئيس - النائب - أمين الصندوق
          </p>
          
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
            
            <button
              onClick={() => router.push('/')}
              className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">التصويت للمناصب العليا</h1>
            <p className="text-gray-600 text-sm">الرئيس - النائب - أمين الصندوق</p>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full transition-colors ${
              isOnline && isDatabaseConnected 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium text-gray-700">
              {isOnline && isDatabaseConnected ? 'متصل' : 'غير متصل'}
            </span>
          </div>
          
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            العودة
          </button>
        </div>

        {/* Groups */}
        {filteredGroups.map((group) => (
          <div key={group.id} className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3 bg-white p-3 rounded-lg shadow">
              {group.name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {group.candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  groupId={group.id}
                  onAddVote={handleAddVote}
                  onSubtractVote={handleSubtractVote}
                  hidePhoto={true}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">لا توجد بيانات متاحة</p>
          </div>
        )}
      </div>
    </div>
  );
}

