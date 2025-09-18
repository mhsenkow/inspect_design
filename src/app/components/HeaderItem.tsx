"use client";

import React from "react";
import ReactionIcon from "./ReactionIcon";

interface HeaderItemProps {
  reactions: Array<{ reaction: string; user_id?: number }>;
  currentUserId?: number;
  onReactionSubmit: (reaction: string) => Promise<void>;
  className?: string;
  children: React.ReactNode;
}

const HeaderItem: React.FC<HeaderItemProps> = ({
  reactions,
  currentUserId,
  onReactionSubmit,
  className = "",
  children,
}) => {
  return (
    <div className={`header-item-container ${className}`}>
      <div className="header-item-content">{children}</div>

      <ReactionIcon
        reactions={reactions}
        currentUserId={currentUserId}
        onReactionSubmit={onReactionSubmit}
        className="header-item-reaction-icon"
      />
    </div>
  );
};

export default HeaderItem;
