"use client";

import styles from "../../styles/components/login-register-links.module.css";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { usePathname } from "next/navigation";

import useUser from "../hooks/useUser";

const LoginRegisterLinks = ({
  loggedIn: loggedInFromServer,
}: {
  loggedIn: boolean;
}): React.JSX.Element => {
  const { logout, loggedIn: loggedInFromClient } = useUser();
  const path = usePathname();
  const [mounted, setMounted] = useState(false);
  const [cookieLoggedIn, setCookieLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Re-check the cookie on every route change. Login sets the cookie in a
  // different useUser instance, so we cannot rely on that hook alone.
  useEffect(() => {
    setCookieLoggedIn(!!Cookies.get("token"));
  }, [path, loggedInFromClient, loggedInFromServer]);

  const loggedIn = mounted
    ? loggedInFromClient || cookieLoggedIn || loggedInFromServer
    : loggedInFromServer;

  if (loggedIn) {
    return (
      <div className={styles.loginRegisterContainer}>
        <Link
          href="/change-password"
          className={styles.accountLink}
          title="Account"
        >
          Account
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            window.location.href = path || "/";
          }}
          className={styles.logoutButton}
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.loginRegisterContainer} ${styles.mobileAuth}`}>
      {path !== "/login" && (
        <Link
          href={`/login?return=${encodeURIComponent(path || "/")}`}
          className={styles.loginButton}
        >
          Login
        </Link>
      )}
      {path !== "/register" && (
        <Link
          href={`/register?return=${encodeURIComponent(path || "/")}`}
          className={styles.registerButton}
        >
          Register
        </Link>
      )}
    </div>
  );
};

export default LoginRegisterLinks;
