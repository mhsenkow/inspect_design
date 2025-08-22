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
    <div id="body">
      <h2>Login to Inspect</h2>
      <form name="loginInfo">
        <label>
          Email:{" "}
          <input
            type="text"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password:{" "}
          <input
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button
          type="submit"
          onClick={async () => {
            try {
              const user = await handleLogin();
              if (user?.token) {
                setToken(user.token);
                setLoggedIn(true);

                if (window) {
                  window.open(
                    `${window.location.origin}${returnParam}`,
                    "_self",
                  );
                }
              }
            } catch (err) {
              if (err instanceof Error) {
                setError(err.message);
              } else {
                setError("An unknown error occurred.");
              }
            }
          }}
          disabled={!(email && password)}
        >
          Login
        </button>
        <div style={{ color: "red" }}>{error}</div>
      </form>
    </div>
  );
};

export default LoginPage;
