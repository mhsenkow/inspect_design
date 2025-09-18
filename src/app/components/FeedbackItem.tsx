"use client";

import React from "react";
import ReactionIcon from "./ReactionIcon";

interface FeedbackItemProps {
  reactions: Array<{ reaction: string; user_id?: number }>;
  currentUserId?: number;
  onReactionSubmit: (reaction: string) => Promise<void>;
  className?: string;
  children: React.ReactNode;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({
  reactions,
  currentUserId,
  onReactionSubmit,
  className = "",
  children,
}) => {
  return (
    <div className={`feedback-item-container ${className}`}>
      <div className="feedback-item-content">{children}</div>

      <ReactionIcon
        reactions={reactions}
        currentUserId={currentUserId}
        onReactionSubmit={onReactionSubmit}
        className="feedback-item-reaction-icon"
      />
    </div>
  );
};

export default FeedbackItem;
