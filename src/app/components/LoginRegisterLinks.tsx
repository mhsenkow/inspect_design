"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import useUser from "../hooks/useUser";

const LoginRegisterLinks = ({
  loggedIn,
}: {
  loggedIn: boolean;
}): React.JSX.Element => {
  const [returnPath, setReturnPath] = useState<string>();
  useEffect(() => setReturnPath(window.location.pathname), []);

  const { logout } = useUser();
  const path = usePathname();

  if (loggedIn) {
    return (
      <>
        <li className={`nav-item ${path == "/login" ? "active" : ""}`}>
          <span
            className="nav-link"
            style={{ cursor: "pointer" }}
            onClick={() => {
              logout();
              window.location.href = returnPath || "/";
            }}
          >
            Log Out
          </span>
        </li>
        <li className={`nav-item ${path == "/login" ? "active" : ""}`}>
          <Link className="nav-link cta" href="/insights">
            My Insights
          </Link>
        </li>
      </>
    );
  }

  return (
    <>
      <li className={`nav-item ${path == "/login" ? "active" : ""}`}>
        <Link className="nav-link" href={`/login?return=${returnPath}`}>
          Login
        </Link>
      </li>
      <li className={`nav-item ${path == "/register" ? "active" : ""}`}>
        <Link className="nav-link cta" href={`/register?return=${returnPath}`}>
          Register
        </Link>
      </li>
    </>
  );
};

export default LoginRegisterLinks;
