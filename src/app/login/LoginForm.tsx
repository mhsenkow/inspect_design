"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { handleLogin } from "./LoginPageFunctions";
import useUser from "../hooks/useUser";

const LoginForm = (): React.JSX.Element => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnParam = searchParams.get("return") || "";

  const { setLoggedIn, setToken } = useUser();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = Boolean(email && password) && !isSubmitting;

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
      router.push(returnParam || "/insights");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h2>Login to Inspect</h2>
          <form name="loginInfo" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="form-label">
                Email:
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="mb-2">
              <label htmlFor="password" className="form-label">
                Password:
              </label>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="form-input"
                required
              />
            </div>
            <p className="mb-6" style={{ textAlign: "right" }}>
              <Link href="/forgot-password">Forgot password?</Link>
            </p>
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn btn-primary w-full"
            >
              {isSubmitting ? "Signing in…" : "Login"}
            </button>
            {error && (
              <div className="alert alert-error">
                <div className="alert-content">
                  <div className="alert-message">{error}</div>
                </div>
              </div>
            )}
          </form>
          <p className="text-center mt-6" style={{ color: "var(--color-muted)" }}>
            Need an account?{" "}
            <Link
              href={
                returnParam
                  ? `/register?return=${encodeURIComponent(returnParam)}`
                  : "/register"
              }
            >
              Register
            </Link>
          </p>
      </div>
    </div>
  );
};

export default LoginForm;
