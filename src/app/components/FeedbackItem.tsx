"use client";

import React from "react";
import ReactionIcon from "./ReactionIcon";
import cardStyles from "../../styles/components/card.module.css";

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
    <div className={`${cardStyles.feedbackItemContainer} ${className}`}>
      <div className={cardStyles.feedbackItemContent}>{children}</div>

      <div className={cardStyles.feedbackItemActions}>
        <ReactionIcon
          reactions={reactions}
          currentUserId={currentUserId}
          onReactionSubmit={onReactionSubmit}
          className={cardStyles.feedbackItemReactionIcon}
        />
      </div>
    </div>
  );
};

export default FeedbackItem;
