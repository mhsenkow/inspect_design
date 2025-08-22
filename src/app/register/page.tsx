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
    <div id="body">
      <h2>Register for Inspect by Datagotchi Labs</h2>
      <form name="registerInfo">
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
          Username:{" "}
          <input
            type="text"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
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
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
