"use client";
import React, { useEffect, useState } from "react";
import cardStyles from "../../styles/components/card.module.css";

import { handleLogin } from "./LoginPageFunctions";
import useUser from "../hooks/useUser";

const LoginPage = (): React.JSX.Element => {
  const [returnParam, setReturnParm] = useState<string>("");
  useEffect(() => {
    const ret = new URLSearchParams(document.location.search).get("return");
    if (ret) {
      setReturnParm(ret);
    }
  }, []);

  const { setLoggedIn, setToken } = useUser();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Attempting login with:", email);
      const user = await handleLogin(email, password);
      console.log("Login response:", user);
      if (user?.token) {
        console.log("Login successful, setting token and redirecting");
        setToken(user.token);
        setLoggedIn(true);

        // Redirect to the return URL or default to insights
        const redirectUrl = returnParam || "/insights";
        console.log("Redirecting to:", redirectUrl);
        if (window) {
          window.location.href = `${window.location.origin}${redirectUrl}`;
        }
      } else {
        console.log("No token in response");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    }
  };

  return (
    <div className={cardStyles.loginPageContainer}>
      <div className={cardStyles.loginCard}>
        <div className={cardStyles.loginCardHeader}>
          <h1 className={cardStyles.loginTitle}>Login to Inspect</h1>
          <p className={cardStyles.loginSubtitle}>
            Sign in to access your insights and continue your research
          </p>
        </div>

        <div className={cardStyles.loginCardBody}>
          <form
            name="loginInfo"
            onSubmit={handleSubmit}
            className={cardStyles.loginForm}
          >
            <div className={cardStyles.formGroup}>
              <label htmlFor="email" className={cardStyles.formLabel}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={cardStyles.formInput}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className={cardStyles.formGroup}>
              <label htmlFor="password" className={cardStyles.formLabel}>
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={cardStyles.formInput}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className={cardStyles.loginError}>
                <div className={cardStyles.errorIcon}>⚠️</div>
                <div className={cardStyles.errorMessage}>{error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={!(email && password)}
              className={`btn btn-primary btn-lg ${cardStyles.loginButton}`}
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
