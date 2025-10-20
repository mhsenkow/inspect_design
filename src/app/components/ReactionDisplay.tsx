"use client";

import React from "react";

interface ReactionDisplayProps {
  reactions: Array<{ reaction: string; user_id?: number }>;
  currentUserId?: number;
  className?: string;
}

const ReactionDisplay: React.FC<ReactionDisplayProps> = ({
  reactions,
  currentUserId,
  className = "",
}) => {
  if (!reactions || reactions.length === 0) {
    return (
      <div className={`reaction-display ${className}`}>
        <span className="reaction-placeholder">😲 (no reactions)</span>
      </div>
    );
  }

  // Group reactions by emoji and count them
  const reactionCounts = reactions.reduce(
    (acc, reaction) => {
      const emoji = reaction.reaction;
      if (!acc[emoji]) {
        acc[emoji] = { count: 0, users: [] };
      }
      acc[emoji].count++;
      if (reaction.user_id) {
        acc[emoji].users.push(reaction.user_id);
      }
      return acc;
    },
    {} as Record<string, { count: number; users: number[] }>,
  );

  // Sort reactions by count (most popular first)
  const sortedReactions = Object.entries(reactionCounts).sort(
    ([, a], [, b]) => b.count - a.count,
  );

  // Helper function to get size class based on count
  const getSizeClass = (count: number): string => {
    if (count <= 5) {
      return `reaction-size-${count}`;
    }
    return "reaction-size-5";
  };

  // Helper function to get dot size class for counts above 5
  const getDotSizeClass = (count: number): string => {
    if (count <= 5) return "";
    const dotLevel = Math.min(Math.ceil((count - 5) / 5), 5);
    return `reaction-dot-size-${dotLevel}`;
  };

  // Helper function to render dots for counts above 5
  const renderDots = (count: number): React.JSX.Element[] => {
    if (count <= 5) return [];

    const dots = [];
    const dotCount = Math.min(count - 5, 5); // Max 5 dots
    const dotSizeClass = getDotSizeClass(count);

    for (let i = 0; i < dotCount; i++) {
      dots.push(<span key={i} className={`reaction-dot ${dotSizeClass}`} />);
    }

    return dots;
  };

  return (
    <div className={`reaction-display ${className}`}>
      {sortedReactions.map(([emoji, data]) => (
        <span
          key={emoji}
          className={`reaction-item ${
            currentUserId && data.users.includes(currentUserId)
              ? "reaction-item-current-user"
              : ""
          }`}
          title={`${emoji}: ${data.count} reaction${data.count !== 1 ? "s" : ""}`}
          aria-label={`${emoji}: ${data.count} reaction${data.count !== 1 ? "s" : ""}`}
        >
          <span className={`reaction-emoji ${getSizeClass(data.count)}`}>
            {emoji}
          </span>
          {renderDots(data.count)}
        </span>
      ))}
    </div>
  );
};

export default ReactionDisplay;
