"use client";

import React, { useEffect, useState } from "react";

import useUser from "../hooks/useUser";
import { handleRegister } from "./RegisterPageFunctions";

const RegisterPage = (): React.JSX.Element => {
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [returnParam, setReturnParm] = useState<string>();
  useEffect(() => {
    setReturnParm(
      new URLSearchParams(document.location.search).get("return") || undefined,
    );
  }, []);
  const { setLoggedIn, setToken } = useUser();

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
      <div className="card w-full max-w-lg">
        <div className="card-body p-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            Register for Inspect by Datagotchi Labs
          </h2>
          <form name="registerInfo" onSubmit={(e) => e.preventDefault()}>
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
            <div className="mb-4">
              <label className="form-label">Username:</label>
              <input
                type="text"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
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
              disabled={!(email && username && password)}
              onClick={async () => {
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
                  alert(err);
                }
              }}
              className="btn btn-primary w-full"
            >
              Register
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
