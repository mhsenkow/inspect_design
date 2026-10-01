"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import useUser from "../hooks/useUser";
import { handleRegister } from "./RegisterPageFunctions";

const RegisterForm = (): React.JSX.Element => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnParam = searchParams.get("return") || undefined;

  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setLoggedIn, setToken } = useUser();

  const canSubmit = Boolean(email && username && password) && !isSubmitting;

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

      if (returnParam) {
        router.push(returnParam);
      } else {
        router.push("/insights");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h2>Register for Inspect</h2>
          <form name="registerInfo" onSubmit={onSubmit}>
            <div className="mb-4">
              <label htmlFor="register-email" className="form-label">
                Email:
              </label>
              <input
                id="register-email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="register-username" className="form-label">
                Username:
              </label>
              <input
                id="register-username"
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="register-password" className="form-label">
                Password:
              </label>
              <input
                id="register-password"
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
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn btn-primary w-full"
            >
              {isSubmitting ? "Creating account…" : "Register"}
            </button>
            {error && (
              <div className="alert alert-error">
                <div className="alert-content">
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
              </div>
            )}
          </form>
          <p className="text-center mt-6" style={{ color: "var(--color-muted)" }}>
            Already have an account?{" "}
            <Link
              href={
                returnParam
                  ? `/login?return=${encodeURIComponent(returnParam)}`
                  : "/login"
              }
            >
              Login
            </Link>
            {" · "}
            <Link href="/forgot-password">Forgot password?</Link>
          </p>
      </div>
    </div>
  );
};

export default RegisterForm;
