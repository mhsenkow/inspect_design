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

      setMessage(data.message || "Password updated.");
      setTimeout(() => router.push("/login"), 1200);
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
          <h2>Reset password</h2>
          <p style={{ color: "var(--color-muted)" }}>
            This reset link is missing a token.{" "}
            <Link href="/forgot-password">Request a new one</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h2>Choose a new password</h2>
        <form name="resetPassword" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="new-password" className="form-label">
              New password:
            </label>
            <input
              id="new-password"
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="form-input"
              minLength={6}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="confirm-password" className="form-label">
              Confirm password:
            </label>
            <input
              id="confirm-password"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="form-input"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn btn-primary w-full"
          >
            {isSubmitting ? "Updating…" : "Update password"}
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
        </form>
        <p
          className="text-center mt-6"
          style={{ color: "var(--color-muted)" }}
        >
          <Link href="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
