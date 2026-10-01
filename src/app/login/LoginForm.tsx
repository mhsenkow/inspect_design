"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { handleLogin } from "./LoginPageFunctions";
import useUser from "../hooks/useUser";
import { friendlyAuthError, safeReturnPath } from "../lib/authPaths";

const LoginForm = (): React.JSX.Element => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get("return"));

  const { loggedIn, setLoggedIn, setToken } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = Boolean(email.trim() && password) && !isSubmitting;

  useEffect(() => {
    if (loggedIn) {
      router.replace(returnTo);
    }
  }, [loggedIn, returnTo, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await handleLogin(email, password);
      if (!user?.token) {
        setError("Login succeeded but no session was created.");
        return;
      }

      setToken(user.token);
      setLoggedIn(true);
      router.replace(returnTo);
    } catch (err) {
      const raw =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(friendlyAuthError(raw));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loggedIn) {
    return (
      <div className="auth-shell">
        <div className="auth-card auth-card--quiet">
          <p className="auth-lead">You’re already signed in. Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <header className="auth-card__header">
          <p className="auth-eyebrow">Inspect</p>
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-lead">
            Welcome back. Use your email and password to continue.
          </p>
        </header>

        <form name="loginInfo" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
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
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <Link href="/forgot-password" className="auth-inline-link">
                Forgot password?
              </Link>
            </div>
            <div className="auth-password">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError("");
                }}
                className="form-input"
                placeholder="Your password"
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

          {error && (
            <div
              id="login-error"
              className="alert alert-error"
              role="alert"
              aria-live="assertive"
            >
              <div className="alert-message">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="btn btn-primary w-full auth-submit"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          Need an account?{" "}
          <Link
            href={`/register?return=${encodeURIComponent(returnTo)}`}
            className="auth-footer__link"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
