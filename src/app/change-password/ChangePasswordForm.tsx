"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import useUser from "../hooks/useUser";

const ChangePasswordForm = (): React.JSX.Element => {
  const router = useRouter();
  const { loggedIn, setLoggedIn, setToken } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

      setMessage(data.message || "Password changed.");
      setToken("");
      setLoggedIn(false);
      setTimeout(() => router.push("/login"), 1000);
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
          <h2>Change password</h2>
          <p style={{ color: "var(--color-muted)" }}>
            You need to be logged in.{" "}
            <Link href="/login">Login</Link> or{" "}
            <Link href="/forgot-password">reset your password</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h2>Change password</h2>
        <form name="changePassword" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="current-password" className="form-label">
              Current password:
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="change-new-password" className="form-label">
              New password:
            </label>
            <input
              id="change-new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="form-input"
              minLength={6}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="change-confirm-password" className="form-label">
              Confirm new password:
            </label>
            <input
              id="change-confirm-password"
              type="password"
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
      </div>
    </div>
  );
};

export default ChangePasswordForm;
