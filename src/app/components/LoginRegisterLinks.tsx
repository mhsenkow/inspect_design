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
          className="btn btn-ghost text-inverse hover:text-inverse hover:bg-base-600 px-6 py-3 rounded-xl transition-all duration-200 font-medium text-base"
        >
          Log Out
        </button>
        <Link 
          href="/insights"
          className="btn btn-primary px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md text-base"
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
        className="btn btn-ghost text-inverse hover:text-inverse hover:bg-base-600 px-6 py-3 rounded-xl transition-all duration-200 font-medium text-base"
      >
        Login
      </Link>
      <Link 
        href={`/register?return=${returnPath}`}
        className="btn btn-primary px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md text-base"
      >
        Register
      </Link>
    </>
  );
};

export default LoginRegisterLinks;
