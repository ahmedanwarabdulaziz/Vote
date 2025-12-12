'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ELECTION_CONFIG, OTHER_VOTE_PASSWORD } from '@/lib/electionData';
import { subscribeToElection, addVote, subtractVote, initializeElection, getElectionData } from '@/lib/database';
import { monitorConnectionStatus } from '@/lib/firebase';
import { ElectionGroup } from '@/lib/types';
import CandidateCard from '@/components/CandidateCard';

export default function OtherVotePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<ElectionGroup[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);

  // Filter only members and under-age positions
  // Order: Members first, then Under Age
  const otherPositions = ['members', 'under-age'];
  const filteredGroups = otherPositions
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
          // Initialize with only other positions in correct order: Members, Under Age
          const otherGroups = otherPositions
            .map(positionId => ELECTION_CONFIG.find(group => group.id === positionId))
            .filter((group): group is ElectionGroup => group !== undefined);
          await initializeElection(otherGroups);
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
    if (password === OTHER_VOTE_PASSWORD) {
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
              التصويت للأعضاء
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
            أعضاء مجلس الإدارة - أعضاء تحت السن
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
    <div className="h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden p-1.5">
        {/* Header - Compact and fixed */}
        <div className="bg-white rounded-lg shadow-md p-1.5 mb-1 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-gray-800">التصويت للأعضاء</h1>
            <p className="text-[10px] text-gray-600">أعضاء مجلس الإدارة - أعضاء تحت السن</p>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full transition-colors ${
              isOnline && isDatabaseConnected 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-red-500'
            }`}></div>
            <span className="text-[10px] font-medium text-gray-700 hidden xs:inline">
              {isOnline && isDatabaseConnected ? 'متصل' : 'غير متصل'}
            </span>
          </div>
          
          <button
            onClick={() => router.push('/')}
            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] hover:bg-gray-300 transition-colors flex-shrink-0 ml-1"
          >
            العودة
          </button>
        </div>

        {/* Groups - Fit everything without scrolling */}
        <div className="flex-1 flex flex-col gap-1 overflow-hidden">
          {filteredGroups.map((group, groupIndex) => {
            // Sort candidates by number
            const sortedCandidates = [...group.candidates].sort((a, b) => (a.number || 0) - (b.number || 0));
            
            // Use exact same grid configuration for both groups
            const gridCols = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7";
            
            return (
              <div key={group.id} className="flex-1 flex flex-col overflow-hidden min-h-0" style={{ flexBasis: '50%' }}>
                <h2 className="text-xs font-bold text-gray-800 mb-1 bg-white p-1 rounded shadow flex-shrink-0">
                  {group.name}
                </h2>
                <div className={`flex-1 grid ${gridCols} gap-1 overflow-hidden`} style={{ gridAutoRows: 'minmax(0, 1fr)' }}>
                  {sortedCandidates.map((candidate) => (
                    <div key={candidate.id} className="h-full w-full min-h-0">
                      <CandidateCard
                        candidate={candidate}
                        groupId={group.id}
                        onAddVote={handleAddVote}
                        onSubtractVote={handleSubtractVote}
                        hidePhoto={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredGroups.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">لا توجد بيانات متاحة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

