"use client";

import React, { useState } from "react";
import Link from "next/link";

const ForgotPasswordForm = (): React.JSX.Element => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = Boolean(email) && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetUrl("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as {
        message?: string;
        resetUrl?: string;
      };

      if (!response.ok) {
        setError(data.message || "Unable to start password reset.");
        return;
      }

      setMessage(data.message || "Check your email for a reset link.");
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
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
        <h2>Forgot password</h2>
        <p style={{ color: "var(--color-muted)", marginBottom: "1.5rem" }}>
          Enter your account email and we&apos;ll create a reset link.
        </p>
        <form name="forgotPassword" onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="forgot-email" className="form-label">
              Email:
            </label>
            <input
              id="forgot-email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="form-input"
              required
            />
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn btn-primary w-full"
          >
            {isSubmitting ? "Sending…" : "Send reset link"}
          </button>
          {error && (
            <div className="alert alert-error">
              <div className="alert-content">
                <div className="alert-message">{error}</div>
              </div>
            </div>
          )}
          {message && (
            <div className="alert alert-success" style={{ marginTop: "1rem" }}>
              <div className="alert-content">
                <div className="alert-message">{message}</div>
              </div>
            </div>
          )}
          {resetUrl && (
            <p className="mt-4" style={{ wordBreak: "break-all" }}>
              Local reset link:{" "}
              <Link href={resetUrl}>{resetUrl}</Link>
            </p>
          )}
        </form>
        <p
          className="text-center mt-6"
          style={{ color: "var(--color-muted)" }}
        >
          Remembered it? <Link href="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
