export interface Candidate {
  id: string;
  name: string;
  photo: string;
  votes: number;
  number: number;
}

export interface ElectionGroup {
  id: string;
  name: string;
  candidates: Candidate[];
  winnersCount: number;
}

export interface Election {
  id: string;
  groups: ElectionGroup[];
  isActive: boolean;
  createdAt: number;
}

export interface VoteEntry {
  candidateId: string;
  groupId: string;
  timestamp: number;
  type: 'add' | 'subtract';
}





