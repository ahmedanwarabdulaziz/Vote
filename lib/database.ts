import { ref, set, onValue, get, update, increment, decrement } from 'firebase/database';
import { database } from './firebase';
import { ElectionGroup, Candidate } from './types';
import { ELECTION_CONFIG } from './electionData';

const ELECTION_REF = ref(database, 'election');

// Initialize election data
export async function initializeElection(groups: ElectionGroup[]) {
  const electionData: Record<string, any> = {};
  
  groups.forEach(group => {
    electionData[group.id] = {
      name: group.name,
      winnersCount: group.winnersCount,
      candidates: {},
    };
    
    group.candidates.forEach(candidate => {
      electionData[group.id].candidates[candidate.id] = {
        name: candidate.name,
        photo: candidate.photo,
        votes: 0,
        number: candidate.number,
      };
    });
  });
  
  await set(ELECTION_REF, {
    groups: electionData,
    isActive: true,
    createdAt: Date.now(),
  });
}

// Get current election data
export async function getElectionData(): Promise<ElectionGroup[]> {
  const snapshot = await get(ELECTION_REF);
  if (!snapshot.exists()) {
    return [];
  }
  
  const data = snapshot.val();
  const groups: ElectionGroup[] = [];
  
  Object.keys(data.groups).forEach(groupId => {
    const groupData = data.groups[groupId];
    const candidates: Candidate[] = [];
    
    Object.keys(groupData.candidates).forEach(candidateId => {
      // Try to find in ELECTION_CONFIG for latest photo
      const configGroup = ELECTION_CONFIG.find(g => g.id === groupId);
      const configCandidate = configGroup?.candidates.find(c => c.id === candidateId);
      
      let candidatePhoto = groupData.candidates[candidateId].photo;
      // Always use latest photo from ELECTION_CONFIG if available
      if (configCandidate?.photo) {
        candidatePhoto = configCandidate.photo;
      }
      
      candidates.push({
        id: candidateId,
        name: groupData.candidates[candidateId].name,
        photo: candidatePhoto,
        votes: groupData.candidates[candidateId].votes || 0,
        number: groupData.candidates[candidateId].number || 0,
      });
    });
    
    groups.push({
      id: groupId,
      name: groupData.name,
      winnersCount: groupData.winnersCount,
      candidates,
    });
  });
  
  return groups;
}

// Subscribe to election data changes
export function subscribeToElection(
  callback: (groups: ElectionGroup[]) => void
): () => void {
  const groupsRef = ref(database, 'election/groups');
  
  return onValue(groupsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const data = snapshot.val();
    const groups: ElectionGroup[] = [];
    
    Object.keys(data).forEach(groupId => {
      const groupData = data[groupId];
      const candidates: Candidate[] = [];
      
      Object.keys(groupData.candidates).forEach(candidateId => {
        // Get data from database, or fallback to ELECTION_CONFIG
        let candidateNumber = groupData.candidates[candidateId].number;
        let candidatePhoto = groupData.candidates[candidateId].photo;
        
        // Try to find in ELECTION_CONFIG for latest data
        const configGroup = ELECTION_CONFIG.find(g => g.id === groupId);
        const configCandidate = configGroup?.candidates.find(c => c.id === candidateId);
        
        if (candidateNumber === undefined || candidateNumber === null) {
          candidateNumber = configCandidate?.number ?? 0;
        }
        
        // Always use latest photo from ELECTION_CONFIG if available
        if (configCandidate?.photo) {
          candidatePhoto = configCandidate.photo;
        }
        
        candidates.push({
          id: candidateId,
          name: groupData.candidates[candidateId].name,
          photo: candidatePhoto,
          votes: groupData.candidates[candidateId].votes || 0,
          number: candidateNumber,
        });
      });
      
      groups.push({
        id: groupId,
        name: groupData.name,
        winnersCount: groupData.winnersCount,
        candidates,
      });
    });
    
    callback(groups);
  });
}

// Add vote to candidate
export async function addVote(groupId: string, candidateId: string) {
  const candidateRef = ref(database, `election/groups/${groupId}/candidates/${candidateId}/votes`);
  const currentSnapshot = await get(candidateRef);
  const currentVotes = currentSnapshot.exists() ? currentSnapshot.val() : 0;
  await set(candidateRef, currentVotes + 1);
  
  // Log vote entry
  const voteLogRef = ref(database, `election/voteLog/${Date.now()}`);
  await set(voteLogRef, {
    groupId,
    candidateId,
    type: 'add',
    timestamp: Date.now(),
  });
}

// Subtract vote from candidate
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
    timestamp: Date.now(),
  });
}

// Get wrong vote count
export async function getWrongVoteCount(): Promise<number> {
  const wrongVotesRef = ref(database, 'election/wrongVotes');
  const snapshot = await get(wrongVotesRef);
  return snapshot.exists() ? snapshot.val() : 0;
}

// Subscribe to wrong vote count changes
export function subscribeToWrongVotes(
  callback: (count: number) => void
): () => void {
  const wrongVotesRef = ref(database, 'election/wrongVotes');
  
  return onValue(wrongVotesRef, (snapshot) => {
    const count = snapshot.exists() ? snapshot.val() : 0;
    callback(count);
  });
}

// Add wrong vote
export async function addWrongVote() {
  const wrongVotesRef = ref(database, 'election/wrongVotes');
  const currentSnapshot = await get(wrongVotesRef);
  const currentCount = currentSnapshot.exists() ? currentSnapshot.val() : 0;
  await set(wrongVotesRef, currentCount + 1);
  
  // Log wrong vote entry
  const voteLogRef = ref(database, `election/voteLog/${Date.now()}`);
  await set(voteLogRef, {
    type: 'wrong',
    timestamp: Date.now(),
  });
}

// Subtract wrong vote (correction)
export async function subtractWrongVote() {
  const wrongVotesRef = ref(database, 'election/wrongVotes');
  const currentSnapshot = await get(wrongVotesRef);
  const currentCount = currentSnapshot.exists() ? currentSnapshot.val() : 0;
  const newCount = Math.max(0, currentCount - 1);
  await set(wrongVotesRef, newCount);
}

// Batch add votes for multiple candidates (for paper-based entry)
export async function batchAddVotes(votes: Array<{ groupId: string; candidateId: string }>) {
  if (votes.length === 0) return;
  
  // Validate inputs
  const validVotes = votes.filter(({ groupId, candidateId }) => {
    return groupId && candidateId && 
           typeof groupId === 'string' && 
           typeof candidateId === 'string' &&
           !groupId.includes('.') && 
           !candidateId.includes('.');
  });
  
  if (validVotes.length === 0) {
    throw new Error('No valid votes to process');
  }
  
  // Get current votes for all candidates first
  const votePromises = validVotes.map(async ({ groupId, candidateId }) => {
    const candidateRef = ref(database, `election/groups/${groupId}/candidates/${candidateId}/votes`);
    const snapshot = await get(candidateRef);
    const currentVotes = snapshot.exists() ? snapshot.val() : 0;
    return { groupId, candidateId, currentVotes };
  });
  
  const currentVotes = await Promise.all(votePromises);
  const timestamp = Date.now();
  const updates: Record<string, any> = {};
  
  // Prepare updates with correct Firebase path structure
  currentVotes.forEach(({ groupId, candidateId, currentVotes }, index) => {
    // Update vote count - ensure paths are valid
    const votePath = `election/groups/${groupId}/candidates/${candidateId}/votes`;
    updates[votePath] = currentVotes + 1;
    
    // Add vote log entry - use a safer key format
    const logKey = `election/voteLog/${timestamp}_${index}_${candidateId.replace(/[.#$\[\]]/g, '_')}`;
    updates[logKey] = {
      groupId,
      candidateId,
      type: 'add',
      timestamp,
    };
  });
  
  // Execute all updates at once
  await update(ref(database, '/'), updates);
}

// Update candidate numbers in existing database (migration function)
export async function updateCandidateNumbers() {
  const updates: Record<string, number> = {};
  
  ELECTION_CONFIG.forEach(group => {
    group.candidates.forEach(candidate => {
      updates[`election/groups/${group.id}/candidates/${candidate.id}/number`] = candidate.number;
    });
  });
  
  if (Object.keys(updates).length > 0) {
    await update(ref(database, '/'), updates);
  }
}

// Update candidate photos in existing database (preserves votes)
export async function updateCandidatePhotos() {
  const updates: Record<string, string> = {};
  
  ELECTION_CONFIG.forEach(group => {
    group.candidates.forEach(candidate => {
      updates[`election/groups/${group.id}/candidates/${candidate.id}/photo`] = candidate.photo;
    });
  });
  
  if (Object.keys(updates).length > 0) {
    await update(ref(database, '/'), updates);
    console.log('Updated candidate photos in database');
  }
}

