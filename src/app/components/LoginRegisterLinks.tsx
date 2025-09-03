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
        <button
          onClick={() => {
            logout();
            window.location.href = returnPath || "/";
          }}
          className="btn btn-ghost text-secondary hover:text-primary hover:bg-secondary"
        >
          Log Out
        </button>
        <Link 
          href="/insights"
          className="btn btn-primary"
        >
          My Insights
        </Link>
      </>
    );
  }

  return (
    <>
      <Link 
        href={`/login?return=${returnPath}`}
        className="btn btn-ghost text-secondary hover:text-primary hover:bg-secondary"
      >
        Login
      </Link>
      <Link 
        href={`/register?return=${returnPath}`}
        className="btn btn-primary"
      >
        Register
      </Link>
    </>
  );
};

export default LoginRegisterLinks;
