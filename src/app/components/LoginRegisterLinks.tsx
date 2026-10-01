"use client";

import styles from "../../styles/components/login-register-links.module.css";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import useUser from "../hooks/useUser";

const LoginRegisterLinks = ({
  loggedIn,
}: {
  loggedIn: boolean;
}): React.JSX.Element => {
  const { logout } = useUser();
  const path = usePathname();

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
