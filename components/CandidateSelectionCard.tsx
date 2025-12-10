'use client';

import { Candidate } from '@/lib/types';

interface CandidateSelectionCardProps {
  candidate: Candidate;
  isSelected: boolean;
  isDisabled?: boolean;
  groupId?: string;
  onToggle: () => void;
}

export default function CandidateSelectionCard({
  candidate,
  isSelected,
  isDisabled = false,
  groupId,
  onToggle,
}: CandidateSelectionCardProps) {
  // Get section-specific colors based on groupId
  const getCardClasses = () => {
    if (isDisabled && !isSelected) {
      return 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed';
    }
    
    if (isSelected) {
      switch (groupId) {
        case 'head':
          return 'border-blue-600 shadow-md bg-gradient-to-b from-blue-200 to-blue-300 cursor-pointer ring-2 ring-blue-400 ring-opacity-50';
        case 'head-assistant':
          return 'border-green-600 shadow-md bg-gradient-to-b from-green-200 to-green-300 cursor-pointer ring-2 ring-green-400 ring-opacity-50';
        case 'finance':
          return 'border-purple-600 shadow-md bg-gradient-to-b from-purple-200 to-purple-300 cursor-pointer ring-2 ring-purple-400 ring-opacity-50';
        case 'members':
          return 'border-amber-600 shadow-md bg-gradient-to-b from-amber-200 to-amber-300 cursor-pointer ring-2 ring-amber-400 ring-opacity-50';
        case 'under-age':
          return 'border-pink-600 shadow-md bg-gradient-to-b from-pink-200 to-pink-300 cursor-pointer ring-2 ring-pink-400 ring-opacity-50';
        default:
          return 'border-blue-600 shadow-md bg-gradient-to-b from-blue-200 to-blue-300 cursor-pointer ring-2 ring-blue-400 ring-opacity-50';
      }
    }
    
    // Not selected state
    switch (groupId) {
      case 'head':
        return 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:shadow-md cursor-pointer';
      case 'head-assistant':
        return 'border-green-300 bg-green-50 hover:border-green-400 hover:shadow-md cursor-pointer';
      case 'finance':
        return 'border-purple-300 bg-purple-50 hover:border-purple-400 hover:shadow-md cursor-pointer';
      case 'members':
        return 'border-amber-300 bg-amber-50 hover:border-amber-400 hover:shadow-md cursor-pointer';
      case 'under-age':
        return 'border-pink-300 bg-pink-50 hover:border-pink-400 hover:shadow-md cursor-pointer';
      default:
        return 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-md cursor-pointer';
    }
  };

  return (
    <div 
      onClick={isDisabled ? undefined : onToggle}
      className={`relative rounded-lg shadow-sm border-2 transition-all duration-200 flex flex-col items-center gap-1 p-2 h-full ${getCardClasses()}`}
    >
      {/* Selection Checkmark - Top Right */}
      {isSelected && (
        <div className={`absolute -top-1 -right-1 rounded-full p-1.5 shadow-lg z-10 ${
          groupId === 'head' ? 'bg-blue-600' :
          groupId === 'head-assistant' ? 'bg-green-600' :
          groupId === 'finance' ? 'bg-purple-600' :
          groupId === 'members' ? 'bg-amber-600' :
          groupId === 'under-age' ? 'bg-pink-600' :
          'bg-blue-600'
        }`}>
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      
      {/* Number Badge */}
      <div className={`min-w-[32px] h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0 ${
        isSelected 
          ? groupId === 'head' ? 'bg-blue-600 text-white' :
            groupId === 'head-assistant' ? 'bg-green-600 text-white' :
            groupId === 'finance' ? 'bg-purple-600 text-white' :
            groupId === 'members' ? 'bg-amber-600 text-white' :
            groupId === 'under-age' ? 'bg-pink-600 text-white' :
            'bg-blue-600 text-white'
          : 'bg-gray-700 text-white'
      }`}>
        {candidate.number !== undefined && candidate.number !== null ? candidate.number : '?'}
      </div>
      
      {/* Name Below */}
      <h3 className={`text-sm font-semibold leading-snug break-words line-clamp-2 text-center w-full ${
        isSelected 
          ? groupId === 'head' ? 'text-blue-900' :
            groupId === 'head-assistant' ? 'text-green-900' :
            groupId === 'finance' ? 'text-purple-900' :
            groupId === 'members' ? 'text-amber-900' :
            groupId === 'under-age' ? 'text-pink-900' :
            'text-blue-900'
          : 'text-gray-800'
      }`}>
        {candidate.name}
      </h3>
    </div>
  );
}
