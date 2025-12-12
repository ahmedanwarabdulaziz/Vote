'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ElectionGroup, Candidate } from '@/lib/types';
import { subscribeToElection, subscribeToWrongVotes } from '@/lib/database';
import { monitorConnectionStatus } from '@/lib/firebase';
import { ELECTION_CONFIG } from '@/lib/electionData';

export default function ResultsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<ElectionGroup[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);
  const [wrongVoteCount, setWrongVoteCount] = useState(0);

  useEffect(() => {
    // Monitor connection status
    const unsubscribeConnection = monitorConnectionStatus((online, dbConnected) => {
      setIsOnline(online);
      setIsDatabaseConnected(dbConnected);
    });

    // Subscribe to wrong vote count
    const unsubscribeWrongVotes = subscribeToWrongVotes((count) => {
      setWrongVoteCount(count);
    });

    // Subscribe to election data
    const unsubscribeElection = subscribeToElection((updatedGroups) => {
      setGroups(updatedGroups);
    });

    return () => {
      unsubscribeConnection();
      unsubscribeWrongVotes();
      unsubscribeElection();
    };
  }, []);

  // Get all winners across all groups
  const allWinners = useMemo(() => {
    const winners: Array<{ candidate: Candidate; groupName: string; groupId: string; rank: number }> = [];
    groups.forEach(group => {
      const sorted = [...group.candidates].sort((a, b) => b.votes - a.votes);
      const groupWinners = sorted.slice(0, group.winnersCount);
      groupWinners.forEach((candidate, index) => {
        winners.push({ 
          candidate, 
          groupName: group.name, 
          groupId: group.id,
          rank: index + 1 
        });
      });
    });
    return winners;
  }, [groups]);

  // Calculate total votes for president candidates only
  const totalVotesAll = useMemo(() => {
    const headGroup = groups.find(g => g.id === 'head');
    if (!headGroup) return 0;
    return headGroup.candidates.reduce((sum, c) => sum + c.votes, 0);
  }, [groups]);

  // Helper to find candidates with equal votes in a group
  const getEqualVotesCandidates = useMemo(() => {
    const equalVotesMap = new Map<string, Set<string>>();
    
    groups.forEach(group => {
      const voteCounts = new Map<number, string[]>();
      group.candidates.forEach(candidate => {
        const voteCount = candidate.votes;
        if (!voteCounts.has(voteCount)) {
          voteCounts.set(voteCount, []);
        }
        voteCounts.get(voteCount)!.push(candidate.id);
      });
      
      voteCounts.forEach((candidateIds, voteCount) => {
        if (candidateIds.length > 1 && voteCount > 0) {
          const key = `${group.id}`;
          if (!equalVotesMap.has(key)) {
            equalVotesMap.set(key, new Set());
          }
          candidateIds.forEach(id => {
            equalVotesMap.get(key)!.add(id);
          });
        }
      });
    });
    
    return equalVotesMap;
  }, [groups]);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600 shadow-xl p-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">نتائج الانتخابات</h1>
              <p className="text-slate-300 text-xs mt-0.5">عرض النتائج المباشرة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md ${
              isOnline && isDatabaseConnected
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' 
                : 'bg-red-500/20 text-red-300 border border-red-500/50'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline && isDatabaseConnected ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`}></span>
              {isOnline && isDatabaseConnected ? 'مباشر' : 'غير متصل'}
            </div>
            {wrongVoteCount > 0 && (
              <div className="px-2 py-1 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/50 shadow-md">
                <span className="text-red-400">خاطئة:</span> {wrongVoteCount}
              </div>
            )}
            {totalVotesAll > 0 && (
              <div className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-md">
                <span className="text-blue-400">إجمالي:</span> {totalVotesAll}
              </div>
            )}
            <button
              onClick={() => router.push('/')}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-md border border-slate-600"
            >
              خروج
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Full width candidates list */}
      <div className="flex-1 overflow-y-auto sm:overflow-hidden p-1 sm:p-2 min-h-0">
        {/* Candidates List - Full width */}
        <div className="min-h-full bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-1 sm:p-2 sm:h-full overflow-y-auto sm:overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-1 sm:mb-2 flex-shrink-0">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
              <span className="w-1 h-4 sm:h-5 bg-gradient-to-b from-slate-400 to-slate-500 rounded-full"></span>
              قائمة المرشحين
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto sm:overflow-hidden grid grid-rows-[auto_auto_1fr_auto] gap-1 min-h-0">
            {/* President - Top */}
            {(() => {
              const group = groups.find(g => g.id === 'head');
              if (!group) return null;
              const sortedCandidates = [...group.candidates].sort((a, b) => (a.number || 0) - (b.number || 0));
              const equalVotesCandidates = getEqualVotesCandidates.get(group.id) || new Set();
              return (
                <CategorySection 
                  group={group} 
                  sortedCandidates={sortedCandidates}
                  allWinners={allWinners}
                  isMembers={false}
                  equalVotesCandidates={equalVotesCandidates}
                />
              );
            })()}
            
            {/* Vice and Finance - Side by side on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
              {['head-assistant', 'finance'].map((groupId) => {
                const group = groups.find(g => g.id === groupId);
                if (!group) return null;
                const sortedCandidates = [...group.candidates].sort((a, b) => (a.number || 0) - (b.number || 0));
                const equalVotesCandidates = getEqualVotesCandidates.get(group.id) || new Set();
                return (
                  <CategorySection 
                    key={groupId}
                    group={group} 
                    sortedCandidates={sortedCandidates}
                    allWinners={allWinners}
                    isMembers={false}
                    equalVotesCandidates={equalVotesCandidates}
                  />
                );
              })}
            </div>
            
            {/* Members - Takes remaining space */}
            {(() => {
              const group = groups.find(g => g.id === 'members');
              if (!group) return null;
              const sortedCandidates = [...group.candidates].sort((a, b) => (a.number || 0) - (b.number || 0));
              const equalVotesCandidates = getEqualVotesCandidates.get(group.id) || new Set();
              return (
                <CategorySection 
                  group={group} 
                  sortedCandidates={sortedCandidates}
                  allWinners={allWinners}
                  isMembers={true}
                  equalVotesCandidates={equalVotesCandidates}
                />
              );
            })()}
            
            {/* Under Age - Bottom */}
            {(() => {
              const group = groups.find(g => g.id === 'under-age');
              if (!group) return null;
              const sortedCandidates = [...group.candidates].sort((a, b) => (a.number || 0) - (b.number || 0));
              const equalVotesCandidates = getEqualVotesCandidates.get(group.id) || new Set();
              return (
                <CategorySection 
                  group={group} 
                  sortedCandidates={sortedCandidates}
                  allWinners={allWinners}
                  isMembers={false}
                  equalVotesCandidates={equalVotesCandidates}
                />
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for category sections
function CategorySection({
  group,
  sortedCandidates,
  allWinners,
  isMembers,
  equalVotesCandidates,
}: {
  group: ElectionGroup;
  sortedCandidates: Candidate[];
  allWinners: Array<{ candidate: Candidate; groupId: string }>;
  isMembers: boolean;
  equalVotesCandidates: Set<string>;
}) {
  const getGroupColor = (id: string) => {
    switch (id) {
      case 'head': return { bg: 'bg-blue-600/20', border: 'border-blue-500/40', header: 'bg-gradient-to-r from-blue-600/30 to-blue-700/30' };
      case 'head-assistant': return { bg: 'bg-emerald-600/20', border: 'border-emerald-500/40', header: 'bg-gradient-to-r from-emerald-600/30 to-emerald-700/30' };
      case 'finance': return { bg: 'bg-violet-600/20', border: 'border-violet-500/40', header: 'bg-gradient-to-r from-violet-600/30 to-violet-700/30' };
      case 'members': return { bg: 'bg-amber-600/20', border: 'border-amber-500/40', header: 'bg-gradient-to-r from-amber-600/30 to-amber-700/30' };
      case 'under-age': return { bg: 'bg-rose-600/20', border: 'border-rose-500/40', header: 'bg-gradient-to-r from-rose-600/30 to-rose-700/30' };
      default: return { bg: 'bg-slate-600/20', border: 'border-slate-500/40', header: 'bg-gradient-to-r from-slate-600/30 to-slate-700/30' };
    }
  };
  
  const colors = getGroupColor(group.id);
  
  // Determine grid columns: 2 columns on mobile, 3 for members on desktop, 2 for others on desktop
  const gridCols = isMembers ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2';
  
  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden flex flex-col min-h-0 shadow-md`}>
      <div className={`px-1.5 sm:px-2 py-1 sm:py-1.5 ${colors.header} flex-shrink-0 border-b ${colors.border}`}>
        <h3 className="text-[10px] sm:text-xs font-bold text-white truncate">{group.name}</h3>
      </div>
      <div className={`flex-1 overflow-y-auto sm:overflow-hidden min-h-0 p-1`}>
        <div className={`grid ${gridCols} gap-1`} style={{ gridAutoRows: isMembers ? 'auto' : 'minmax(0, 1fr)' }}>
          {sortedCandidates.map((candidate) => {
            const isWinner = allWinners.some(w => w.candidate.id === candidate.id && w.groupId === group.id);
            // Get number from candidate, fallback to finding it from ELECTION_CONFIG if needed
            let displayNumber = candidate.number;
            if (displayNumber === undefined || displayNumber === null || displayNumber === 0) {
              // Try to get from ELECTION_CONFIG as fallback
              const configGroup = ELECTION_CONFIG.find(g => g.id === group.id);
              if (configGroup) {
                const configCandidate = configGroup.candidates.find(c => c.id === candidate.id);
                if (configCandidate && configCandidate.number !== undefined) {
                  displayNumber = configCandidate.number;
                }
              }
            }
            
            // For members, show horizontal layout: number | name + votes
            if (isMembers) {
              return (
                <div
                  key={candidate.id}
                  className={`px-1 py-1 flex items-center gap-1 text-[9px] sm:text-[10px] transition-colors rounded min-h-0 ${
                    isWinner ? 'bg-yellow-500/20 border border-yellow-400' : 'bg-slate-700/30 border border-slate-600/50 hover:bg-slate-700/40'
                  }`}
                >
                  {/* Number */}
                  <span className="text-slate-300 font-semibold flex-shrink-0 bg-slate-700/50 rounded px-1 py-0.5 text-[8px] sm:text-[9px] whitespace-nowrap">
                    {displayNumber !== undefined && displayNumber !== null && displayNumber !== 0 ? displayNumber : '—'}
                  </span>
                  {/* Name and Votes */}
                  <div className="flex-1 flex items-center justify-between gap-1 min-w-0">
                    <span className={`text-slate-200 flex-1 truncate ${
                      isWinner ? 'font-bold text-yellow-300' : ''
                    }`}>
                      {candidate.name}
                    </span>
                    <span className={`font-bold flex-shrink-0 rounded px-1 py-0.5 text-[9px] sm:text-[10px] whitespace-nowrap ${
                      isWinner ? 'bg-yellow-500/30 text-yellow-300' : 'bg-slate-700/50 text-slate-300'
                    }`}>
                      {candidate.votes}
                    </span>
                  </div>
                </div>
              );
            }
            
            // For other groups, keep vertical layout
            return (
              <div
                key={candidate.id}
                className={`px-1 py-1 flex flex-col items-center justify-center gap-0.5 text-[9px] sm:text-[10px] transition-colors rounded min-h-0 ${
                  isWinner ? 'bg-yellow-500/20 border border-yellow-400' : 'bg-slate-700/30 border border-slate-600/50 hover:bg-slate-700/40'
                }`}
              >
                <span className="text-slate-300 font-semibold text-center flex-shrink-0 bg-slate-700/50 rounded px-1 py-0.5 text-[8px] sm:text-[9px] w-full whitespace-nowrap">
                  {displayNumber !== undefined && displayNumber !== null && displayNumber !== 0 ? displayNumber : '—'}
                </span>
                <span className={`text-slate-200 text-center w-full break-words leading-tight px-0.5 ${
                  isWinner ? 'font-bold text-yellow-300' : ''
                }`} style={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: '2em'
                }}>
                  {candidate.name}
                </span>
                <span className={`font-bold text-center flex-shrink-0 rounded px-1 py-0.5 text-[9px] sm:text-[10px] w-full whitespace-nowrap ${
                  isWinner ? 'bg-yellow-500/30 text-yellow-300' : 'bg-slate-700/50 text-slate-300'
                }`}>
                  {candidate.votes}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WinnerCard({
  candidate,
  rank,
  totalVotes,
  groupId,
  hasEqualVotes = false,
}: {
  candidate: Candidate;
  rank: number;
  totalVotes: number;
  groupId: string;
  hasEqualVotes?: boolean;
}) {
  const percentage = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;
  
  const getGroupColor = (groupId: string) => {
    switch (groupId) {
      case 'head':
        return { gradient: 'from-blue-600 to-blue-700', badge: 'bg-blue-500', text: 'text-blue-100' };
      case 'head-assistant':
        return { gradient: 'from-emerald-600 to-emerald-700', badge: 'bg-emerald-500', text: 'text-emerald-100' };
      case 'finance':
        return { gradient: 'from-violet-600 to-violet-700', badge: 'bg-violet-500', text: 'text-violet-100' };
      case 'members':
        return { gradient: 'from-amber-600 to-amber-700', badge: 'bg-amber-500', text: 'text-amber-100' };
      case 'under-age':
        return { gradient: 'from-rose-600 to-rose-700', badge: 'bg-rose-500', text: 'text-rose-100' };
      default:
        return { gradient: 'from-blue-600 to-blue-700', badge: 'bg-blue-500', text: 'text-blue-100' };
    }
  };

  const colors = getGroupColor(groupId);

  return (
    <div className={`bg-gradient-to-br ${colors.gradient} rounded-lg p-1.5 shadow-lg border border-white/10 ${
      hasEqualVotes ? 'ring-2 ring-orange-400 ring-opacity-70' : ''
    }`}>
      <div className="flex items-center gap-2">
        {/* Rank Badge */}
        <div className={`${colors.badge} w-6 h-6 rounded flex items-center justify-center font-bold text-white text-xs shadow-md flex-shrink-0`}>
          {rank}
        </div>
        
        {/* Name and Stats */}
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-xs mb-0.5 truncate">{candidate.name}</div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className={`${colors.text} font-semibold`}>{candidate.votes} صوت</span>
            {totalVotes > 0 && (
              <>
                <span className="text-white/50">•</span>
                <span className={`${colors.text}`}>{percentage}%</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
