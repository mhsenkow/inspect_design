"use client";

import React, { useState } from "react";
import Link from "next/link";

const ForgotPasswordForm = (): React.JSX.Element => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetPath, setResetPath] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = Boolean(email.trim()) && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetPath("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await response.json()) as {
        message?: string;
        resetUrl?: string;
        resetPath?: string;
      };

      if (!response.ok) {
        setError(data.message || "Unable to start password reset.");
        return;
      }

      setMessage(data.message || "Check your email for a reset link.");
      const path =
        data.resetPath ||
        (data.resetUrl
          ? data.resetUrl.replace(/^https?:\/\/[^/]+/i, "")
          : "");
      if (path.startsWith("/reset-password")) {
        setResetPath(path);
      }
    } catch {
      setError("Unable to start password reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <header className="auth-card__header">
          <p className="auth-eyebrow">Inspect</p>
          <h1 className="auth-title">Forgot password</h1>
          <p className="auth-lead">
            Enter your account email. Locally, a reset link will appear on this
            page (email sending is not wired up yet).
          </p>
        </header>

        <form name="forgotPassword" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="forgot-email" className="form-label">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              name="email"
              autoComplete="email"
              autoFocus
              inputMode="email"
              spellCheck={false}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError("");
              }}
              className="form-input"
              placeholder="you@example.com"
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
          {resetPath && (
            <p className="auth-reset-link">
              Local reset link:{" "}
              <Link href={resetPath} data-testid="local-reset-link">
                Open reset page
              </Link>
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="btn btn-primary w-full auth-submit"
          >
            {isSubmitting ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="auth-footer">
          Remembered it?{" "}
          <Link href="/login" className="auth-footer__link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
