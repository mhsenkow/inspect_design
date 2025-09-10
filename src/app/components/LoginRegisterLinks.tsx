"use client";
import styles from "../../styles/components/login-register-links.module.css";
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
      <div className={styles.loginRegisterContainer}>
        <button
          onClick={() => {
            logout();
            window.location.href = returnPath || "/";
          }}
          className={styles.logoutButton}
        >
          Log Out
        </button>
        <Link href="/insights" className={styles.myInsightsButton}>
          My Insights
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.loginRegisterContainer}>
      <li className={path === "/login" ? "active" : ""}>
        <Link 
          href={`/login?return=${returnPath}`} 
          className={styles.loginButton}
        >
          Login
        </Link>
      </li>
      <li className={path === "/register" ? "active" : ""}>
        <Link
          href={`/register?return=${returnPath}`}
          className={styles.registerButton}
        >
          Register
        </Link>
      </li>
    </div>
  );
};

export default LoginRegisterLinks;
