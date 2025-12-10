'use client';

import { useState, useRef } from 'react';
import { Candidate } from '@/lib/types';

interface CandidateCardProps {
  candidate: Candidate;
  groupId: string;
  onAddVote: (groupId: string, candidateId: string) => void;
  onSubtractVote: (groupId: string, candidateId: string) => void;
}

export default function CandidateCard({
  candidate,
  groupId,
  onAddVote,
  onSubtractVote,
}: CandidateCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressActive = useRef(false);
  const lastVoteTime = useRef<number>(0);
  const voteDebounceTime = 400; // 400ms debounce between votes

  const handleAddVote = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Debounce: prevent rapid duplicate votes
    const now = Date.now();
    if (now - lastVoteTime.current < voteDebounceTime) {
      return;
    }
    lastVoteTime.current = now;
    
    if (isProcessing) return;
    setIsProcessing(true);
    onAddVote(groupId, candidate.id);
    setTimeout(() => setIsProcessing(false), 300);
  };

  const handleSubtractVote = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Debounce: prevent rapid duplicate votes
    const now = Date.now();
    if (now - lastVoteTime.current < voteDebounceTime) {
      return;
    }
    lastVoteTime.current = now;
    
    if (isProcessing) return;
    setIsProcessing(true);
    onSubtractVote(groupId, candidate.id);
    setTimeout(() => setIsProcessing(false), 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    longPressActive.current = false;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    longPressTimer.current = setTimeout(() => {
      longPressActive.current = true;
      handleSubtractVote(e);
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!longPressActive.current) {
      handleAddVote(e);
    }
    longPressActive.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.detail === 2) {
      // Double click - add vote (but prevent default double-click behavior)
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      handleAddVote(e);
    } else {
      longPressActive.current = false;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      longPressTimer.current = setTimeout(() => {
        longPressActive.current = true;
        handleSubtractVote(e);
      }, 500);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!longPressActive.current && e.detail === 1) {
      // Single click - add vote
      handleAddVote(e);
    }
    longPressActive.current = false;
  };

  // Handle click event - only for single clicks, prevent if mouse events already handled
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Prevent if this is part of a mouseDown/mouseUp sequence
    // Only process if it's a standalone click
    const timeSinceMouseUp = Date.now() - lastVoteTime.current;
    if (timeSinceMouseUp > 100) {
      handleAddVote(e);
    }
  };

  return (
    <div 
      className="relative rounded-lg shadow-md border border-gray-300 overflow-hidden h-full min-h-0 hover:shadow-lg transition-shadow flex flex-col"
      style={{
        backgroundImage: candidate.photo ? `url(${candidate.photo})` : 'linear-gradient(to bottom right, #dbeafe, #e0e7ff)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Gradient Overlay - 0% at top, 100% at bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white z-0"></div>
      
      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col h-full p-2">
        {/* Name - Big and Prominent */}
        <h3 className="text-sm font-bold text-center mb-2 text-gray-900 leading-tight flex items-center justify-center px-1 break-words min-h-[3rem] line-clamp-2">
          {candidate.name}
        </h3>
        
        {/* Vote Counter - Above Buttons */}
        <div className="mb-2 flex items-center justify-center">
          <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-md">
            <div className="text-xl font-bold leading-none">
              {candidate.votes}
            </div>
          </div>
        </div>
        
        {/* Buttons Row */}
        <div className="flex items-stretch gap-1.5 w-full mt-auto flex-shrink-0">
          {/* Big +1 Button */}
          <button
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            disabled={isProcessing}
            className="flex-[2] bg-gradient-to-b from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 text-white font-bold py-3 px-2 rounded-lg text-lg shadow-md hover:shadow-lg transition-all no-select disabled:opacity-50 min-h-[3.5rem] flex items-center justify-center"
          >
            +1
          </button>
          
          {/* Small -1 Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubtractVote(e);
            }}
            disabled={isProcessing || candidate.votes === 0}
            className="flex-1 bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 text-white font-bold py-1.5 px-1 rounded-lg text-xs shadow hover:shadow-md transition-all no-select disabled:opacity-50 min-h-[2rem] flex items-center justify-center"
          >
            -1
          </button>
        </div>
      </div>
    </div>
  );
}

