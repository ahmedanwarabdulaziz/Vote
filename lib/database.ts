'use client';

import { ref, get, set, onValue } from 'firebase/database';
import { database } from './firebase';
import { ElectionGroup } from './types';
import { ELECTION_CONFIG } from './electionData';

const ELECTION_REF = ref(database, 'election');

export async function initializeElection(groups: ElectionGroup[]) {
  // Convert groups array to object keyed by group ID for Firebase
  const groupsObject: Record<string, any> = {};
  groups.forEach((group) => {
    groupsObject[group.id] = {
      name: group.name,
      winnersCount: group.winnersCount,
      candidates: group.candidates.reduce((acc, candidate) => {
        acc[candidate.id] = {
          name: candidate.name,
          photo: candidate.photo,
          votes: 0,
          number: candidate.number !== undefined ? candidate.number : null
        };
        return acc;
      }, {} as Record<string, any>)
    };
  });

  await set(ELECTION_REF, {
    groups: groupsObject,
    isActive: true,
    createdAt: Date.now()
  });
}

export async function getElectionData(): Promise<ElectionGroup[]> {
  const snapshot = await get(ELECTION_REF);
  if (!snapshot.exists()) {
    return [];
  }
  const data = snapshot.val();
  const groups: ElectionGroup[] = [];
  Object.keys(data.groups).forEach((groupId) => {
    const groupData = data.groups[groupId];
    const candidates: Array<{ id: string; name: string; photo: string; votes: number; number: number }> = [];
    Object.keys(groupData.candidates).forEach((candidateId) => {
        // Get number from database, or fallback to ELECTION_CONFIG
        let candidateNumber = groupData.candidates[candidateId].number;
        if (candidateNumber === undefined || candidateNumber === null) {
          // Try to find the number from ELECTION_CONFIG
          const configGroup = ELECTION_CONFIG.find(g => g.id === groupId);
          if (configGroup) {
            const configCandidate = configGroup.candidates.find(c => c.id === candidateId);
            if (configCandidate && configCandidate.number !== undefined) {
              candidateNumber = configCandidate.number;
            }
          }
        }
        
        candidates.push({
          id: candidateId,
          name: groupData.candidates[candidateId].name,
          photo: groupData.candidates[candidateId].photo,
          votes: groupData.candidates[candidateId].votes || 0,
          number: candidateNumber !== undefined && candidateNumber !== null ? candidateNumber : 0
        });
    });
    groups.push({
      id: groupId,
      name: groupData.name,
      winnersCount: groupData.winnersCount,
      candidates
    });
  });
  return groups;
}

export function subscribeToElection(callback: (groups: ElectionGroup[]) => void) {
  const groupsRef = ref(database, 'election/groups');
  return onValue(groupsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const groups: ElectionGroup[] = [];
    Object.keys(data).forEach((groupId) => {
      const groupData = data[groupId];
      const candidates: Array<{ id: string; name: string; photo: string; votes: number; number: number }> = [];
      Object.keys(groupData.candidates).forEach((candidateId) => {
        // Get number from database, or fallback to ELECTION_CONFIG
        let candidateNumber = groupData.candidates[candidateId].number;
        if (candidateNumber === undefined || candidateNumber === null) {
          // Try to find the number from ELECTION_CONFIG
          const configGroup = ELECTION_CONFIG.find(g => g.id === groupId);
          if (configGroup) {
            const configCandidate = configGroup.candidates.find(c => c.id === candidateId);
            if (configCandidate && configCandidate.number !== undefined) {
              candidateNumber = configCandidate.number;
            }
          }
        }
        
        candidates.push({
          id: candidateId,
          name: groupData.candidates[candidateId].name,
          photo: groupData.candidates[candidateId].photo,
          votes: groupData.candidates[candidateId].votes || 0,
          number: candidateNumber !== undefined && candidateNumber !== null ? candidateNumber : 0
        });
      });
      groups.push({
        id: groupId,
        name: groupData.name,
        winnersCount: groupData.winnersCount,
        candidates
      });
    });
    callback(groups);
  });
}

export async function addVote(groupId: string, candidateId: string) {
  const candidateRef = ref(database, `election/groups/${groupId}/candidates/${candidateId}/votes`);
  const currentSnapshot = await get(candidateRef);
  const currentVotes = currentSnapshot.exists() ? currentSnapshot.val() : 0;
  const newVotes = currentVotes + 1;
  await set(candidateRef, newVotes);
  
  // Log vote entry
  const voteLogRef = ref(database, `election/voteLog/${Date.now()}`);
  await set(voteLogRef, {
    groupId,
    candidateId,
    type: 'add',
    timestamp: Date.now()
  });
}

export async function subtractVote(groupId: string, candidateId: string) {
  const candidateRef = ref(database, `election/groups/${groupId}/candidates/${candidateId}/votes`);
  const currentSnapshot = await get(candidateRef);
  const currentVotes = currentSnapshot.exists() ? currentSnapshot.val() : 0;
  const newVotes = Math.max(0, currentVotes - 1);
  await set(candidateRef, newVotes);
  
  // Log vote entry
  const voteLogRef = ref(database, `election/voteLog/${Date.now()}`);
  await set(voteLogRef, {
    groupId,
    candidateId,
    type: 'subtract',
    timestamp: Date.now()
  });
}

export async function getWrongVoteCount(): Promise<number> {
  const wrongVoteRef = ref(database, 'election/wrongVoteCount');
  const snapshot = await get(wrongVoteRef);
  return snapshot.exists() ? snapshot.val() : 0;
}

export function subscribeToWrongVotes(callback: (count: number) => void) {
  const wrongVoteRef = ref(database, 'election/wrongVoteCount');
  return onValue(wrongVoteRef, (snapshot) => {
    const count = snapshot.exists() ? snapshot.val() : 0;
    callback(count);
  });
}

export async function updateCandidatePhotos() {
  const groupsRef = ref(database, 'election/groups');
  const snapshot = await get(groupsRef);
  
  if (!snapshot.exists()) {
    throw new Error('Election data not found');
  }
  
  const data = snapshot.val();
  const updates: Record<string, any> = {};
  
  // Update photos from ELECTION_CONFIG
  ELECTION_CONFIG.forEach((configGroup) => {
    if (data[configGroup.id] && data[configGroup.id].candidates) {
      configGroup.candidates.forEach((configCandidate) => {
        const candidatePath = `election/groups/${configGroup.id}/candidates/${configCandidate.id}/photo`;
        updates[candidatePath] = configCandidate.photo;
      });
    }
  });
  
  // Apply all updates
  const updatePromises = Object.keys(updates).map(path => {
    const pathRef = ref(database, path);
    return set(pathRef, updates[path]);
  });
  
  await Promise.all(updatePromises);
}
