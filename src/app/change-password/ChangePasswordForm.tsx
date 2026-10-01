"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import useUser from "../hooks/useUser";

const ChangePasswordForm = (): React.JSX.Element => {
  const router = useRouter();
  const { loggedIn, logout } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    Boolean(currentPassword && newPassword && confirmPassword) && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.trim().length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(data.message || "Unable to change password.");
        return;
      }

      setMessage(data.message || "Password changed. Please sign in again.");
      logout();
      setTimeout(() => router.replace("/login"), 1000);
    } catch {
      setError("Unable to change password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loggedIn) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <header className="auth-card__header">
            <p className="auth-eyebrow">Inspect</p>
            <h1 className="auth-title">Change password</h1>
            <p className="auth-lead">
              You need to be signed in.{" "}
              <Link href="/login" className="auth-footer__link">
                Sign in
              </Link>{" "}
              or{" "}
              <Link href="/forgot-password" className="auth-footer__link">
                reset your password
              </Link>
              .
            </p>
          </header>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <header className="auth-card__header">
          <p className="auth-eyebrow">Account</p>
          <h1 className="auth-title">Change password</h1>
          <p className="auth-lead">
            After updating, you&apos;ll sign in again with the new password.
          </p>
        </header>

        <form name="changePassword" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="current-password" className="form-label">
              Current password
            </label>
            <input
              id="current-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              autoFocus
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                if (error) setError("");
              }}
              className="form-input"
              required
            />
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor="change-new-password" className="form-label">
                New password
              </label>
              <button
                type="button"
                className="auth-inline-link"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id="change-new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                if (error) setError("");
              }}
              className="form-input"
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="change-confirm-password" className="form-label">
              Confirm new password
            </label>
            <input
              id="change-confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (error) setError("");
              }}
              className="form-input"
              placeholder="Re-enter new password"
              minLength={6}
              required
            />
          </div>

          {error && (
            <div
              className="alert alert-error"
              role="alert"
              aria-live="assertive"
            >
              <div className="alert-message">{error}</div>
            </div>
          )}
          {message && (
            <div
              className="alert alert-success"
              role="status"
              aria-live="polite"
            >
              <div className="alert-message">{message}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="btn btn-primary w-full auth-submit"
          >
            {isSubmitting ? "Updating…" : "Update password"}
          </button>
        </form>

        <p className="auth-footer">
          <Link href="/insights" className="auth-footer__link">
            Back to insights
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ChangePasswordForm;
