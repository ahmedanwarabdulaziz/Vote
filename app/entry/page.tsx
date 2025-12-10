'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ElectionGroup } from '@/lib/types';
import { subscribeToElection, initializeElection, subscribeToWrongVotes, addWrongVote, batchAddVotes } from '@/lib/database';
import { monitorConnectionStatus } from '@/lib/firebase';
import { ELECTION_CONFIG } from '@/lib/electionData';
import CandidateSelectionCard from '@/components/CandidateSelectionCard';

export default function EntryPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<ElectionGroup[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);
  const [wrongVoteCount, setWrongVoteCount] = useState(0);
  
  // Local state for current paper selections (Set of candidate IDs)
  const [selections, setSelections] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

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

    // Initialize election if not already done
    const checkAndInitialize = async () => {
      try {
        const unsubscribe = subscribeToElection((updatedGroups) => {
          if (updatedGroups.length > 0) {
            setGroups(updatedGroups);
            setIsInitialized(true);
          } else {
            // Initialize if empty
            initializeElection(ELECTION_CONFIG).then(() => {
              setIsInitialized(true);
            });
          }
        });

        return () => {
          unsubscribe();
          unsubscribeConnection();
          unsubscribeWrongVotes();
        };
      } catch (error) {
        console.error('Error initializing:', error);
      }
    };

    checkAndInitialize();
  }, []);

  // Toggle candidate selection
  const handleToggleSelection = (groupId: string, candidateId: string) => {
    // Find the group to get winnersCount
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    // Map group IDs to candidate ID prefixes
    const prefixMap: Record<string, string> = {
      'head': 'head-',
      'head-assistant': 'assistant-',
      'finance': 'finance-',
      'members': 'member-',
      'under-age': 'underage-'
    };
    const prefix = prefixMap[groupId] || '';

    setSelections(prev => {
      const newSet = new Set(prev);
      
      // If deselecting, always allow
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
        return newSet;
      }
      
      // If selecting, check limits
      const currentCount = Array.from(newSet).filter(id => id.startsWith(prefix)).length;
      
      // For single-selection groups (winnersCount === 1), deselect previous selection first
      if (group.winnersCount === 1) {
        // Remove any existing selection in this group
        Array.from(newSet).forEach(id => {
          if (id.startsWith(prefix)) {
            newSet.delete(id);
          }
        });
        // Add the new selection
        newSet.add(candidateId);
      } 
      // For multi-selection groups, only allow if under limit
      else if (currentCount < group.winnersCount) {
        newSet.add(candidateId);
      }
      // If limit reached, don't add (prevent selection)
      
      return newSet;
    });
  };

  // Get selection count for a group
  const getSelectionCount = (groupId: string): number => {
    // Map group IDs to candidate ID prefixes
    const prefixMap: Record<string, string> = {
      'head': 'head-',
      'head-assistant': 'assistant-',
      'finance': 'finance-',
      'members': 'member-',
      'under-age': 'underage-'
    };
    const prefix = prefixMap[groupId] || '';
    return Array.from(selections).filter(id => id.startsWith(prefix)).length;
  };

  // Check if a candidate should be disabled (group limit reached and not selected)
  const isCandidateDisabled = (groupId: string, candidateId: string): boolean => {
    if (selections.has(candidateId)) return false; // Can always deselect
    const group = groups.find(g => g.id === groupId);
    if (!group) return false;
    const currentCount = getSelectionCount(groupId);
    return currentCount >= group.winnersCount;
  };

  // Validate selections
  const validateSelections = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    const headCount = getSelectionCount('head');
    const viceCount = getSelectionCount('head-assistant');
    const financeCount = getSelectionCount('finance');
    const membersCount = getSelectionCount('members');
    const underAgeCount = getSelectionCount('under-age');

    if (headCount !== 1) errors.push(`رئيس مجلس الإدارة: ${headCount}/1`);
    if (viceCount !== 1) errors.push(`نائب رئيس مجلس الإدارة: ${viceCount}/1`);
    if (financeCount !== 1) errors.push(`أمين الصندوق: ${financeCount}/1`);
    if (membersCount !== 5) errors.push(`عضو مجلس الإدارة: ${membersCount}/5`);
    if (underAgeCount !== 2) errors.push(`عضو مجلس الإدارة (تحت السن): ${underAgeCount}/2`);

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Handle confirm (valid paper)
  const handleConfirm = async () => {
    const validation = validateSelections();
    if (!validation.isValid || isProcessing) return;

    setIsProcessing(true);
    try {
      // Convert selections to vote array
      // Need to find groupId for each candidate
      const votes = Array.from(selections).map(candidateId => {
        // Find which group this candidate belongs to
        let groupId = '';
        for (const group of groups) {
          if (group.candidates.some(c => c.id === candidateId)) {
            groupId = group.id;
            break;
          }
        }
        return { groupId, candidateId };
      }).filter(v => v.groupId); // Filter out any that weren't found

      // Batch add all votes
      await batchAddVotes(votes);

      // Reset selections
      setSelections(new Set());
    } catch (error) {
      console.error('Error confirming votes:', error);
      alert('فشل في حفظ الأصوات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle wrong vote (invalid paper)
  const handleWrongVote = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await addWrongVote();
      // Reset selections
      setSelections(new Set());
    } catch (error) {
      console.error('Error adding wrong vote:', error);
      alert('فشل في إضافة ورقة خاطئة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsProcessing(false);
    }
  };

  const validation = validateSelections();
  const hasSelections = selections.size > 0;

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden flex flex-col">
      {/* Header - Compact */}
      <div className="bg-white shadow-sm px-2 py-0.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-gray-800">إدخال الأصوات</h1>
            <div className={`px-1.5 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${
              isOnline && isDatabaseConnected
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              <span className="w-1 h-1 rounded-full bg-white animate-pulse"></span>
              {isOnline && isDatabaseConnected ? 'متصل' : 'غير متصل'}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="bg-red-50 border border-red-300 rounded px-2 py-0.5 flex items-center gap-1.5">
              <span className="text-xs text-red-700 font-semibold">خاطئة:</span>
              <span className="text-sm font-bold text-red-700">{wrongVoteCount}</span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs font-semibold"
            >
              خروج
            </button>
          </div>
        </div>
      </div>

      {/* Selection Progress Bar - Compact */}
      {hasSelections && (
        <div className="bg-white shadow-sm px-2 py-0.5 flex-shrink-0 border-b border-blue-200">
          <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
            <div className={`px-2 py-0.5 rounded font-semibold ${
              getSelectionCount('head') === 1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              رئيس: {getSelectionCount('head')}/1
            </div>
            <div className={`px-2 py-0.5 rounded font-semibold ${
              getSelectionCount('head-assistant') === 1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              نائب: {getSelectionCount('head-assistant')}/1
            </div>
            <div className={`px-2 py-0.5 rounded font-semibold ${
              getSelectionCount('finance') === 1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              أمين: {getSelectionCount('finance')}/1
            </div>
            <div className={`px-2 py-0.5 rounded font-semibold ${
              getSelectionCount('members') === 5 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              أعضاء: {getSelectionCount('members')}/5
            </div>
            <div className={`px-2 py-0.5 rounded font-semibold ${
              getSelectionCount('under-age') === 2 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              تحت السن: {getSelectionCount('under-age')}/2
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Compact */}
      <div className="bg-white shadow-sm px-2 py-0.5 flex-shrink-0 border-b">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleConfirm}
            disabled={!validation.isValid || isProcessing}
            className={`px-4 py-1.5 rounded font-bold text-sm shadow transition-all ${
              validation.isValid && !isProcessing
                ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? 'جاري الحفظ...' : 'تأكيد'}
          </button>
          <button
            onClick={handleWrongVote}
            disabled={validation.isValid || !hasSelections || isProcessing}
            className={`px-4 py-1.5 rounded font-bold text-sm shadow transition-all ${
              !validation.isValid && hasSelections && !isProcessing
                ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? 'جاري الحفظ...' : 'خاطئة'}
          </button>
        </div>
        {!validation.isValid && hasSelections && (
          <div className="text-center mt-1">
            <p className="text-xs text-red-600 font-semibold">
              {validation.errors.join('، ')}
            </p>
          </div>
        )}
      </div>

      {/* All Groups - Fit to Screen */}
      <div className="flex-1 overflow-hidden p-0.5 min-h-0">
        {!isInitialized ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">جاري التهيئة...</p>
            </div>
          </div>
        ) : (
          <div className="h-full grid grid-rows-[auto_auto_1fr_auto] gap-0.5 min-h-0">
            {/* Head - Full width */}
            {groups.filter(group => group.id === 'head').map((group) => (
              <div key={group.id} className="bg-gradient-to-br from-blue-100 to-blue-200 rounded shadow p-0.5 overflow-hidden border-2 border-blue-400">
                <div className="flex items-center gap-1 mb-0.5">
                  <h2 className="text-xs font-bold text-gray-800 whitespace-nowrap">
                    {group.name}
                  </h2>
                  <span className="text-xs text-gray-500">
                    (اختر {group.winnersCount})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-0.5 max-w-xl mx-auto h-full">
                  {[...group.candidates].sort((a, b) => (a.number || 0) - (b.number || 0)).map((candidate) => (
                    <CandidateSelectionCard
                      key={candidate.id}
                      candidate={candidate}
                      isSelected={selections.has(candidate.id)}
                      isDisabled={isCandidateDisabled(group.id, candidate.id)}
                      groupId={group.id}
                      onToggle={() => handleToggleSelection(group.id, candidate.id)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Head Assistant and Finance - Side by side */}
            <div className="grid grid-cols-2 gap-0.5">
              {/* Head Assistant - Left */}
              {groups.filter(group => group.id === 'head-assistant').map((group) => (
                <div key={group.id} className="rounded shadow p-0.5 overflow-hidden border-2 bg-gradient-to-br from-emerald-100 to-teal-200 border-emerald-400 col-start-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <h2 className="text-xs font-bold text-gray-800 whitespace-nowrap">
                      {group.name}
                    </h2>
                    <span className="text-xs text-gray-500">
                      (اختر {group.winnersCount})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-0.5 h-full">
                    {[...group.candidates].sort((a, b) => (a.number || 0) - (b.number || 0)).map((candidate) => (
                      <CandidateSelectionCard
                        key={candidate.id}
                        candidate={candidate}
                        isSelected={selections.has(candidate.id)}
                        isDisabled={isCandidateDisabled(group.id, candidate.id)}
                        groupId={group.id}
                        onToggle={() => handleToggleSelection(group.id, candidate.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {/* Finance - Right */}
              {groups.filter(group => group.id === 'finance').map((group) => (
                <div key={group.id} className="rounded shadow p-0.5 overflow-hidden border-2 bg-gradient-to-br from-violet-100 to-purple-200 border-violet-400 col-start-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <h2 className="text-xs font-bold text-gray-800 whitespace-nowrap">
                      {group.name}
                    </h2>
                    <span className="text-xs text-gray-500">
                      (اختر {group.winnersCount})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-0.5 h-full">
                    {[...group.candidates].sort((a, b) => (a.number || 0) - (b.number || 0)).map((candidate) => (
                      <CandidateSelectionCard
                        key={candidate.id}
                        candidate={candidate}
                        isSelected={selections.has(candidate.id)}
                        isDisabled={isCandidateDisabled(group.id, candidate.id)}
                        groupId={group.id}
                        onToggle={() => handleToggleSelection(group.id, candidate.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Members - Takes remaining space */}
            <div className="bg-gradient-to-br from-orange-100 to-amber-200 rounded shadow p-0.5 overflow-hidden border-2 border-orange-400 min-h-0">
              {groups.filter(group => group.id === 'members').map((group) => (
                <div key={group.id} className="h-full flex flex-col min-h-0">
                  <div className="flex items-center gap-1 mb-0.5 flex-shrink-0">
                    <h2 className="text-sm font-bold text-gray-800 whitespace-nowrap">
                      {group.name}
                    </h2>
                    <span className="text-xs text-gray-500">
                      (اختر {group.winnersCount})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-0.5 flex-1 min-h-0 overflow-hidden">
                    {[...group.candidates].sort((a, b) => (a.number || 0) - (b.number || 0)).map((candidate) => (
                      <CandidateSelectionCard
                        key={candidate.id}
                        candidate={candidate}
                        isSelected={selections.has(candidate.id)}
                        isDisabled={isCandidateDisabled(group.id, candidate.id)}
                        groupId={group.id}
                        onToggle={() => handleToggleSelection(group.id, candidate.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Under Age */}
            {groups.filter(group => group.id === 'under-age').map((group) => (
              <div key={group.id} className="bg-gradient-to-br from-rose-100 to-pink-200 rounded shadow p-0.5 overflow-hidden border-2 border-rose-400">
                <div className="flex items-center gap-1 mb-0.5">
                  <h2 className="text-xs font-bold text-gray-800 whitespace-nowrap">
                    {group.name}
                  </h2>
                  <span className="text-xs text-gray-500">
                    (اختر {group.winnersCount})
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-0.5 h-full">
                  {[...group.candidates].sort((a, b) => (a.number || 0) - (b.number || 0)).map((candidate) => (
                    <CandidateSelectionCard
                      key={candidate.id}
                      candidate={candidate}
                      isSelected={selections.has(candidate.id)}
                      isDisabled={isCandidateDisabled(group.id, candidate.id)}
                      groupId={group.id}
                      onToggle={() => handleToggleSelection(group.id, candidate.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
