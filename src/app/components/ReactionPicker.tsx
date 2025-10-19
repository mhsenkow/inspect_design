"use client";

import React, { useState, useRef, useEffect } from "react";

interface ReactionPickerProps {
  onReactionSelect: (reaction: string) => void;
  onClose: () => void;
  isVisible: boolean;
  position?: "top" | "bottom" | "auto";
  buttonRef?: React.RefObject<any>;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({
  onReactionSelect,
  onClose,
  isVisible,
  position = "auto",
  buttonRef,
}) => {
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);
  const [pickerStyle, setPickerStyle] = useState<React.CSSProperties>({});
  const pickerRef = useRef<HTMLDivElement>(null);

  // Facebook-style reaction emojis
  const reactions = [
    { emoji: "👍", label: "Like" },
    { emoji: "❤️", label: "Love" },
    { emoji: "😂", label: "Haha" },
    { emoji: "😮", label: "Wow" },
    { emoji: "😢", label: "Sad" },
    { emoji: "😡", label: "Angry" },
  ];

  // Calculate optimal position when picker becomes visible
  useEffect(() => {
    if (isVisible && buttonRef?.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (buttonRef?.current) {
          const buttonRect = buttonRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const pickerHeight = 50;
          const pickerWidth = 180;

          // Calculate horizontal position (center on button)
          const buttonCenterX = buttonRect.left + buttonRect.width / 2;
          let leftPosition = buttonCenterX - pickerWidth / 2;

          // Keep within viewport bounds
          if (leftPosition < 10) leftPosition = 10;
          if (leftPosition + pickerWidth > window.innerWidth - 10) {
            leftPosition = window.innerWidth - pickerWidth - 10;
          }

          // Calculate vertical position (prefer above, fallback to below)
          const spaceAbove = buttonRect.top;
          const spaceBelow = viewportHeight - buttonRect.bottom;

          if (spaceAbove >= pickerHeight + 10 || spaceAbove > spaceBelow) {
            // Position above
            setPickerStyle({
              position: "fixed",
              left: `${leftPosition}px`,
              bottom: `${viewportHeight - buttonRect.top + 8}px`,
              zIndex: 1000,
            });
          } else {
            // Position below
            setPickerStyle({
              position: "fixed",
              left: `${leftPosition}px`,
              top: `${buttonRect.bottom + 8}px`,
              zIndex: 1000,
            });
          }
        }
      });
    }
  }, [isVisible, buttonRef]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isVisible, onClose]);

  // Close picker on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      ref={pickerRef}
      className="reaction-picker"
      style={pickerStyle}
      role="menu"
      aria-label="Choose a reaction"
    >
      <div className="reaction-picker-content">
        {reactions.map((reaction) => (
          <button
            key={reaction.emoji}
            className={`reaction-option ${hoveredEmoji === reaction.emoji ? "reaction-option-hovered" : ""}`}
            onClick={() => {
              onReactionSelect(reaction.emoji);
              onClose();
            }}
            onMouseEnter={() => setHoveredEmoji(reaction.emoji)}
            onMouseLeave={() => setHoveredEmoji(null)}
            aria-label={reaction.label}
            title={reaction.label}
            role="menuitem"
          >
            <span className="reaction-emoji">{reaction.emoji}</span>
            {hoveredEmoji === reaction.emoji && (
              <span className="reaction-label">{reaction.label}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReactionPicker;
