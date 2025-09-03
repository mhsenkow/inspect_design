"use client";
import React, { useEffect, useState } from "react";

import { handleLogin } from "./LoginPageFunctions";
import useUser from "../hooks/useUser";

const LoginPage = (): React.JSX.Element => {
  const [returnParam, setReturnParm] = useState("");
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

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-center mb-6">Login to Inspect</h2>
          <form name="loginInfo" onSubmit={(e) => e.preventDefault()}>
            <div className="mb-4">
              <label className="form-label">Email:</label>
              <input
                type="text"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="form-input"
              />
            </div>
            <div className="mb-6">
              <label className="form-label">Password:</label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="form-input"
              />
            </div>
            <button
              type="button"
              onClick={async (e) => {
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
              }}
              disabled={!(email && password)}
              className="btn btn-primary w-full"
            >
              Login
            </button>
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded text-sm">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
