"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import useUser from "../hooks/useUser";
import { handleRegister } from "./RegisterPageFunctions";
import { safeReturnPath } from "../lib/authPaths";

const RegisterForm = (): React.JSX.Element => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get("return"));

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loggedIn, setLoggedIn, setToken } = useUser();

  const canSubmit =
    Boolean(email.trim() && username.trim() && password) && !isSubmitting;

  useEffect(() => {
    if (loggedIn) {
      router.replace(returnTo);
    }
  }, [loggedIn, returnTo, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const newUser = await handleRegister({
        email,
        username,
        password,
      });

      if (!newUser?.token) {
        setError("Registration succeeded but no session was created.");
        return;
      }

      setToken(newUser.token);
      setLoggedIn(true);
      router.replace(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
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
          <h1 className="auth-title">Create account</h1>
          <p className="auth-lead">
            Start collecting insights. Takes under a minute.
          </p>
        </header>

        <form name="registerInfo" onSubmit={onSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="register-email" className="form-label">
              Email
            </label>
            <input
              id="register-email"
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

          <div className="auth-field">
            <label htmlFor="register-username" className="form-label">
              Username
            </label>
            <input
              id="register-username"
              type="text"
              name="username"
              autoComplete="username"
              spellCheck={false}
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                if (error) setError("");
              }}
              className="form-input"
              placeholder="Choose a username"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-password" className="form-label">
              Password
            </label>
            <div className="auth-password">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
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
            <p className="auth-hint">Minimum 6 characters.</p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert" aria-live="assertive">
              <div className="alert-message">
                {error}
                {/already exists/i.test(error) && (
                  <>
                    {" "}
                    <Link href="/forgot-password">Forgot password?</Link>
                  </>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="btn btn-primary w-full auth-submit"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link
            href={`/login?return=${encodeURIComponent(returnTo)}`}
            className="auth-footer__link"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
