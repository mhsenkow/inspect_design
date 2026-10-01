"use client";

import React, { useCallback, useEffect, useRef } from "react";
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

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  success?: string;
  className?: string;
}

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
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const firstField = dialog.querySelector<HTMLElement>(
        'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])',
      );
      (firstField || dialog).focus();
    }, 30);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (closeOnBackdropClick && event.target === event.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdropClick, onClose],
  );

  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) {
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
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`${styles.modalDialog} ${sizeClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
      >
        <ModalHeader>
          <h2 id={`${id}-title`} className={styles.modalTitle}>
            {title}
          </h2>
          {showCloseButton && (
            <button
              type="button"
              className={styles.modalCloseButton}
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

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  className = "",
}) => <div className={`${styles.modalHeader} ${className}`}>{children}</div>;

export const ModalBody: React.FC<ModalBodyProps> = ({
  children,
  className = "",
  scrollable = false,
}) => (
  <div
    className={`${styles.modalBody} ${scrollable ? styles.modalScrollable : ""} ${className}`}
  >
    {children}
  </div>
);

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className = "",
  alignment = "right",
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

export const TabNav: React.FC<TabNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
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

export const FormGroup: React.FC<FormGroupProps> = ({
  children,
  className = "",
}) => <div className={`${styles.formGroup} ${className}`}>{children}</div>;

export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  htmlFor,
  className = "",
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
  <div className={styles.formField}>
    <input className={`${styles.formInput} ${className}`} {...props} />
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
  <div className={styles.formField}>
    <textarea
      className={`${styles.formInput} ${styles.formTextarea} ${className}`}
      {...props}
    />
    {error && <div className={styles.formError}>{error}</div>}
    {success && <div className={styles.formSuccess}>{success}</div>}
  </div>
);

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
  className = "",
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

export const ModalLoadingState: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = "Loading...", className = "" }) => (
  <div className={`${styles.modalLoadingState} ${className}`}>
    <div className={styles.modalLoadingSpinner} />
    {message}
  </div>
);

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
