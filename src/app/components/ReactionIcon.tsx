"use client";

import React, { useState, useRef } from "react";
import ReactionPicker from "./ReactionPicker";

interface ReactionIconProps {
  reactions: Array<{ reaction: string; user_id?: number }>;
  currentUserId?: number;
  onReactionSubmit: (reaction: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const ReactionIcon: React.FC<ReactionIconProps> = ({
  reactions,
  currentUserId,
  onReactionSubmit,
  disabled = false,
  className = "",
}) => {
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleReactionSelect = async (reaction: string) => {
    if (disabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onReactionSubmit(reaction);
    } catch (error) {
      console.error("Failed to submit reaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isSubmitting) return;
    setIsPickerVisible(!isPickerVisible);
  };

  const closePicker = () => {
    setIsPickerVisible(false);
  };

  // Check if current user has reacted
  const userReaction = reactions?.find(
    (r) => r.user_id === Number(currentUserId),
  );
  const hasUserReacted = !!userReaction;

  // Debug logging
  console.log("ReactionIcon debug:", {
    reactions,
    currentUserId,
    userReaction,
    hasUserReacted,
    reactionCount: reactions?.length || 0,
    reactionsArray: reactions,
    currentUserIdType: typeof currentUserId,
  });

  return (
    <>
      <div
        ref={buttonRef}
        className={`reaction-icon ${className} ${hasUserReacted ? "reaction-icon-solid" : "reaction-icon-transparent"}`}
        onClick={togglePicker}
        role="button"
        tabIndex={0}
        aria-label={hasUserReacted ? "Change reaction" : "Add reaction"}
      >
        <span className="reaction-icon-emoji">
          {hasUserReacted ? userReaction.reaction : "😲"}
        </span>
        {isSubmitting && <span className="reaction-loading">...</span>}
      </div>

      <ReactionPicker
        onReactionSelect={handleReactionSelect}
        onClose={closePicker}
        isVisible={isPickerVisible}
        position="auto"
        buttonRef={buttonRef}
      />
    </>
  );
};

export default ReactionIcon;
