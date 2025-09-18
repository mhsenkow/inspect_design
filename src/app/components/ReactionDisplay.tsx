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
          title={`${data.count} reaction${data.count > 1 ? "s" : ""}`}
        >
          <span className="reaction-emoji">{emoji}</span>
          {data.count > 1 && (
            <span className="reaction-count">{data.count}</span>
          )}
        </span>
      ))}
    </div>
  );
};

export default ReactionDisplay;
