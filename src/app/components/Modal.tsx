"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "../../styles/components/modal.module.css";

interface ModalProps {
  id: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: "small" | "default" | "large";
  className?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
  alignment?: "left" | "center" | "right";
}

interface TabNavProps {
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

interface FormLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  success?: string;
  className?: string;
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  success?: string;
  className?: string;
}

// Main Modal Component
export const Modal: React.FC<ModalProps> = ({
  id,
  title,
  isOpen,
  onClose,
  children,
  size = "default",
  className = "",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Focus the modal for accessibility
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  }, [closeOnBackdropClick, onClose]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (closeOnEscape && event.key === "Escape") {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isVisible) {
    return null;
  }

  const sizeClass = {
    small: styles.modalDialogSmall,
    default: "",
    large: styles.modalDialogLarge,
  }[size];

  return (
    <div
      ref={modalRef}
      className={`${styles.modal} ${className}`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      tabIndex={-1}
    >
      <div className={`${styles.modalDialog} ${sizeClass}`}>
        <ModalHeader>
          <h2 id={`${id}-title`} className={styles.modalTitle}>
            {title}
          </h2>
          {showCloseButton && (
            <button
              type="button"
              className={styles.modalButton}
              onClick={handleCloseClick}
              aria-label="Close modal"
            >
              ✕
            </button>
          )}
        </ModalHeader>
        {children}
      </div>
    </div>
  );
};

// Modal Sub-components
export const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className = "" }) => (
  <div className={`${styles.modalHeader} ${className}`}>
    {children}
  </div>
);

export const ModalBody: React.FC<ModalBodyProps> = ({ 
  children, 
  className = "", 
  scrollable = false 
}) => (
  <div className={`${styles.modalBody} ${scrollable ? styles.modalScrollable : ""} ${className}`}>
    {children}
  </div>
);

export const ModalFooter: React.FC<ModalFooterProps> = ({ 
  children, 
  className = "", 
  alignment = "right" 
}) => {
  const alignmentClass = {
    left: styles.modalFooterLeft,
    center: styles.modalFooterCenter,
    right: "",
  }[alignment];

  return (
    <div className={`${styles.modalFooter} ${alignmentClass} ${className}`}>
      {children}
    </div>
  );
};

// Tab Navigation Component
export const TabNav: React.FC<TabNavProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className = "" 
}) => (
  <div className={`${styles.tabNav} ${className}`}>
    {tabs.map((tab) => (
      <div key={tab.id} className={styles.tabNavItem}>
        <button
          type="button"
          className={`${styles.tabNavButton} ${activeTab === tab.id ? styles.active : ""}`}
          onClick={() => onTabChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-panel`}
        >
          {tab.label}
        </button>
      </div>
    ))}
  </div>
);

export const TabContent: React.FC<{ 
  tabId: string; 
  activeTab: string; 
  children: React.ReactNode;
  className?: string;
}> = ({ tabId, activeTab, children, className = "" }) => (
  <div
    id={`${tabId}-panel`}
    className={`${styles.tabContent} ${activeTab === tabId ? styles.active : ""} ${className}`}
    role="tabpanel"
    aria-labelledby={`${tabId}-tab`}
  >
    {children}
  </div>
);

// Form Components
export const FormGroup: React.FC<FormGroupProps> = ({ children, className = "" }) => (
  <div className={`${styles.formGroup} ${className}`}>
    {children}
  </div>
);

export const FormLabel: React.FC<FormLabelProps> = ({ 
  children, 
  htmlFor, 
  className = "" 
}) => (
  <label htmlFor={htmlFor} className={`${styles.formLabel} ${className}`}>
    {children}
  </label>
);

export const FormInput: React.FC<FormInputProps> = ({ 
  error, 
  success, 
  className = "", 
  ...props 
}) => (
  <div>
    <input
      className={`${styles.formInput} ${className}`}
      {...props}
    />
    {error && <div className={styles.formError}>{error}</div>}
    {success && <div className={styles.formSuccess}>{success}</div>}
  </div>
);

export const FormTextarea: React.FC<FormTextareaProps> = ({ 
  error, 
  success, 
  className = "", 
  ...props 
}) => (
  <div>
    <textarea
      className={`${styles.formInput} ${styles.formTextarea} ${className}`}
      {...props}
    />
    {error && <div className={styles.formError}>{error}</div>}
    {success && <div className={styles.formSuccess}>{success}</div>}
  </div>
);

// Button Components
export const ModalButton: React.FC<{
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}> = ({ 
  children, 
  variant = "primary", 
  onClick, 
  disabled = false,
  type = "button",
  className = "" 
}) => {
  const variantClass = {
    primary: styles.modalButtonPrimary,
    secondary: styles.modalButtonSecondary,
    danger: styles.modalButtonDanger,
  }[variant];

  return (
    <button
      type={type}
      className={`${styles.modalButton} ${variantClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Loading State Component
export const ModalLoadingState: React.FC<{ 
  message?: string; 
  className?: string; 
}> = ({ 
  message = "Loading...", 
  className = "" 
}) => (
  <div className={`${styles.modalLoadingState} ${className}`}>
    <div className={styles.modalLoadingSpinner} />
    {message}
  </div>
);

// Content Section Component
export const ModalContentSection: React.FC<{
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, children, className = "" }) => (
  <div className={`${styles.modalContentSection} ${className}`}>
    {title && <h3 className={styles.modalContentTitle}>{title}</h3>}
    {subtitle && <p className={styles.modalContentSubtitle}>{subtitle}</p>}
    {children}
  </div>
);

export default Modal;
