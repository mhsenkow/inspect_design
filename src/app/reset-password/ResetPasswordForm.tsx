"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const ResetPasswordForm = (): React.JSX.Element => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    Boolean(token && password && confirmPassword) && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(data.message || "Unable to reset password.");
        return;
      }

      setMessage(data.message || "Password updated. Redirecting to sign in…");
      setTimeout(() => router.replace("/login"), 1000);
    } catch {
      setError("Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <header className="auth-card__header">
            <p className="auth-eyebrow">Inspect</p>
            <h1 className="auth-title">Reset password</h1>
            <p className="auth-lead">
              This reset link is missing a token.{" "}
              <Link href="/forgot-password" className="auth-footer__link">
                Request a new one
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
          <p className="auth-eyebrow">Inspect</p>
          <h1 className="auth-title">Choose a new password</h1>
          <p className="auth-lead">Pick something secure, then sign in again.</p>
        </header>

        <form name="resetPassword" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="new-password" className="form-label">
              New password
            </label>
            <div className="auth-password">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError("");
                }}
                className="form-input"
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
              <button
                type="button"
                className="auth-password__toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirm-password" className="form-label">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (error) setError("");
              }}
              className="form-input"
              placeholder="Re-enter password"
              minLength={6}
              required
            />
          </div>

          {error && (
            <div className="alert alert-error" role="alert" aria-live="assertive">
              <div className="alert-message">{error}</div>
            </div>
          )}
          {message && (
            <div className="alert alert-success" role="status" aria-live="polite">
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
          <Link href="/login" className="auth-footer__link">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
