'use client';

import { Candidate } from '@/lib/types';

interface ResultsCardProps {
  candidate: Candidate;
  groupId: string;
  rank?: number;
  isWinner?: boolean;
}

export default function ResultsCard({
  candidate,
  groupId,
  rank,
  isWinner = false,
}: ResultsCardProps) {
  return (
    <div 
      className={`relative rounded-lg shadow-md border-2 overflow-hidden h-full min-h-0 hover:shadow-lg transition-shadow flex flex-col ${
        isWinner ? 'border-green-500 bg-green-50' : 'border-gray-300'
      }`}
      style={{
        backgroundImage: candidate.photo ? `url(${candidate.photo})` : 'linear-gradient(to bottom right, #dbeafe, #e0e7ff)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white z-0"></div>
      
      {/* Rank Badge */}
      {rank !== undefined && (
        <div className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
          isWinner ? 'bg-green-600' : 'bg-gray-500'
        }`}>
          {rank}
        </div>
      )}
      
      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col h-full p-2">
        {/* Name */}
        <h3 className="text-sm font-bold text-center mb-2 text-gray-900 leading-tight flex items-center justify-center px-1 break-words min-h-[3rem] line-clamp-2">
          {candidate.name}
        </h3>
        
        {/* Vote Counter */}
        <div className="mb-2 flex items-center justify-center">
          <div className={`px-3 py-1.5 rounded-lg shadow-md ${
            isWinner ? 'bg-green-600' : 'bg-blue-600'
          } text-white`}>
            <div className="text-xl font-bold leading-none">
              {candidate.votes}
            </div>
          </div>
        </div>
        
        {/* Winner Badge */}
        {isWinner && (
          <div className="mt-auto text-center">
            <span className="inline-block bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
              فائز
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

