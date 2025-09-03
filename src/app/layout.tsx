import React from "react";
import Script from "next/script";
import { cookies } from "next/headers";
import { CookiesProvider } from "next-client-cookies/server";
import Image from "next/image";
import Link from "next/link";

import "bootstrap/dist/css/bootstrap.css";

import "./design-system.css";
import "./themes.css";
import "./style.css";
import LoginRegisterLinks from "./components/LoginRegisterLinks";
import ThemeSwitcher from "./components/ThemeSwitcher";
// import { getUserFromServer } from "./api/functions";

interface Props {
  children: React.ReactNode;
}

const Dashboard = async ({ children }: Props): Promise<React.JSX.Element> => {
  const tokenCookie = (await cookies()).get("token");
  const loggedIn = !!tokenCookie;
  // const authUser = await getAuthUser(headers);
  // const origin = (await headers()).get("x-origin");
  // const user = authUser
  //   ? await getUserFromServer(
  //       origin,
  //       { id: authUser.user_id },
  //       tokenCookie?.value,
  //     )
  //   : null;

  return (
    <html>
      <head>
        <Script src="/bootstrap.bundle.js" />
      </head>
      <body className="bg-background-secondary min-h-screen">
        {/* Header - Parent Level */}
        <header className="bg-background-inverse border-b border-border-primary shadow-sm sticky top-0 z-header">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex items-center justify-between h-16">
              {/* Left Navigation */}
              <div className="flex items-center space-x-4">
                <LoginRegisterLinks loggedIn={loggedIn} />
              </div>

              {/* Center Brand */}
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-text-inverse flex items-center tracking-tight">
                  Inspect
                  <div className="ml-3 w-8 h-8 bg-text-inverse rounded-lg flex items-center justify-center shadow-sm border border-border-primary">
                    <Image
                      src="/images/icon.png"
                      width="18"
                      height="18"
                      alt="Inspect Logo"
                      className="opacity-80"
                    />
                  </div>
                </h1>
              </div>

              {/* Right Navigation */}
              <div className="flex items-center space-x-4">
                <ThemeSwitcher />
                <Link
                  href="http://datagotchi.net"
                  target="_blank"
                  className="flex items-center p-2 bg-background-primary rounded-lg hover:bg-background-secondary transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Image
                    src="/images/Color1.png"
                    width="20"
                    height="20"
                    alt="Datagotchi Logo"
                    className="opacity-85"
                  />
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Main Level */}
        <main className="flex-1">
          <CookiesProvider>{children}</CookiesProvider>
        </main>
      </body>
    </html>
  );
};

export default Dashboard;
