"use client";

import React, { useEffect, useState } from "react";
import cardStyles from "../../styles/components/card.module.css";

import useUser from "../hooks/useUser";
import { handleRegister } from "./RegisterPageFunctions";

const RegisterPage = (): React.JSX.Element => {
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [returnParam, setReturnParm] = useState<string>();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setReturnParm(
      new URLSearchParams(document.location.search).get("return") || undefined,
    );
  }, []);

  const { setLoggedIn, setToken } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password) {
      setError("Please fill out all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const newUser = await handleRegister();
      if (newUser) {
        if (newUser.token) {
          setToken(newUser.token);
          setLoggedIn(true);
        }
        if (newUser.enable_email_notifications) {
          open(
            `${window.location.origin}/follow?return=${returnParam}`,
            "_self",
          );
        } else if (returnParam) {
          open(`${window.location.origin}${returnParam}`, "_self");
        } else {
          open(`${window.location.origin}/confirm`, "_self");
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred during registration.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cardStyles.loginPageContainer}>
      <div className={cardStyles.loginCard}>
        <div className={cardStyles.loginCardHeader}>
          <h1 className={cardStyles.loginTitle}>Register for Inspect</h1>
          <p className={cardStyles.loginSubtitle}>
            Join Datagotchi Labs and start exploring insights
          </p>
        </div>

        <div className={cardStyles.loginCardBody}>
          <form
            name="registerInfo"
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
              <label htmlFor="username" className={cardStyles.formLabel}>
                Username
              </label>
              <input
                id="username"
                type="text"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className={cardStyles.formInput}
                placeholder="Choose a username"
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
                placeholder="Create a password"
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
              disabled={!(email && username && password) || isLoading}
              className={`btn btn-primary btn-lg ${cardStyles.loginButton} ${isLoading ? "btn-loading" : ""}`}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
