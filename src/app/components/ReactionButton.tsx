"use client";

import React, { useState, useRef } from "react";
import ReactionPicker from "./ReactionPicker";
import ReactionDisplay from "./ReactionDisplay";

interface ReactionButtonProps {
  reactions: Array<{ reaction: string; user_id?: number }>;
  currentUserId?: number;
  onReactionSubmit: (reaction: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

const ReactionButton: React.FC<ReactionButtonProps> = ({
  reactions,
  currentUserId,
  onReactionSubmit,
  disabled = false,
  className = "",
  showLabel = true,
  label = "React",
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

  const togglePicker = () => {
    if (disabled || isSubmitting) return;
    setIsPickerVisible(!isPickerVisible);
  };

  const closePicker = () => {
    setIsPickerVisible(false);
  };

  // Check if current user has reacted
  const userReaction = reactions?.find((r) => r.user_id === currentUserId);
  const hasUserReacted = !!userReaction;

  return (
    <div className={`reaction-button-container ${className}`} ref={buttonRef}>
      <button
        className={`reaction-button ${hasUserReacted ? "reaction-button-active" : ""} ${disabled || isSubmitting ? "reaction-button-disabled" : ""}`}
        onClick={togglePicker}
        disabled={disabled || isSubmitting}
        aria-label={hasUserReacted ? "Change reaction" : "Add reaction"}
        aria-expanded={isPickerVisible}
        aria-haspopup="menu"
      >
        <span className="reaction-button-icon">
          {hasUserReacted ? userReaction.reaction : "😲"}
        </span>
        {showLabel && <span className="reaction-button-label">{label}</span>}
        {isSubmitting && <span className="reaction-button-loading">...</span>}
      </button>

      <ReactionPicker
        onReactionSelect={handleReactionSelect}
        onClose={closePicker}
        isVisible={isPickerVisible}
        position="auto"
        buttonRef={buttonRef}
      />
    </div>
  );
};

export default ReactionButton;
