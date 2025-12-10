'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ElectionGroup, Candidate } from '@/lib/types';
import { subscribeToElection, subscribeToWrongVotes } from '@/lib/database';
import { monitorConnectionStatus } from '@/lib/firebase';

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

  // Calculate total votes across all groups
  const totalVotesAll = useMemo(() => {
    return groups.reduce((sum, group) => 
      sum + group.candidates.reduce((groupSum, c) => groupSum + c.votes, 0), 0
    );
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

      {/* Main Content Area */}
      <div className="flex-1 flex gap-2 p-2 overflow-hidden min-h-0">
        {/* Winners Display - 2/3 of screen */}
        <div className="flex-[2] bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-2 overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              <span className="w-1 h-4 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-full"></span>
              الفائزون
            </h2>
            <div className="text-xs text-slate-400">
              {allWinners.length} فائز
            </div>
          </div>
          
          {allWinners.length === 0 ? (
            <div className="text-center py-8 flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-700/50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm font-medium">لا توجد نتائج حتى الآن</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden grid grid-rows-[auto_auto_1fr_auto] gap-1.5 min-h-0">
              {(() => {
                // Head - Top
                const headGroup = groups.find(g => g.id === 'head');
                if (headGroup) {
                  const sorted = [...headGroup.candidates].sort((a, b) => b.votes - a.votes);
                  const winners = sorted.slice(0, headGroup.winnersCount);
                  const totalVotes = headGroup.candidates.reduce((sum, c) => sum + c.votes, 0);
                  const equalVotesCandidates = getEqualVotesCandidates.get('head') || new Set();
                  
                  if (winners.length > 0 && totalVotes > 0) {
                    return (
                      <div key="head" className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-lg p-1.5 border border-blue-500/30 shadow-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-xs font-bold text-white">{headGroup.name}</h3>
                          <span className="text-[10px] text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded">{totalVotes} صوت</span>
                        </div>
                        <div className="space-y-1">
                          {winners.map((candidate, index) => (
                            <WinnerCard
                              key={candidate.id}
                              candidate={candidate}
                              rank={index + 1}
                              totalVotes={totalVotes}
                              groupId={headGroup.id}
                              hasEqualVotes={equalVotesCandidates.has(candidate.id)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              })()}
              
              {/* Vice and Finance - Side by side */}
              <div className="grid grid-cols-2 gap-1.5">
                {['head-assistant', 'finance'].map((groupId) => {
                  const group = groups.find(g => g.id === groupId);
                  if (!group) return null;
                  const sorted = [...group.candidates].sort((a, b) => b.votes - a.votes);
                  const winners = sorted.slice(0, group.winnersCount);
                  const totalVotes = group.candidates.reduce((sum, c) => sum + c.votes, 0);
                  const equalVotesCandidates = getEqualVotesCandidates.get(groupId) || new Set();
                  
                  if (winners.length === 0 || totalVotes === 0) return null;
                  
                  const colors = groupId === 'head-assistant' 
                    ? { bg: 'from-emerald-600/20 to-emerald-700/20', border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300' }
                    : { bg: 'from-violet-600/20 to-violet-700/20', border: 'border-violet-500/30', badge: 'bg-violet-500/20 text-violet-300' };
                  
                  return (
                    <div key={groupId} className={`bg-gradient-to-br ${colors.bg} rounded-lg p-1.5 border ${colors.border} shadow-lg`}>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[10px] font-bold text-white truncate">{group.name}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors.badge}`}>{totalVotes} صوت</span>
                      </div>
                      <div className="space-y-1">
                        {winners.map((candidate, index) => (
                          <WinnerCard
                            key={candidate.id}
                            candidate={candidate}
                            rank={index + 1}
                            totalVotes={totalVotes}
                            groupId={groupId}
                            hasEqualVotes={equalVotesCandidates.has(candidate.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Members - Takes remaining space */}
              {(() => {
                const membersGroup = groups.find(g => g.id === 'members');
                if (membersGroup) {
                  const sorted = [...membersGroup.candidates].sort((a, b) => b.votes - a.votes);
                  const winners = sorted.slice(0, membersGroup.winnersCount);
                  const totalVotes = membersGroup.candidates.reduce((sum, c) => sum + c.votes, 0);
                  const equalVotesCandidates = getEqualVotesCandidates.get('members') || new Set();
                  
                  if (winners.length > 0 && totalVotes > 0) {
                    return (
                      <div key="members" className="bg-gradient-to-br from-amber-600/20 to-amber-700/20 rounded-lg p-1.5 border border-amber-500/30 flex-1 overflow-hidden min-h-0 flex flex-col shadow-lg">
                        <div className="flex items-center justify-between mb-1 flex-shrink-0">
                          <h3 className="text-xs font-bold text-white">{membersGroup.name}</h3>
                          <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded">{totalVotes} صوت</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 flex-1 overflow-hidden min-h-0">
                          {winners.map((candidate, index) => (
                            <WinnerCard
                              key={candidate.id}
                              candidate={candidate}
                              rank={index + 1}
                              totalVotes={totalVotes}
                              groupId={membersGroup.id}
                              hasEqualVotes={equalVotesCandidates.has(candidate.id)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              })()}
              
              {/* Under Age - Bottom */}
              {(() => {
                const underAgeGroup = groups.find(g => g.id === 'under-age');
                if (underAgeGroup) {
                  const sorted = [...underAgeGroup.candidates].sort((a, b) => b.votes - a.votes);
                  const winners = sorted.slice(0, underAgeGroup.winnersCount);
                  const totalVotes = underAgeGroup.candidates.reduce((sum, c) => sum + c.votes, 0);
                  const equalVotesCandidates = getEqualVotesCandidates.get('under-age') || new Set();
                  
                  if (winners.length > 0 && totalVotes > 0) {
                    return (
                      <div key="under-age" className="bg-gradient-to-br from-rose-600/20 to-rose-700/20 rounded-lg p-1.5 border border-rose-500/30 shadow-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-xs font-bold text-white">{underAgeGroup.name}</h3>
                          <span className="text-[10px] text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded">{totalVotes} صوت</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {winners.map((candidate, index) => (
                            <WinnerCard
                              key={candidate.id}
                              candidate={candidate}
                              rank={index + 1}
                              totalVotes={totalVotes}
                              groupId={underAgeGroup.id}
                              hasEqualVotes={equalVotesCandidates.has(candidate.id)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>
          )}
        </div>

        {/* Candidates List - 1/3 of screen */}
        <div className="flex-[1] bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-2 overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-1 h-4 bg-gradient-to-b from-slate-400 to-slate-500 rounded-full"></span>
              قائمة المرشحين
            </h2>
          </div>
          
          <div className="flex-1 overflow-hidden grid grid-rows-[auto_auto_1fr_auto] gap-1 min-h-0">
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
            
            {/* Vice and Finance - Side by side */}
            <div className="grid grid-cols-2 gap-1">
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
  
  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden flex flex-col min-h-0 shadow-md`}>
      <div className={`px-1.5 py-1 ${colors.header} flex-shrink-0 border-b ${colors.border}`}>
        <h3 className="text-[10px] font-bold text-white truncate">{group.name}</h3>
      </div>
      <div className={`flex-1 overflow-hidden min-h-0 divide-y divide-slate-700/50`}>
        {sortedCandidates.map((candidate) => {
          const isWinner = allWinners.some(w => w.candidate.id === candidate.id && w.groupId === group.id);
          return (
            <div
              key={candidate.id}
              className={`px-1.5 py-1 flex items-center gap-1.5 text-[10px] transition-colors ${
                isWinner ? 'bg-yellow-500/20 border-l-2 border-yellow-400' : 'hover:bg-slate-700/30'
              }`}
            >
              <span className="text-slate-300 font-semibold w-5 text-center flex-shrink-0 bg-slate-700/50 rounded px-0.5 py-0.5">
                {candidate.number !== undefined && candidate.number !== null ? candidate.number : '—'}
              </span>
              <span className={`text-slate-200 flex-1 truncate ${
                isWinner ? 'font-bold text-yellow-300' : ''
              }`}>
                {candidate.name}
              </span>
              <span className={`font-bold w-6 text-center flex-shrink-0 rounded px-1 py-0.5 ${
                isWinner ? 'bg-yellow-500/30 text-yellow-300' : 'bg-slate-700/50 text-slate-300'
              }`}>
                {candidate.votes}
              </span>
            </div>
          );
        })}
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
